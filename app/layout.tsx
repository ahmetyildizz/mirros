// Version: 2.0.1 - Advanced Auth Redesign
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "Mirros — Beni Tanır mısın?",
    template: "%s | Mirros"
  },
  description: "Arkadaşlarınla birbirinizi ne kadar tanıdığınızı keşfedin! Yapay zeka destekli, eğlenceli ve derinlikli bir sosyal oyun deneyimi.",
  keywords: ["Mirros", "sosyal oyun", "arkadaşlık testi", "yakınlık testi", "eğlenceli oyunlar", "buz kıran", "soru cevap"],
  authors: [{ name: "Mirros Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover",
  themeColor: "#030308",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://mirros.vercel.app",
    title: "Mirros — Beni Tanır mısın?",
    description: "Arkadaşlarınla birbirinizi ne kadar tanıdığınızı keşfedin! Yapay zeka ile zihinler arası bir yolculuk.",
    siteName: "Mirros",
    images: [
      {
        url: "https://mirros.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mirros Social Game",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirros — Beni Tanır mısın?",
    description: "Arkadaşlarınla birbirinizi ne kadar tanıdığınızı keşfedin!",
    images: ["https://mirros.vercel.app/og-image.png"],
  },
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AdMobProvider } from "@/components/providers/AdMobProvider";
import { AdMockProvider } from "@/components/providers/AdMockProvider";
import { VersionCheckProvider } from "@/components/providers/VersionCheckProvider";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`h-full ${jakarta.variable}`}>
      <body className="min-h-dvh flex flex-col antialiased">
        <VersionCheckProvider>
          <AdMobProvider>
            <AdMockProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </AdMockProvider>
          </AdMobProvider>
        </VersionCheckProvider>
      </body>
    </html>
  );
}
