type StoredObject = {
  body: ReadableStream;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
};

type VoiceBucket = {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string; contentDisposition?: string } }): Promise<unknown>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
};

export async function getVoiceBucket(): Promise<VoiceBucket> {
  const { env } = await import("cloudflare:workers");
  return (env as unknown as { BUCKET: VoiceBucket }).BUCKET;
}
