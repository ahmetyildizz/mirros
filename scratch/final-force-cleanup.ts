import { db } from "../lib/db";

async function forceDelete() {
  const qId = "cmnpj5xsi000404l4mjzg8pbg";
  try {
    console.log(`Force deleting question: ${qId}`);
    
    // Delete from Daily Question
    await db.dailyAnswer.deleteMany({ where: { dailyQuestion: { questionId: qId } } });
    await db.dailyQuestion.deleteMany({ where: { questionId: qId } });
    
    // Delete from Rounds and related
    const rounds = await db.round.findMany({ where: { questionId: qId }, select: { id: true } });
    const rIds = rounds.map(r => r.id);
    
    if (rIds.length > 0) {
      await db.score.deleteMany({ where: { roundId: { in: rIds } } });
      await db.guess.deleteMany({ where: { roundId: { in: rIds } } });
      await db.answer.deleteMany({ where: { roundId: { in: rIds } } });
      await db.round.deleteMany({ where: { id: { in: rIds } } });
    }
    
    // Delete the question itself
    await db.question.delete({ where: { id: qId } });
    console.log("DELETION SUCCESSFUL.");
  } catch (err: any) {
    if (err.code === 'P2025') {
       console.log("Question already gone.");
    } else {
       console.error("DELETION FAILED:", err);
    }
  } finally {
    process.exit(0);
  }
}

forceDelete();
