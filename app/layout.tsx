import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirros — Beni Tanır mısın?",
  description: "Arkadaşlarını ne kadar tanıdığını keşfet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-dvh flex flex-col antialiased">{children}</body>
    </html>
  );
}
