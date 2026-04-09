import { db } from "../lib/db";

async function testFlashbackLogic() {
  console.log("--- Testing Flashback Logic ---");

  // 1. Setup: A player answered a question in a previous round
  const questionId = (await db.question.findFirst({ select: { id: true } }))?.id;
  if (!questionId) {
    console.error("No questions found in database. Seed first.");
    return;
  }

  const userId = "dev-user-001";
  
  // 2. Create a round and answer
  const game = await db.game.create({
    data: {
      roomId: "test-room-flashback",
      totalRounds: 1,
      status: "FINISHED"
    }
  });

  const round = await db.round.create({
    data: {
      gameId: game.id,
      number: 1,
      questionId: questionId,
      answererId: userId,
      status: "SCORED"
    }
  });

  await db.answer.create({
    data: {
      roundId: round.id,
      userId: userId,
      content: "Gizli bir sırlar hazinesi"
    }
  });
  console.log("Recorded a past answer for user.");

  // 3. Simulate an active round query for Flashback
  const pastAnswers = await db.answer.findMany({
    where: {
      userId: userId,
      round: { 
        questionId: questionId,
        gameId: { not: game.id } // Exclude the current game's answer if we are looking for history
      }
    },
    include: { round: { select: { number: true } } },
    orderBy: { submittedAt: "desc" },
    take: 5
  }) as any;

  console.log(`Found ${pastAnswers.length} past answers for user on this question.`);
  
  if (pastAnswers.some(a => a.content === "Gizli bir sırlar hazinesi")) {
    console.log("✅ SUCCESS: Flashback logic correctly retrieves historical answers.");
  } else {
    console.log("❌ FAILURE: Flashback logic failed to find the recorded answer.");
  }

  // Cleanup
  await db.answer.deleteMany({ where: { roundId: round.id } });
  await db.round.delete({ where: { id: round.id } });
  await db.game.delete({ where: { id: game.id } });
  console.log("Cleaned up test data.");
}

testFlashbackLogic().catch(console.error).finally(() => process.exit());
