import { ADMIN_COOKIE } from "../../../admin/auth";

function clearSession(response: Response): Response {
  response.headers.append("set-cookie", `${ADMIN_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`);
  response.headers.set("cache-control", "no-store");
  return response;
}

export async function POST() {
  return clearSession(Response.json({ ok: true }));
}

export async function GET(request: Request) {
  return clearSession(Response.redirect(new URL("/", request.url), 303));
}
