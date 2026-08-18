"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Logout gagal");
      window.location.replace("/");
    } catch {
      setBusy(false);
      window.alert("Logout gagal. Silakan coba lagi.");
    }
  }

  return <button type="button" onClick={logout} disabled={busy}>{busy ? "Keluar..." : "Keluar"}</button>;
}
