"use client";

import { FormEvent, useEffect, useState } from "react";

type Edition = { id: string; editionNumber: string; title: string; year: number; pdfSize: number };

async function responseError(response: Response, fallback: string): Promise<string> {
  const raw = await response.text();
  try {
    const data = raw ? JSON.parse(raw) as { error?: string } : {};
    return data.error || fallback;
  } catch {
    return `${fallback} (HTTP ${response.status})`;
  }
}

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
    const form = event.currentTarget;
    const values = new FormData(form);
    const pdf = values.get("pdf");
    const cover = values.get("cover");
    if (!(pdf instanceof File) || !(cover instanceof File)) return;

    setBusy(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10 * 60 * 1000);
    const id = crypto.randomUUID();

    try {
      setMessage(`Mengunggah PDF ${(pdf.size / 1024 / 1024).toFixed(1)} MB langsung ke R2...`);
      const pdfResponse = await fetch(`/api/uploads/${id}/pdf`, {
        method: "PUT",
        headers: { "content-type": "application/pdf", "content-length": String(pdf.size) },
        body: pdf,
        signal: controller.signal,
      });
      if (!pdfResponse.ok) throw new Error(await responseError(pdfResponse, "Upload PDF gagal"));

      setMessage("PDF tersimpan. Mengunggah cover...");
      const coverResponse = await fetch(`/api/uploads/${id}/cover`, {
        method: "PUT",
        headers: { "content-type": cover.type || "image/jpeg", "content-length": String(cover.size) },
        body: cover,
        signal: controller.signal,
      });
      if (!coverResponse.ok) throw new Error(await responseError(coverResponse, "Upload cover gagal"));

      setMessage("File tersimpan. Menerbitkan edisi ke rak...");
      const publishResponse = await fetch("/api/editions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, editionNumber: values.get("editionNumber"), title: values.get("title"), year: values.get("year") }),
        signal: controller.signal,
      });
      if (!publishResponse.ok) throw new Error(await responseError(publishResponse, "Penerbitan edisi gagal"));

      setMessage("Edisi berhasil diterbitkan ke rak.");
      form.reset();
      await load();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") setMessage("Upload dihentikan setelah 10 menit tanpa respons.");
      else setMessage(error instanceof Error ? error.message : "Upload gagal tersambung ke server.");
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
    <section className="admin-intro"><p className="eyebrow">PANEL PENGELOLA</p><h1>Terbitkan edisi baru</h1><p>PDF dan cover dikirim langsung ke penyimpanan R2, kemudian edisi otomatis muncul di rak publik.</p></section>
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
