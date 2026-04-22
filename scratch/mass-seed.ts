import { db } from "../lib/db";
import { refillGlobalPool } from "../lib/services/ai.service";

const CATEGORIES = [
  { label: "Kız Gecesi", gameMode: "SOCIAL" },
  { label: "Bilgi Yarışması", gameMode: "QUIZ" },
  { label: "Sinema & Dizi", gameMode: "QUIZ" },
  { label: "Bilgelerin Meydanı", gameMode: "QUIZ" },
  { label: "Bluff Gecesi", gameMode: "BLUFF" },
  { label: "Casus Avı", gameMode: "SPY" },
  { label: "Süper Çocuklar", gameMode: "SOCIAL" },
  { label: "Ben Hiç...", gameMode: "SOCIAL" },
  { label: "Z Kuşağı", gameMode: "SOCIAL" },
  { label: "Astroloji", gameMode: "SOCIAL" },
  { label: "Gurme & Mutfak", gameMode: "SOCIAL" },
  { label: "Çift Gecesi", gameMode: "SOCIAL" },
  { label: "Ofis Kaosu", gameMode: "SOCIAL" },
  { label: "Aile Toplantısı", gameMode: "SOCIAL" },
  { label: "Buz Kıran", gameMode: "SOCIAL" },
  { label: "Doğum Günü", gameMode: "SOCIAL" },
  { label: "Takım Building", gameMode: "SOCIAL" },
  { label: "Dedikodu Masası", gameMode: "EXPOSE" },
  { label: "Kampüs Kaosu", gameMode: "SOCIAL" },
  { label: "Ofis Draması", gameMode: "SOCIAL" }
];

async function seed() {
  console.log("🚀 Mirros Mass Seeder Başlıyor...");
  const TARGET_PER_CATEGORY = 500;

  for (const cat of CATEGORIES) {
    console.log(`\n🔎 [${cat.label}] Analiz ediliyor...`);
    
    // Mevcut soru sayısını say
    const count = await db.question.count({
      where: { 
        category: { startsWith: cat.label },
        gameMode: cat.gameMode === "BLUFF" ? "QUIZ" : (cat.gameMode as any)
      }
    });

    console.log(`📊 Mevcut Soru: ${count}`);

    if (count >= TARGET_PER_CATEGORY) {
      console.log("✅ Hedeflenen sayıya ulaşıldı, geçiliyor.");
      continue;
    }

    const remaining = TARGET_PER_CATEGORY - count;
    const batchSize = 15;
    const batches = Math.ceil(remaining / batchSize);

    console.log(`🛠️ ${batches} batch halinde ${remaining} soru üretilecek...`);

    for (let i = 0; i < batches; i++) {
        console.log(`   [${cat.label}] Batch ${i+1}/${batches} üretiliyor...`);
        
        let success = false;
        let retries = 0;
        while (!success && retries < 3) {
            try {
                const saved = await refillGlobalPool(cat.gameMode as any, cat.label, batchSize);
                console.log(`   ✅ ${saved} soru kaydedildi.`);
                success = true;
                // Gemini Rate Limitlerini aşmamak için bekleme (Free tier için uzun tutuldu)
                await new Promise(r => setTimeout(r, 4000));
            } catch (e: any) {
                retries++;
                if (e?.status === 429) {
                    console.warn(`   ⚠️ Limit aşıldı (429), ${retries * 30} sn bekleniyor...`);
                    await new Promise(r => setTimeout(r, 30000 * retries));
                } else {
                    console.error(`   ❌ Hata:`, e?.message || e);
                    await new Promise(r => setTimeout(r, 5000));
                }
            }
        }
    }
  }

  console.log("\n✨ Tüm kategoriler dolduruldu!");
}

seed().catch(console.error);
