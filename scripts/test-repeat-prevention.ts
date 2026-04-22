import { pickQuestion } from "../lib/services/game.service";
import { db } from "../lib/db";

async function testRepeatPrevention() {
  console.log("🔄 [Repeat Prevention Test] Başlatılıyor...");
  console.log("Hedef: 'Astroloji' kategorisinde 50 tur boyunca hiçbir sorunun tekrar etmemesi.");

  const category = "Astroloji";
  const gameMode = "SOCIAL";
  const excludeIds: string[] = [];
  const pickedTexts = new Set<string>();
  
  let successes = 0;
  let repeats = 0;

  for (let i = 1; i <= 50; i++) {
    try {
      const q = await pickQuestion(excludeIds, gameMode, null, category, null);
      
      if (pickedTexts.has(q.text)) {
        console.error(`❌ Tur ${i}: TEKRAR YAKALANDI! Soru: "${q.text.slice(0, 30)}..."`);
        repeats++;
      } else {
        pickedTexts.add(q.text);
        excludeIds.push(q.id);
        successes++;
        if (i % 10 === 0) console.log(`✅ ${i} tur tamamlandı...`);
      }
    } catch (e: any) {
      console.error(`❌ Tur ${i} hata:`, e.message);
      break;
    }
  }

  console.log(`\n📊 SONUÇ: ${successes}/50 benzersiz soru seçildi.`);
  console.log(`👯 Tekrar Eden: ${repeats}`);

  if (repeats === 0 && successes === 50) {
    console.log("\n🎯 TEST BAŞARILI: Sistem 50 tur boyunca %100 benzersizlik sağladı.");
  } else {
    console.log("\n⚠️ TEST BAŞARISIZ: Tekrar eden sorular bulundu veya havuz tükendi.");
  }
}

testRepeatPrevention()
  .catch(console.error)
  .finally(() => process.exit());
