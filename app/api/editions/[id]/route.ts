import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { editions } from "../../../../db/schema";
import { requireAdminApi } from "../../../admin/auth";
import { getVoiceBucket } from "../../../runtime-storage";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  const db = await getDb();
  const [edition] = await db.select().from(editions).where(eq(editions.id, id)).limit(1);
  if (!edition) return Response.json({ error: "Edisi tidak ditemukan." }, { status: 404 });
  const bucket = await getVoiceBucket();
  await Promise.all([bucket.delete(edition.pdfKey), bucket.delete(edition.coverKey)]);
  await db.delete(editions).where(eq(editions.id, id));
  return Response.json({ ok: true });
}
