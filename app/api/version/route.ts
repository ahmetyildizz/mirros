import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://noyanova.com/mirros/version.txt", {
      cache: "no-store", // Her zaman taze versiyonu iste
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      if (res.status === 404) {
        // Dosya henüz yoksa güncel sürüm muamelesi yapıyoruz
        return NextResponse.json({ version: "1.0.0", isFallback: true });
      }
      throw new Error(`HTTP Hata: ${res.status}`);
    }

    const versionText = await res.text();
    const cleanVersion = versionText.trim();
    
    // Eğer içerik boş geldiyse hata muamelesi
    if (!cleanVersion) {
      return NextResponse.json({ version: "1.0.0", isFallback: true });
    }

    return NextResponse.json({ version: cleanVersion });

  } catch (error) {
    console.warn("Version Fetch Error (Bypassed):", error);
    // İnternet yoksa veya domain kapalıysa uygulamayı kilitlememek için:
    return NextResponse.json({ version: "1.0.0", isFallback: true });
  }
}
