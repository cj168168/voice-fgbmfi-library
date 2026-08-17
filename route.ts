import { ADMIN_COOKIE, adminCookieOptions, createAdminToken, passwordIsValid } from "../../../admin/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!(await passwordIsValid(password))) return Response.json({ error: "Password admin salah." }, { status: 401 });
  const response = Response.json({ ok: true });
  response.headers.append("set-cookie", `${ADMIN_COOKIE}=${await createAdminToken()}; Path=${adminCookieOptions.path}; Max-Age=${adminCookieOptions.maxAge}; HttpOnly; Secure; SameSite=Strict`);
  return response;
}
