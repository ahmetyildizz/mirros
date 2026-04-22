import { pickQuestion } from "../lib/services/game.service";
import { db } from "../lib/db";

async function testAll() {
  const categories = [
    { name: "Çift Gecesi", mode: "SOCIAL" },
    { name: "Buz Kıran", mode: "SOCIAL" },
    { name: "Aile Toplantısı", mode: "SOCIAL" },
    { name: "Doğum Günü", mode: "SOCIAL" },
    { name: "Takım Building", mode: "SOCIAL" },
    { name: "Dedikodu Masası", mode: "EXPOSE" },
    { name: "Ofis Kaosu", mode: "EXPOSE" },
    { name: "Bilgi Yarışması", mode: "QUIZ" },
    { name: "Bluff Gecesi", mode: "QUIZ" },
    { name: "Casus Avı", mode: "SPY" },
    { name: "Süper Çocuklar", mode: "SOCIAL" },
    { name: "Bilgelerin Meydanı", mode: "SOCIAL" },
    { name: "Kampüs Kaosu", mode: "SOCIAL" },
    { name: "Nostalji 90'lar", mode: "SOCIAL" },
    { name: "Sinema & Dizi", mode: "SOCIAL" },
    { name: "Kız Gecesi", mode: "SOCIAL" },
    { name: "Ben Hiç...", mode: "SOCIAL" },
    { name: "Z Kuşağı", mode: "SOCIAL" },
    { name: "Astroloji", mode: "SOCIAL" },
    { name: "Gurme & Mutfak", mode: "SOCIAL" }
  ];

  console.log("🚀 Kategori Testleri Başlatılıyor...\n");

  const results = [];

  for (const cat of categories) {
    try {
      // Pick question (no exclude IDs, no age group for simple test)
      const q = await pickQuestion([], cat.mode as any, null, cat.name, null);
      
      // Verify category accuracy
      if (q.category === cat.name) {
        console.log(`✅ [${cat.name}] (${cat.mode}) -> "${q.text.slice(0, 50)}..." [MATCH: ${q.category}]`);
        results.push({ category: cat.name, status: "OK", question: q.text });
      } else {
        console.warn(`⚠️ [${cat.name}] (${cat.mode}) -> YANLIŞ KATEGORİ: Beklenen ${cat.name}, Gelen ${q.category}`);
        results.push({ category: cat.name, status: "PARTIAL", question: q.text, actualCategory: q.category });
      }
    } catch (e: any) {
      console.error(`❌ [${cat.name}] (${cat.mode}) hata:`, e.message);
      results.push({ category: cat.name, status: "ERROR", error: e.message });
    }
  }

  const ok = results.filter(r => r.status === "OK").length;
  const partial = results.filter(r => r.status === "PARTIAL").length;
  console.log(`\n📊 SONUÇ: ${ok}/${categories.length} tam başarı, ${partial} kısmi başarı.`);
  
  if (ok < categories.length) {
    process.exit(1);
  }
}

testAll().catch(err => {
  console.error("Test sırasında kritik hata:", err);
  process.exit(1);
});
