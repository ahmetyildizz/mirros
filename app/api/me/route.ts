import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // İstatistikleri hesapla (isteğe bağlı, hata verse bile profil dönmeli)
    let totalPoints = 0;
    let gamesPlayed = 0;
    try {
      const stats = await db.score.aggregate({
        where: { guesserId: user.id },
        _sum: { points: true },
        _count: { id: true }
      });
      totalPoints = stats._sum.points ?? 0;
      gamesPlayed = stats._count.id;
    } catch (e) {
      console.error("Stats aggregation failed", e);
    }

    return NextResponse.json({
      ...full,
      totalPoints,
      gamesPlayed
    });
  } catch (error) {
    console.error("[api/me] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
