import { db } from "../lib/db";

async function fix() {
  console.log("Starting DB fix for round statuses...");
  const rounds = await db.round.findMany({
    where: {
      status: "ANSWERING",
      game: {
        room: {
          gameMode: { in: ["EXPOSE", "QUIZ"] }
        }
      }
    }
  });
  console.log(`Found ${rounds.length} rounds in incorrectly state.`);
  if (rounds.length > 0) {
    const ids = rounds.map(r => r.id);
    await db.round.updateMany({
      where: { id: { in: ids } },
      data: { status: "GUESSING" }
    });
    console.log("Successfully updated rounds to GUESSING.");
  }
}

fix().catch(console.error).finally(() => process.exit());
