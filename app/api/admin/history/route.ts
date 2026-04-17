import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip  = (page - 1) * limit;

    const [games, [totalGames, totalUsers, totalRounds], auditLogs] = await Promise.all([
      db.game.findMany({
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
        include: {
          room: {
            include: {
              participants: {
                include: { user: { select: { username: true, avatarUrl: true } } },
              },
            },
          },
          rounds: {
            orderBy: { number: "asc" },
            select: {
              id:         true,
              number:     true,
              status:     true,
              answererId: true,
              question:   { select: { text: true, category: true } },
            },
          },
        },
      }),
      db.$transaction([
        db.game.count(),
        db.user.count(),
        db.round.count(),
      ]),
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: { select: { username: true, email: true, avatarUrl: true } },
        },
      }),
    ]);

    return NextResponse.json({
      games,
      stats: { totalGames, totalUsers, totalRounds },
      auditLogs,
      pagination: { page, limit, total: totalGames },
    });
  } catch (error) {
    console.error("Admin history error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
