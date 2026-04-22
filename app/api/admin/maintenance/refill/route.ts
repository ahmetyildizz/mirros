import { db } from "@/lib/db";
import { refillGlobalPool } from "@/lib/services/ai.service";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Maintenance API: Refills the global pool for all categories if they are low.
 * Can be called by a Cron job or manually by an admin.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !(session as any).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const themes = [
    "Çift Gecesi", "Buz Kıran", "Aile Toplantısı", "Doğum Günü",
    "Takım Building", "Dedikodu Masası", "Ofis Kaosu", "Bilgi Yarışması",
    "Bluff Gecesi", "Casus Avı", "Süper Çocuklar", "Bilgelerin Meydanı",
    "Kampüs Kaosu", "Nostalji 90'lar", "Sinema & Dizi", "Kız Gecesi",
    "Ben Hiç...", "Z Kuşağı", "Astroloji", "Gurme & Mutfak"
  ];

  const modes: ("SOCIAL" | "QUIZ" | "EXPOSE" | "SPY")[] = ["SOCIAL", "QUIZ", "EXPOSE", "SPY"];
  const results: any[] = [];

  console.log("[Maintenance] Global havuz tazeleme başlatıldı...");

  for (const theme of themes) {
    for (const mode of modes) {
      const count = await db.question.count({
        where: { gameMode: mode, category: { startsWith: theme.split(":")[0] }, isActive: true, roomId: null }
      });

      if (count < 30) {
        console.log(`[Maintenance] ${theme} (${mode}) havuzu düşük (${count}), dolduruluyor...`);
        const saved = await refillGlobalPool(mode, theme, 20);
        results.push({ theme, mode, countBefore: count, saved });
      }
    }
  }

  return NextResponse.json({ message: "Bakım tamamlandı", results });
}
