import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function test() {
  try {
    const userId = "some-id"; // This doesn't matter for syntax check
    console.log("Testing aggregate...");
    const stats = await db.score.aggregate({
      where: { guesserId: userId },
      _sum: { points: true },
      _count: { id: true }
    });
    console.log("Stats:", stats);
    
    console.log("Testing findUnique...");
    const user = await db.user.findUnique({
      where: { id: "test" },
      select: { 
        id: true, 
        username: true, 
        email: true, 
        provider: true, 
        avatarUrl: true, 
        streak: true, 
        longestStreak: true, 
        lastPlayedAt: true,
        badges: true
      },
    });
    console.log("User:", user);
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await db.$disconnect();
  }
}

test()
