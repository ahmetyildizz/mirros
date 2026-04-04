import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  await requireAuth();
  const { roomId } = await params;

  const room = await db.room.findUnique({
    where:   { id: roomId },
    include: {
      participants: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, username: true, email: true } } },
      },
    },
  });

  if (!room) return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });

  const players = room.participants.map((p) => ({
    id:       p.userId,
    username: p.user.username ?? p.user.email,
    isHost:   p.userId === room.hostId,
  }));

  return NextResponse.json({ id: room.id, code: room.code, status: room.status, players });
}
