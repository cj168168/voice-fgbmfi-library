"use client";

import { useEffect, useMemo, useState } from "react";
import PdfReader from "./pdf-reader";

const TOTAL_PAGES = 32;
type UploadedEdition = { id: string; editionNumber: string; title: string; year: number; pdfSize: number };

export default function Home() {
  const [readerOpen, setReaderOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [query, setQuery] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [editions, setEditions] = useState<UploadedEdition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<UploadedEdition | null>(null);
  const matches = useMemo(() => "VOICE Edisi 160 Level Up 2025".toLowerCase().includes(query.toLowerCase()), [query]);
  const filteredEditions = useMemo(() => editions.filter((edition) => `VOICE Edisi ${edition.editionNumber} ${edition.title} ${edition.year}`.toLowerCase().includes(query.toLowerCase())), [editions, query]);

  useEffect(() => {
    fetch("/api/editions", { cache: "no-store" }).then((response) => response.json()).then((data: { editions?: UploadedEdition[] }) => setEditions(data.editions || [])).catch(() => setEditions([]));
  }, []);

  const goTo = (nextPage: number) => {
    const bounded = Math.max(1, Math.min(TOTAL_PAGES, nextPage));
    setDirection(bounded >= page ? "next" : "prev");
    setPage(bounded);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!readerOpen) return;
      if (event.key === "ArrowRight") goTo(page + 1);
      if (event.key === "ArrowLeft") goTo(page - 1);
      if (event.key === "Escape") setReaderOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readerOpen, page]);

  const openReader = () => { setPage(1); setReaderOpen(true); };

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#library" aria-label="VOICE FGBMFI Digital Library">
          <span className="brand-mark"><img src="/fgbmfi-logo.jpeg" alt="Logo FGBMFI Indonesia" /></span>
          <span className="brand-copy"><strong>VOICE</strong><small>Digital Library</small></span>
        </a>
        <nav aria-label="Navigasi utama"><a href="#library">Koleksi</a><a href="#about">Tentang</a><a href="/admin">Admin</a></nav>
      </header>

      <section className="hero" id="library">
        <div className="hero-copy">
          <p className="eyebrow">FGBMFI INDONESIA</p>
          <h1>Men&apos;s Spiritual<br /><em>Journey Magazine</em></h1>
          <p className="hero-text">Kumpulan edisi VOICE dalam satu perpustakaan digital. Baca, bagikan, dan temukan perjalanan iman yang menginspirasi.</p>
          <button className="primary-btn" onClick={openReader}>Baca edisi terbaru <span>→</span></button>
        </div>
        <button className="featured-book" onClick={openReader} aria-label="Buka VOICE Edisi 160">
          <span className="glow" /><span className="book-3d"><img src="/voice-160/page-01.jpg" alt="Cover VOICE Edisi 160 - Level Up" /></span>
          <span className="edition-pill">EDISI TERBARU · 160</span>
        </button>
      </section>

      <section className="library-section">
        <div className="section-heading">
          <div><p className="eyebrow">KOLEKSI VOICE</p><h2>Pilih edisi untuk dibaca</h2></div>
          <label className="search"><span aria-hidden="true">⌕</span><input aria-label="Cari edisi atau tema" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari edisi atau tema..." /></label>
        </div>
        <div className="bookcase">
          <div className="case-top" />
          <div className="shelf-row">
            {matches ? <article className="book-card">
              <button className="shelf-book" onClick={openReader}><span className="book-spine" /><img src="/voice-160/page-01.jpg" alt="VOICE Edisi 160" /><span className="open-cue">BACA SEKARANG</span></button>
              <div className="book-info"><p>EDISI 160 · 2025</p><h3>Level Up</h3><span>32 halaman</span></div>
            </article> : <p className="empty-state">Edisi yang dicari belum ditemukan.</p>}
            {filteredEditions.map((edition) => <article className="book-card" key={edition.id}>
              <button className="shelf-book" onClick={() => setSelectedEdition(edition)}><span className="book-spine" /><img src={`/api/files/${edition.id}/cover`} alt={`VOICE Edisi ${edition.editionNumber}`} /><span className="open-cue">BACA SEKARANG</span></button>
              <div className="book-info"><p>EDISI {edition.editionNumber} · {edition.year}</p><h3>{edition.title}</h3><span>Flipbook digital</span></div>
            </article>)}
            {!query && <div className="coming-soon"><span>+</span><p>Edisi berikutnya</p><small>Kelola melalui panel admin</small></div>}
          </div>
          <div className="wood-shelf"><span /></div>
        </div>
      </section>

      <section className="about" id="about"><p className="eyebrow">TENTANG VOICE</p><h2>Kesaksian. Inspirasi. Transformasi.</h2><p>VOICE menyampaikan kisah perjalanan rohani, kepemimpinan, dan dunia usaha dari keluarga besar Full Gospel Business Men&apos;s Fellowship International Indonesia.</p></section>
      <footer><span>VOICE FGBMFI</span><p>Full Gospel Business Men&apos;s Fellowship International · Indonesia</p><small>© 2026</small></footer>

      {readerOpen && <div className={`reader ${fullscreen ? "reader-fullscreen" : ""}`} role="dialog" aria-modal="true" aria-label="Pembaca VOICE Edisi 160">
        <div className="reader-top"><div><strong>VOICE</strong><span>Edisi 160 · Level Up</span></div><div className="reader-actions"><button onClick={() => setFullscreen(!fullscreen)} aria-label="Ubah ukuran layar">{fullscreen ? "↙" : "⛶"}</button><button onClick={() => setReaderOpen(false)} aria-label="Tutup pembaca">×</button></div></div>
        <div className="reader-stage">
          <button className="page-arrow prev" onClick={() => goTo(page - 1)} disabled={page === 1} aria-label="Halaman sebelumnya">‹</button>
          <div key={page} className={`page-frame turn-${direction}`}><img src={`/voice-160/page-${String(page).padStart(2, "0")}.jpg`} alt={`VOICE Edisi 160 halaman ${page}`} /><span className="page-shadow" /></div>
          <button className="page-arrow next" onClick={() => goTo(page + 1)} disabled={page === TOTAL_PAGES} aria-label="Halaman berikutnya">›</button>
        </div>
        <div className="reader-bottom"><button onClick={() => goTo(1)} disabled={page === 1}>«</button><input aria-label="Pilih halaman" type="range" min="1" max={TOTAL_PAGES} value={page} onChange={(e) => goTo(Number(e.target.value))} /><span><strong>{page}</strong> / {TOTAL_PAGES}</span><button onClick={() => goTo(TOTAL_PAGES)} disabled={page === TOTAL_PAGES}>»</button></div>
      </div>}
      {selectedEdition && <PdfReader url={`/api/files/${selectedEdition.id}/pdf`} label={`Edisi ${selectedEdition.editionNumber} · ${selectedEdition.title}`} onClose={() => setSelectedEdition(null)} />}
    </main>
  );
}
