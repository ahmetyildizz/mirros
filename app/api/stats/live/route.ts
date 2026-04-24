import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

// Her lobby açılışında 5 DB sorgusu tetiklememek için 30sn cache
const getLiveStats = unstable_cache(
  async () => {
    const [activeRoomsCount, activeParticipantsCount, dailyAnswersCount, roundAnswersCount, categories] =
      await Promise.all([
        db.room.count({ where: { status: "ACTIVE" } }),
        db.roomParticipant.count({ where: { room: { status: "ACTIVE" } } }),
        db.dailyAnswer.count(),
        db.answer.count(),
        db.room.groupBy({
          by: ["category"],
          where: { status: "ACTIVE" },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        }),
      ]);

    return {
      activeRooms: activeRoomsCount,
      activePlayers: activeParticipantsCount,
      totalAnswers: dailyAnswersCount + roundAnswersCount,
      categoryDistribution: categories.map(c => ({
        name: c.category || "Genel",
        count: c._count.id,
      })),
      totalCategories: categories.length,
    };
  },
  ["live-stats"],
  { revalidate: 30 }
);

export async function GET() {
  try {
    const stats = await getLiveStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
