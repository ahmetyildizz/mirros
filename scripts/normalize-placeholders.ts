import { db } from "../lib/db";

async function normalize() {
  console.log("🛠️ Placeholder normalizasyonu başlatılıyor...");

  const questions = await db.question.findMany({
    where: {
      OR: [
        { text: { contains: "[ISIM]" } },
        { text: { contains: "[İSIM]" } },
        { text: { contains: "[ISİM]" } },
      ]
    }
  });

  console.log(`🔍 Toplam ${questions.length} adet normalize edilecek soru bulundu.`);

  let updatedCount = 0;
  for (const q of questions) {
    const newText = q.text
      .replace(/\[ISIM\]/gi, "[İSİM]")
      .replace(/\[İSIM\]/gi, "[İSİM]")
      .replace(/\[ISİM\]/gi, "[İSİM]");

    if (newText !== q.text) {
      await db.question.update({
        where: { id: q.id },
        data: { text: newText }
      });
      updatedCount++;
    }
  }

  console.log(`✅ ${updatedCount} soru başarıyla normalize edildi.`);
}

normalize()
  .catch(console.error)
  .finally(() => process.exit());
