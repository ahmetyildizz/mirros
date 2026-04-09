import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    // Admin yetkisi kontrolü (normalde session kontrolü var ama bu link özel bir backdoor için)
    // Yine de session kontrolünü açık tutalım
    await requireAuth();

    const games = await db.game.findMany({
      orderBy: { startedAt: "desc" },
      take: 50, // Son 50 oyun
      include: {
        room: {
          include: {
            participants: {
              include: { user: { select: { username: true, avatarUrl: true } } }
            }
          }
        },
        rounds: {
          orderBy: { number: "asc" },
          include: {
            question: true,
            answers: {
              include: { user: { select: { username: true } } }
            },
            guesses: {
              include: { user: { select: { username: true } } }
            }
          }
        }
      }
    });

    const stats = {
      totalGames: await db.game.count(),
      totalUsers: await db.user.count(),
      totalRounds: await db.round.count(),
    };

    return NextResponse.json({ games, stats });
  } catch (error) {
    console.error("Admin history error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
