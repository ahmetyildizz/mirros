import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function auditCategory(category: string, gameMode: any, ageGroup: any = "ADULT") {
  console.log(`\n[AUDIT] Starting Audit for Category: [${category}] | Mode: ${gameMode}`);

  // 1. Create Host User
  const host = await prisma.user.upsert({
    where: { email: `audit-host-${category.replace(/\s/g, "")}@mirros.app` },
    update: {},
    create: {
      email: `audit-host-${category.replace(/\s/g, "")}@mirros.app`,
      username: `Host_${category.substring(0, 3)}`,
    },
  });

  // 2. Create Room
  const roomCode = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;
  const room = await prisma.room.create({
    data: {
      code: roomCode,
      hostId: host.id,
      gameMode: gameMode,
      category: category,
      maxPlayers: 12,
      status: "WAITING",
    },
  });
  console.log(` - Room Created: ${roomCode} (ID: ${room.id})`);

  // 3. Join 12 Users (including host)
  const participants = [host];
  for (let i = 1; i < 12; i++) {
    const user = await prisma.user.upsert({
      where: { email: `audit-u${i}-${category.replace(/\s/g, "")}@mirros.app` },
      update: {},
      create: {
        email: `audit-u${i}-${category.replace(/\s/g, "")}@mirros.app`,
        username: `Player_${i}_${category.substring(0, 2)}`,
      },
    });
    participants.push(user);
    await prisma.roomParticipant.create({
      data: { roomId: room.id, userId: user.id, ageGroup: ageGroup },
    });
  }
  console.log(` - 12 Users Joined successfully.`);

  // 4. Wait for AI Generation (Simulate wait if AI service would be running)
  console.log(` - Waiting for AI/Question setup...`);
  await delay(3000); 

  // 5. Select Questions based on GameMode and Category
  const themeMap: Record<string, string[]> = {
    "Çift Gecesi": ["İlişki", "Duygu", "Kişilik", "Yaşam"],
    "Aile Toplantısı": ["Anılar", "Nostalji", "Yemek", "Yaşam", "Sosyal"],
    "Doğum Günü": ["Anılar", "Eğlence", "Kişilik", "Sosyal", "Nostalji"],
    "Takım Building": ["Yaşam", "Duygu", "Değerler", "Sosyal", "Kişilik", "Dijital"],
  };

  const targetSubCats = themeMap[category] || [category];

  let questions = await prisma.question.findMany({
    where: { 
      OR: [
        { roomId: room.id },
        { 
            category: { in: targetSubCats }, 
            isActive: true, 
            gameMode: gameMode 
        }
      ]
    },
    take: 10
  });

  // Fallback for categories like "Expose" or "Bilgi Yarışması" if they use different strings
  if (questions.length === 0) {
    questions = await prisma.question.findMany({
        where: { gameMode: gameMode, isActive: true },
        take: 10
    });
  }

  if (questions.length === 0) {
    console.error(` [FAIL] No questions found for category ${category} or mode ${gameMode}`);
    return;
  }

  const game = await prisma.game.create({
    data: {
      roomId: room.id,
      totalRounds: questions.length,
      status: "ACTIVE",
    },
  });
  console.log(` - Game Started: ID ${game.id} with ${questions.length} rounds.`);

  // 6. Iterate Rounds
  for (let r = 0; r < questions.length; r++) {
    const question = questions[r];
    const answerer = participants[r % participants.length];

    const round = await prisma.round.create({
      data: {
        gameId: game.id,
        number: r + 1,
        questionId: question.id,
        answererId: gameMode === "SOCIAL" ? answerer.id : null,
        status: "ANSWERING",
      },
    });

    // Answering Phase
    if (gameMode === "SOCIAL") {
      await prisma.answer.create({
        data: { roundId: round.id, userId: answerer.id, content: "Audit Answer Content" },
      });
    } else {
      for (const p of participants) {
        await prisma.answer.create({
          data: { roundId: round.id, userId: p.id, content: question.correct || "Option A" },
        });
      }
    }

    await prisma.round.update({ where: { id: round.id }, data: { status: "GUESSING" } });

    // Guessing Phase
    if (gameMode === "SOCIAL") {
      for (const p of participants) {
        if (p.id === answerer.id) continue;
        await prisma.guess.create({
          data: { roundId: round.id, userId: p.id, content: "Audit Answer Content" },
        });
      }
    }

    await prisma.round.update({ where: { id: round.id }, data: { status: "SCORED" } });

    // Scoring (Simplified)
    for (const p of participants) {
        if (gameMode === "SOCIAL" && p.id === answerer.id) continue;
        await prisma.score.create({
            data: { 
                gameId: game.id, 
                roundId: round.id, 
                guesserId: p.id, 
                matchLevel: "EXACT", 
                points: 10 
            }
        });
    }

    process.stdout.write(".");
  }

  await prisma.game.update({ where: { id: game.id }, data: { status: "FINISHED", finishedAt: new Date() } });
  console.log(`\n [SUCCESS] Category ${category} completed.`);
  
  return {
    category,
    questions: questions.map(q => q.text)
  };
}

async function runFullAudit() {
  console.log("=== MIRROS COMPREHENSIVE E2E AUDIT START ===");
  const results: any[] = [];

  try {
    // 1. Social Categories
    const socialCats = ["Çift Gecesi", "Aile Toplantısı", "Doğum Günü", "Takım Building"];
    for (const cat of socialCats) {
      results.push(await auditCategory(cat, "SOCIAL"));
    }

    // 2. Quiz Category
    results.push(await auditCategory("Bilgi Yarışması", "QUIZ", "ADULT"));

    // 3. Expose Categories
    results.push(await auditCategory("Expose", "EXPOSE"));
    results.push(await auditCategory("Ofis Kaosu", "EXPOSE"));

    // 4. Custom
    results.push(await auditCategory("Özelleştir", "SOCIAL"));

    console.log("\n=== AUDIT COMPLETE ===");
    console.log("Total Categories Audited:", results.length);
    
  } catch (err) {
    console.error("Audit Runtime Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runFullAudit();
