import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const activeRoomsCount = await db.room.count({
      where: { status: "ACTIVE" },
    });

    const activeParticipantsCount = await db.roomParticipant.count({
      where: {
        room: { status: "ACTIVE" },
      },
    });

    const categories = await db.room.groupBy({
      by: ["category"],
      where: { status: "ACTIVE" },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    return NextResponse.json({
      activeRooms: activeRoomsCount,
      activePlayers: activeParticipantsCount,
      categoryDistribution: categories.map(c => ({
        name: c.category || "Genel",
        count: c._count.id
      })),
      totalCategories: categories.length
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
