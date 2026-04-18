import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireAuth();
  const full = await db.user.findUnique({
    where: { id: user.id },
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

  if (!full) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // İstatistikleri hesapla
  const stats = await db.score.aggregate({
    where: { guesserId: user.id },
    _sum: { points: true },
    _count: { id: true }
  });

  return NextResponse.json({
    ...full,
    totalPoints: stats._sum.points ?? 0,
    gamesPlayed: stats._count.id
  });
}
