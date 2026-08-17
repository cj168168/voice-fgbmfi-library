"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: form.get("password") }) });
    if (response.ok) window.location.href = "/admin";
    else { const data = await response.json() as { error?: string }; setMessage(data.error || "Login gagal."); setBusy(false); }
  }
  return <main className="admin-page">
    <header className="admin-header"><Link href="/" className="admin-brand">VOICE <span>ADMIN</span></Link></header>
    <div className="admin-wrap">
      <section className="admin-intro"><p className="eyebrow">PANEL PENGELOLA</p><h1>Masuk sebagai admin</h1><p>Gunakan password admin yang tersimpan aman di Cloudflare.</p></section>
      <form className="upload-card" onSubmit={submit} style={{ maxWidth: 520 }}><h2>Login admin</h2><label>Password<input name="password" type="password" required autoComplete="current-password" autoFocus /></label><button className="publish-btn" disabled={busy}>{busy ? "Memeriksa..." : "Masuk ke panel"}</button>{message && <p className="admin-message">{message}</p>}</form>
    </div>
  </main>;
}
