import { db } from "../lib/db";
import fs from "fs";
import path from "path";

async function importPool() {
  const poolDir = path.join(process.cwd(), "data/pool");
  
  if (!fs.existsSync(poolDir)) {
    console.error("❌ data/pool dizini bulunamadı!");
    return;
  }

  const files = fs.readdirSync(poolDir).filter(f => f.endsWith(".json"));
  console.log(`🚀 ${files.length} adet havuz dosyası bulundu.`);

  for (const file of files) {
    const filePath = path.join(poolDir, file);
    const category = file.replace(".json", "").split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
    
    console.log(`\n📂 [${category}] İçe aktarılıyor...`);
    
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const questions = JSON.parse(content);
      
      let imported = 0;
      for (const q of questions) {
        // Validasyon
        if (!q.text) continue;
        if (q.mode === "QUIZ" && (!q.options || !q.correct)) {
          console.warn(`   ⚠️ Atlandı (Eksik QUIZ verisi): ${q.text.slice(0, 30)}...`);
          continue;
        }
        if (q.mode === "SPY" && (!q.text || !q.correct)) {
          console.warn(`   ⚠️ Atlandı (Eksik SPY verisi): ${q.text.slice(0, 30)}...`);
          continue;
        }

        await db.question.create({
          data: {
            text:       q.text,
            category:   q.category || category,
            gameMode:   q.mode,
            options:    (q.options || []) as any,
            correct:    q.correct || null,
            penalty:    q.penalty || null,
            difficulty: q.difficulty || "MEDIUM",
            isActive:   true,
            roomId:     null // Global havuz
          }
        });
        imported++;
      }
      console.log(`   ✅ ${imported} soru başarıyla eklendi.`);
    } catch (e) {
      console.error(`   ❌ Hata (${file}):`, e);
    }
  }

  console.log("\n✨ Havuz içe aktarma tamamlandı!");
}

importPool().catch(console.error);
