import { requireAdminApi } from "../../../../admin/auth";
import { getVoiceBucket } from "../../../../runtime-storage";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(request: Request, context: { params: Promise<{ id: string; kind: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  try {
    const { id, kind } = await context.params;
    if (!UUID_PATTERN.test(id) || (kind !== "pdf" && kind !== "cover")) {
      return Response.json({ error: "Target upload tidak valid." }, { status: 400 });
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    const contentType = request.headers.get("content-type") || "";
    const maxBytes = kind === "pdf" ? 100 * 1024 * 1024 : 8 * 1024 * 1024;

    if (!request.body || !contentLength) return Response.json({ error: "File upload kosong." }, { status: 400 });
    if (contentLength > maxBytes) return Response.json({ error: kind === "pdf" ? "Ukuran PDF maksimal 100 MB." : "Ukuran cover maksimal 8 MB." }, { status: 413 });
    if (kind === "pdf" && contentType !== "application/pdf") return Response.json({ error: "File majalah harus berformat PDF." }, { status: 400 });
    if (kind === "cover" && !contentType.startsWith("image/")) return Response.json({ error: "Cover harus berupa gambar." }, { status: 400 });

    const key = kind === "pdf" ? `editions/${id}/magazine.pdf` : `editions/${id}/cover`;
    const bucket = await getVoiceBucket();
    await bucket.put(key, request.body, {
      httpMetadata: kind === "pdf"
        ? { contentType: "application/pdf", contentDisposition: "inline" }
        : { contentType },
    });

    return Response.json({ ok: true, key });
  } catch (error) {
    console.error(JSON.stringify({ event: "edition_upload_failed", error: error instanceof Error ? error.message : String(error) }));
    return Response.json({ error: error instanceof Error ? error.message : "Upload file gagal." }, { status: 500 });
  }
}
