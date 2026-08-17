import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { editions } from "../../../../../db/schema";
import { getVoiceBucket } from "../../../../runtime-storage";

export async function GET(_request: Request, context: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await context.params;
  if (kind !== "pdf" && kind !== "cover") return new Response("Not found", { status: 404 });
  const db = await getDb();
  const [edition] = await db.select().from(editions).where(eq(editions.id, id)).limit(1);
  if (!edition || edition.status !== "published") return new Response("Not found", { status: 404 });
  const bucket = await getVoiceBucket();
  const object = await bucket.get(kind === "pdf" ? edition.pdfKey : edition.coverKey);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=3600");
  return new Response(object.body, { headers });
}
