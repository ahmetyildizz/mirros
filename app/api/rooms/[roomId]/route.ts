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
      host: { select: { id: true, username: true, email: true } },
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

  // Aktif oyun var mı bak (sayfa yenilenince otomatik geçmek için)
  const activeGame = await db.game.findFirst({
    where:   { roomId: room.id, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
    select:  { id: true },
  });

  return NextResponse.json({
    id:           room.id,
    code:         room.code,
    status:       room.status,
    gameMode:     room.gameMode,
    ageGroup:     room.ageGroup,
    maxPlayers:   room.maxPlayers,
    hostId:       room.hostId,
    hostName:     room.host.username ?? room.host.email,
    activeGameId: activeGame?.id ?? null,
    players,
  });
}
