type StoredObject = {
  body: ReadableStream;
  httpEtag: string;
  size: number;
  writeHttpMetadata(headers: Headers): void;
};

type StoredObjectMetadata = {
  size: number;
};

type VoiceBucket = {
  put(key: string, value: ReadableStream | ArrayBuffer, options?: { httpMetadata?: { contentType?: string; contentDisposition?: string } }): Promise<unknown>;
  get(key: string): Promise<StoredObject | null>;
  head(key: string): Promise<StoredObjectMetadata | null>;
  delete(key: string): Promise<void>;
};

export async function getVoiceBucket(): Promise<VoiceBucket> {
  const { env } = await import("cloudflare:workers");
  return (env as unknown as { BUCKET: VoiceBucket }).BUCKET;
}
