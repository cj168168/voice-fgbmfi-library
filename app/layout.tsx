import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VOICE FGBMFI Digital Library",
  description: "Perpustakaan digital majalah VOICE FGBMFI Indonesia.",
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
