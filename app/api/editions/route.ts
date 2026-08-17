import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { editions } from "../../../db/schema";
import { requireAdminApi } from "../../admin/auth";
import { getVoiceBucket } from "../../runtime-storage";

export const dynamic = "force-dynamic";

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
    const form = await request.formData();
    const editionNumber = String(form.get("editionNumber") || "").trim();
    const title = String(form.get("title") || "").trim();
    const year = Number(form.get("year"));
    const pdf = form.get("pdf");
    const cover = form.get("cover");
    if (!editionNumber || !title || !year || !(pdf instanceof File) || !(cover instanceof File)) return Response.json({ error: "Nomor edisi, judul, tahun, PDF, dan cover wajib diisi." }, { status: 400 });
    if (pdf.type !== "application/pdf") return Response.json({ error: "File majalah harus berformat PDF." }, { status: 400 });
    if (!cover.type.startsWith("image/")) return Response.json({ error: "Cover harus berupa gambar." }, { status: 400 });
    if (pdf.size > 100 * 1024 * 1024) return Response.json({ error: "Ukuran PDF maksimal 100 MB." }, { status: 400 });
    if (cover.size > 8 * 1024 * 1024) return Response.json({ error: "Ukuran cover maksimal 8 MB." }, { status: 400 });

    const id = crypto.randomUUID();
    const safeCoverType = cover.type === "image/png" ? "png" : cover.type === "image/webp" ? "webp" : "jpg";
    const pdfKey = `editions/${id}/magazine.pdf`;
    const coverKey = `editions/${id}/cover.${safeCoverType}`;
    const bucket = await getVoiceBucket();
    await Promise.all([
      bucket.put(pdfKey, await pdf.arrayBuffer(), { httpMetadata: { contentType: "application/pdf", contentDisposition: `inline; filename=VOICE-${editionNumber}.pdf` } }),
      bucket.put(coverKey, await cover.arrayBuffer(), { httpMetadata: { contentType: cover.type } }),
    ]);
    const db = await getDb();
    await db.insert(editions).values({ id, editionNumber, title, year, coverKey, pdfKey, pdfSize: pdf.size, createdBy: auth.user.email });
    return Response.json({ edition: { id, editionNumber, title, year } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload gagal." }, { status: 500 });
  }
}
