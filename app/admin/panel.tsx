"use client";

import { FormEvent, useEffect, useState } from "react";

type Edition = { id: string; editionNumber: string; title: string; year: number; pdfSize: number };

export default function AdminPanel() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => { const response = await fetch("/api/editions", { cache: "no-store" }); const data = await response.json() as { editions?: Edition[] }; setEditions(data.editions || []); };
  useEffect(() => {
    fetch("/api/editions", { cache: "no-store" }).then((response) => response.json()).then((data: { editions?: Edition[] }) => setEditions(data.editions || [])).catch(() => setMessage("Daftar edisi gagal dimuat."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Mengunggah PDF dan cover... jangan tutup halaman.");
    const form = event.currentTarget;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch("/api/editions", { method: "POST", body: new FormData(form), signal: controller.signal });
      const raw = await response.text();
      let data: { error?: string } = {};
      try { data = raw ? JSON.parse(raw) as { error?: string } : {}; } catch { data = {}; }
      if (!response.ok) {
        setMessage(data.error || `Upload gagal — server HTTP ${response.status}. Kirim kode ini ke pengelola.`);
      } else {
        setMessage("Edisi berhasil diterbitkan ke rak.");
        form.reset();
        await load();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage("Upload dihentikan karena server tidak merespons dalam 2 menit. Coba lagi setelah konfigurasi diperiksa.");
      } else {
        setMessage(`Upload gagal tersambung ke server: ${error instanceof Error ? error.message : "kesalahan jaringan"}.`);
      }
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }

  async function remove(edition: Edition) {
    if (!window.confirm(`Hapus VOICE Edisi ${edition.editionNumber} - ${edition.title}?`)) return;
    const response = await fetch(`/api/editions/${edition.id}`, { method: "DELETE" });
    if (response.ok) { setMessage("Edisi berhasil dihapus."); await load(); } else setMessage("Edisi gagal dihapus.");
  }

  return <div className="admin-wrap">
    <section className="admin-intro"><p className="eyebrow">PANEL PENGELOLA</p><h1>Terbitkan edisi baru</h1><p>Upload PDF dan gambar cover. Setelah selesai, edisi otomatis muncul di rak publik.</p></section>
    <div className="admin-grid">
      <form className="upload-card" onSubmit={submit}>
        <h2>Informasi edisi</h2>
        <div className="form-row"><label>Nomor edisi<input name="editionNumber" required placeholder="Contoh: 161" /></label><label>Tahun<input name="year" type="number" required defaultValue={2026} min="2000" max="2100" /></label></div>
        <label>Judul utama<input name="title" required placeholder="Contoh: Rise and Build" /></label>
        <label className="file-field">File majalah PDF<input name="pdf" type="file" accept="application/pdf" required /><small>Maksimal 100 MB</small></label>
        <label className="file-field">Gambar cover<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" required /><small>JPG, PNG, atau WebP · maksimal 8 MB</small></label>
        <button className="publish-btn" disabled={busy}>{busy ? "Sedang mengunggah..." : "Terbitkan ke rak"}</button>
        {message && <p className="admin-message">{message}</p>}
      </form>
      <section className="edition-manager"><div className="manager-title"><h2>Edisi yang dikelola</h2><span>{editions.length + 1} edisi</span></div>
        <article className="manager-item fixed"><img src="/voice-160/page-01.jpg" alt="VOICE 160" /><div><strong>VOICE 160 · Level Up</strong><small>2025 · Edisi bawaan</small></div><span>Aktif</span></article>
        {editions.map((edition) => <article className="manager-item" key={edition.id}><img src={`/api/files/${edition.id}/cover`} alt={`VOICE ${edition.editionNumber}`} /><div><strong>VOICE {edition.editionNumber} · {edition.title}</strong><small>{edition.year} · {(edition.pdfSize / 1024 / 1024).toFixed(1)} MB</small></div><button onClick={() => remove(edition)}>Hapus</button></article>)}
      </section>
    </div>
  </div>;
}
