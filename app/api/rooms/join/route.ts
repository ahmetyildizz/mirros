import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";
import { startGame } from "@/lib/services/game.service";
import { createAuditLog } from "@/lib/audit";

const bodySchema = z.object({
  code:     z.string().min(4).max(8),
  ageGroup: z.enum(["CHILD", "ADULT", "WISE"]).optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Geçersiz kod" }, { status: 400 });

  const room = await db.room.findUnique({
    where:   { code: body.data.code.toUpperCase() },
    include: {
      participants: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      games:        { where: { status: "ACTIVE" }, select: { id: true } },
    },
  });
  if (!room)                          return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
  if (room.status === "FINISHED")     return NextResponse.json({ error: "Oyun bitti" }, { status: 409 });
  if (room.games.length > 0)          return NextResponse.json({ error: "Oyun başladı" }, { status: 409 });
  if (room.participants.length >= room.maxPlayers)
    return NextResponse.json({ error: "Oda dolu" }, { status: 409 });

  const alreadyIn = room.participants.some((p) => p.userId === user.id);
  if (!alreadyIn) {
    await db.roomParticipant.create({ data: { roomId: room.id, userId: user.id, ageGroup: body.data.ageGroup } });
    await createAuditLog({
      action: "JOIN_ROOM",
      entityType: "ROOM",
      entityId: room.id,
      resource: `User joined Room ${room.code}`,
      userId: user.id,
      details: { ageGroup: body.data.ageGroup },
    });
  } else if (body.data.ageGroup) {
    await db.roomParticipant.update({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
      data:  { ageGroup: body.data.ageGroup },
    });
    await createAuditLog({
      action: "UPDATE",
      entityType: "USER",
      entityId: user.id,
      resource: `User updated ageGroup in Room ${room.code}`,
      userId: user.id,
      details: { ageGroup: body.data.ageGroup },
    });
  }

  const updated = await db.room.findUnique({
    where:   { id: room.id },
    include: { participants: { include: { user: true }, orderBy: { joinedAt: "asc" } } },
  });

  const players = (updated?.participants ?? []).map((p) => ({
    id:       p.userId,
    username: p.user.username ?? p.user.email,
  }));

  await pusherServer.trigger(`room-${room.id}`, "player-joined", {
    userId:   user.id,
    username: user.username,
    players,
  });

  if (!alreadyIn && updated && updated.participants.length >= 2) {
    await db.room.update({ where: { id: room.id }, data: { status: "ACTIVE" } });
  }

  // Oda doldu → otomatik başlat (race condition önlemi: try/catch)
  if (updated && updated.participants.length >= room.maxPlayers) {
    try { await startGame(room.id); } catch { /* zaten başlatılmış olabilir */ }
  }

  return NextResponse.json({ id: room.id, code: room.code, players });
}
