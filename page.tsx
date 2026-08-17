import Link from "next/link";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL, hasAdminSession } from "./auth";
import AdminPanel from "./panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  return (
    <main className="admin-page">
      <header className="admin-header"><Link href="/" className="admin-brand">VOICE <span>ADMIN</span></Link><div><span>{ADMIN_EMAIL}</span><a href="/api/admin/logout">Keluar</a></div></header>
      <AdminPanel />
    </main>
  );
}
