const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const duplicates = await prisma.$queryRaw`
    SELECT "gameId", "number", COUNT(*) 
    FROM "Round" 
    GROUP BY "gameId", "number" 
    HAVING COUNT(*) > 1
  `;
  console.log("Existing duplicates:", duplicates);
  if (duplicates.length > 0) {
    console.log("Fixing duplicates: keeping only the first one for each gameId/number.");
    for (const d of duplicates) {
      const allRounds = await prisma.round.findMany({
        where: { gameId: d.gameId, number: d.number },
        orderBy: { id: "asc" }
      });
      // Delete all but the first (keep the oldest)
      const toDelete = allRounds.slice(1).map(r => r.id);
      await prisma.round.deleteMany({ where: { id: { in: toDelete } } });
      console.log(`Deleted ${toDelete.length} duplicate rounds for Game ${d.gameId} Round ${d.number}`);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
