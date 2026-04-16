import { db } from "../lib/db";

async function findQuestionInfo() {
  try {
    const questionText = "Ffdghjjjjkki";
    console.log(`Searching for: ${questionText}`);

    const question = await db.question.findFirst({
      where: { text: questionText },
      include: {
        dailyEntries: true
      }
    });

    if (!question) {
      console.log("Question not found.");
      return;
    }

    console.log("--- QUESTION INFO ---");
    console.log(JSON.stringify(question, null, 2));

    const audits = await db.auditLog.findMany({
      where: {
        entityType: "QUESTION",
        entityId: question.id
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    console.log("\n--- AUDIT LOGS ---");
    console.log(JSON.stringify(audits, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

findQuestionInfo();
