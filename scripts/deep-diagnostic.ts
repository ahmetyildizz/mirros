import { db } from "../lib/db";

async function deepDiagnostic() {
  console.log("🔍 [Deep Diagnostic] Başlatılıyor...\n");

  const results = {
    total: 0,
    invalidSPY: [] as any[],
    invalidQUIZ: [] as any[],
    duplicates: [] as any[],
    misplaced: [] as any[],
  };

  const allQuestions = await db.question.findMany({ where: { isActive: true } });
  results.total = allQuestions.length;

  const textMap = new Map<string, string>();

  for (const q of allQuestions) {
    // 🕵️ SPY Validation
    if (q.gameMode === "SPY") {
      if (!q.correct || q.correct === "null") {
        results.invalidSPY.push(q);
      }
    }

    // 🧠 QUIZ/BLUFF Validation
    if (q.gameMode === "QUIZ") {
      if (!q.options || q.options.length < 2) {
        results.invalidQUIZ.push(q);
      }
    }

    // 👯 Duplicate Detection (Exact Text)
    if (textMap.has(q.text)) {
      results.duplicates.push({ originalId: textMap.get(q.text), duplicateId: q.id, text: q.text });
    } else {
      textMap.set(q.text, q.id);
    }
    
    // 🚩 Misplaced Detection (Simple Category Keyword Check)
    if (q.category === "Astroloji" && !q.text.toLowerCase().match(/burç|astroloji|yıldız|enerji|merkür|venüs|mars|burcu|harita|zodyak/)) {
        // Warning level, not necessarily invalid
    }
  }

  console.log(`📊 Toplam Soru: ${results.total}`);
  console.log(`❌ Geçersiz SPY Sorusu: ${results.invalidSPY.length}`);
  console.log(`❌ Geçersiz QUIZ Sorusu: ${results.invalidQUIZ.length}`);
  console.log(`👯 Kopya Soru Sayısı: ${results.duplicates.length}`);

  // Auto-Cleanup (User Approved)
  if (results.invalidSPY.length > 0 || results.invalidQUIZ.length > 0) {
    const idsToDelete = [
      ...results.invalidSPY.map(q => q.id),
      ...results.invalidQUIZ.map(q => q.id)
    ];
    console.log(`\n🧹 [Cleanup] ${idsToDelete.length} hatalı soru arşivleniyor (isActive: false)...`);
    await db.question.updateMany({
      where: { id: { in: idsToDelete } },
      data: { isActive: false }
    });
  }

  if (results.duplicates.length > 0) {
    const duplicateIds = results.duplicates.map(d => d.duplicateId);
    console.log(`\n🧹 [Cleanup] ${duplicateIds.length} kopya soru arşivleniyor...`);
    await db.question.updateMany({
      where: { id: { in: duplicateIds } },
      data: { isActive: false }
    });
  }

  console.log("\n✅ [Deep Diagnostic] Tamamlandı.");
}

deepDiagnostic()
  .catch(console.error)
  .finally(() => process.exit());
