import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import Link from "next/link";
import { ADMIN_EMAIL } from "./auth";
import AdminPanel from "./panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL;
  return (
    <main className="admin-page">
      <header className="admin-header"><Link href="/" className="admin-brand">VOICE <span>ADMIN</span></Link><div><span>{user.email}</span><a href={chatGPTSignOutPath("/")}>Keluar</a></div></header>
      {isAdmin ? <AdminPanel /> : <section className="admin-denied"><h1>Akses tidak tersedia</h1><p>Akun ini tidak terdaftar sebagai admin VOICE FGBMFI.</p><Link href="/">Kembali ke perpustakaan</Link></section>}
    </main>
  );
}
