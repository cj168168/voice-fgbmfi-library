import { getChatGPTUser } from "../chatgpt-auth";

export const ADMIN_EMAIL = "johanchang168@gmail.com";

export async function requireAdminApi() {
  const user = await getChatGPTUser();
  if (!user) return { error: Response.json({ error: "Silakan masuk dengan ChatGPT." }, { status: 401 }) };
  if (user.email.toLowerCase() !== ADMIN_EMAIL) return { error: Response.json({ error: "Akun ini bukan admin VOICE." }, { status: 403 }) };
  return { user };
}
