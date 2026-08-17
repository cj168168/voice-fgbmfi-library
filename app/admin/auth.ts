import { cookies } from "next/headers";

export const ADMIN_EMAIL = "johanchang168@gmail.com";
export const ADMIN_COOKIE = "voice_admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

async function getAdminPassword(): Promise<string> {
  const { env } = await import("cloudflare:workers");
  return String((env as unknown as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD || "");
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function signature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return Array.from(signed, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function passwordIsValid(candidate: string): Promise<boolean> {
  const expected = await getAdminPassword();
  if (!expected || !candidate) return false;
  return bytesEqual(await digest(candidate), await digest(expected));
}

export async function createAdminToken(): Promise<string> {
  const secret = await getAdminPassword();
  if (!secret) throw new Error("ADMIN_PASSWORD belum dikonfigurasi.");
  const expiresAt = String(Date.now() + SESSION_SECONDS * 1000);
  return `${expiresAt}.${await signature(expiresAt, secret)}`;
}

export async function tokenIsValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expiresAt, suppliedSignature] = token.split(".");
  if (!expiresAt || !suppliedSignature || Number(expiresAt) <= Date.now()) return false;
  const secret = await getAdminPassword();
  if (!secret) return false;
  return bytesEqual(await digest(suppliedSignature), await digest(await signature(expiresAt, secret)));
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return tokenIsValid(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function requireAdminApi() {
  if (!(await hasAdminSession())) return { error: Response.json({ error: "Sesi admin berakhir. Silakan masuk kembali." }, { status: 401 }) };
  return { user: { email: ADMIN_EMAIL } };
}

export const adminCookieOptions = { httpOnly: true, secure: true, sameSite: "strict" as const, path: "/", maxAge: SESSION_SECONDS };
