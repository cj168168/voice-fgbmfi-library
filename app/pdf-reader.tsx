"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

export default function PdfReader({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  useEffect(() => {
    let active = true;
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const pdf = await pdfjs.getDocument(url).promise;
      if (!active) return;
      documentRef.current = pdf; setTotal(pdf.numPages); setLoading(false);
    })();
    return () => { active = false; documentRef.current?.destroy?.(); };
  }, [url]);

  useEffect(() => {
    if (!documentRef.current || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      const pdfPage = await documentRef.current.getPage(page);
      if (cancelled || !canvasRef.current) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const maxWidth = Math.min(window.innerWidth - 120, 900);
      const maxHeight = window.innerHeight - 170;
      const scale = Math.min(maxWidth / base.width, maxHeight / base.height) * Math.min(window.devicePixelRatio, 2);
      const viewport = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = viewport.width; canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / Math.min(window.devicePixelRatio, 2)}px`;
      canvas.style.height = `${viewport.height / Math.min(window.devicePixelRatio, 2)}px`;
      await pdfPage.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    })();
    return () => { cancelled = true; };
  }, [page, total]);

  const go = (value: number) => { const next = Math.max(1, Math.min(total, value)); setDirection(next >= page ? "next" : "prev"); setPage(next); };

  return <div className="reader reader-fullscreen" role="dialog" aria-modal="true" aria-label={`Pembaca ${label}`}>
    <div className="reader-top"><div><strong>VOICE</strong><span>{label}</span></div><div className="reader-actions"><button onClick={onClose} aria-label="Tutup pembaca">×</button></div></div>
    <div className="reader-stage">
      <button className="page-arrow prev" onClick={() => go(page - 1)} disabled={page === 1 || loading} aria-label="Halaman sebelumnya">‹</button>
      <div key={page} className={`pdf-canvas-frame turn-${direction}`}>{loading ? <p className="pdf-loading">Menyiapkan majalah...</p> : <canvas ref={canvasRef} />}</div>
      <button className="page-arrow next" onClick={() => go(page + 1)} disabled={page === total || loading} aria-label="Halaman berikutnya">›</button>
    </div>
    <div className="reader-bottom"><button onClick={() => go(1)} disabled={page === 1}>«</button><input aria-label="Pilih halaman" type="range" min="1" max={Math.max(total, 1)} value={page} onChange={(e) => go(Number(e.target.value))} /><span><strong>{page}</strong> / {total || "…"}</span><button onClick={() => go(total)} disabled={!total || page === total}>»</button></div>
  </div>;
}
