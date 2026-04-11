const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function pickQuestion(gameMode, category, excludeIds) {
  const themeMap = {
    "Çift Gecesi": ["İlişki", "Duygu", "Kişilik", "Yaşam"],
    "Aile Toplantısı": ["Anılar", "Nostalji", "Yemek", "Yaşam", "Sosyal"],
    "Doğum Günü": ["Anılar", "Eğlence", "Kişilik", "Sosyal", "Nostalji"],
    "Takım Building": ["Yaşam", "Duygu", "Değerler", "Sosyal", "Kişilik", "Dijital"],
  };

  const targetCategories = themeMap[category] || [category];

  let candidates = await prisma.question.findMany({
    where: {
      isActive: true,
      gameMode,
      category: { in: targetCategories },
      NOT: { options: { equals: [] } },
      id: { notIn: excludeIds }
    },
    select: { id: true, text: true }
  });

  if (candidates.length === 0) {
    candidates = await prisma.question.findMany({
      where: {
        isActive: true,
        gameMode,
        category: { in: targetCategories },
        id: { notIn: excludeIds }
      },
      select: { id: true, text: true }
    });
  }

  if (candidates.length === 0) return null;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return pick;
}

async function runTest() {
  console.log("=== Category Randomness Test ===");
  const categories = ["Çift Gecesi", "Aile Toplantısı"];

  for (const cat of categories) {
    console.log(`\nTesting Category: ${cat}`);
    
    console.log("Play #1:");
    const q1 = await pickQuestion("SOCIAL", cat, []);
    console.log(" -> Question 1:", q1 ? q1.text : "None");
    const q2 = await pickQuestion("SOCIAL", cat, q1 ? [q1.id] : []);
    console.log(" -> Question 2:", q2 ? q2.text : "None");

    console.log("\nPlay #2 (Simulating another game or day):");
    const q3 = await pickQuestion("SOCIAL", cat, []);
    console.log(" -> Question 1:", q3 ? q3.text : "None");
    const q4 = await pickQuestion("SOCIAL", cat, q3 ? [q3.id] : []);
    console.log(" -> Question 2:", q4 ? q4.text : "None");
  }

  await prisma.$disconnect();
}

runTest();
