import { generateAndSaveQuestionsForRoom } from "../lib/services/ai.service";
import { db } from "../lib/db";

async function testMemory() {
  console.log("🧠 [AI Personalization Test] Başlatılıyor...");
  
  const testRoomId = "test-room-memory-" + Date.now();
  const playerNames = ["Ahmet", "Mehmet"];
  const answerMemory = "Ahmet'in en büyük hayali Mars'a gitmek ve orada patates yetiştirmek.";

  console.log(`\n📝 Verilen Hafıza: "${answerMemory}"`);
  
  const savedCount = await generateAndSaveQuestionsForRoom(
    testRoomId,
    "SOCIAL",
    "İlişki",
    "ADULT",
    playerNames,
    "MEDIUM",
    answerMemory,
    3
  );

  if (savedCount > 0) {
    const questions = await db.question.findMany({ where: { roomId: testRoomId } });
    console.log(`\n✅ ${questions.length} soru üretildi:`);
    questions.forEach((q, i) => {
      console.log(`${i+1}. ${q.text}`);
    });

    const isPersonalized = questions.some(q => 
        q.text.toLowerCase().includes("mars") || 
        q.text.toLowerCase().includes("patates") ||
        q.text.toLowerCase().includes("hayal")
    );

    if (isPersonalized) {
      console.log("\n🎯 TEST BAŞARILI: AI hafızayı kullandı ve kişiselleştirilmiş soru üretti.");
    } else {
      console.log("\n⚠️ TEST KISMİ: AI sorular üretti ama hafızadaki detayları doğrudan yansıtmadı.");
    }

    // Cleanup
    await db.question.deleteMany({ where: { roomId: testRoomId } });
  } else {
    console.error("❌ AI soru üretemedi.");
  }
}

testMemory()
  .catch(console.error)
  .finally(() => process.exit());
