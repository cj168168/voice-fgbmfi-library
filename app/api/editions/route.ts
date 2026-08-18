import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { editions } from "../../../db/schema";
import { requireAdminApi } from "../../admin/auth";
import { getVoiceBucket } from "../../runtime-storage";

export const dynamic = "force-dynamic";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select({ id: editions.id, editionNumber: editions.editionNumber, title: editions.title, year: editions.year, pdfSize: editions.pdfSize, status: editions.status, createdAt: editions.createdAt }).from(editions).orderBy(desc(editions.createdAt));
    return Response.json({ editions: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Data edisi belum tersedia.";
    return Response.json({ editions: [], warning: message });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json() as { id?: unknown; editionNumber?: unknown; title?: unknown; year?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    const editionNumber = typeof body.editionNumber === "string" ? body.editionNumber.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const year = Number(body.year);

    if (!UUID_PATTERN.test(id) || !editionNumber || !title || !Number.isInteger(year) || year < 2000 || year > 2100) {
      return Response.json({ error: "Data edisi tidak lengkap atau tidak valid." }, { status: 400 });
    }

    const pdfKey = `editions/${id}/magazine.pdf`;
    const coverKey = `editions/${id}/cover`;
    const bucket = await getVoiceBucket();
    const [pdfObject, coverObject] = await Promise.all([bucket.head(pdfKey), bucket.head(coverKey)]);
    if (!pdfObject || !coverObject) return Response.json({ error: "PDF atau cover belum selesai tersimpan di R2." }, { status: 409 });

    const db = await getDb();
    await db.insert(editions).values({ id, editionNumber, title, year, coverKey, pdfKey, pdfSize: pdfObject.size, createdBy: auth.user.email });
    return Response.json({ edition: { id, editionNumber, title, year } }, { status: 201 });
  } catch (error) {
    console.error(JSON.stringify({ event: "edition_publish_failed", error: error instanceof Error ? error.message : String(error) }));
    return Response.json({ error: error instanceof Error ? error.message : "Penerbitan edisi gagal." }, { status: 500 });
  }
}
