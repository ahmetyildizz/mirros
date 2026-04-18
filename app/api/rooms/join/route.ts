import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer, safeTrigger } from "@/lib/pusher/server";
import { startGame } from "@/lib/services/game.service";
import { createAuditLog } from "@/lib/audit";
import { getAiAvatarUrl } from "@/lib/services/avatar.service";

const bodySchema = z.object({
  code:      z.string().min(4).max(8),
  ageGroup:  z.enum(["CHILD", "ADULT", "WISE"]).optional(),
  avatarUrl: z.string().optional(),
  username:  z.string().optional(),
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
  const participantCount = room.participants.filter(p => p.role !== "SPECTATOR").length;
  const alreadyIn = room.participants.some((p) => p.userId === user.id);
  const isFull = participantCount >= room.maxPlayers;

  if (isFull && !alreadyIn) {
    // İzleyici olarak katılacak, hata vermiyoruz
  } else if (isFull && alreadyIn) {
    // Zaten içeride, sorun yok
  }

    await db.user.update({
      where: { id: user.id },
      data:  { 
        ...(body.data.avatarUrl && { avatarUrl: body.data.avatarUrl }),
        ...(body.data.username  && { username: body.data.username }),
      },
    });
  } else if (!user.avatarUrl) {
    // Eğer hiç avatarı yoksa AI Avatar ata
    await db.user.update({
      where: { id: user.id },
      data: { avatarUrl: getAiAvatarUrl(user.id) }
    });
  }

  if (!alreadyIn) {
    const role = isFull ? "SPECTATOR" : "PLAYER";
    await db.roomParticipant.create({ 
      data: { 
        roomId: room.id, 
        userId: user.id, 
        ageGroup: body.data.ageGroup,
        role: role
      } 
    });
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
    id:        p.userId,
    username:  p.user.username ?? p.user.email,
    avatarUrl: p.user.avatarUrl,
    role:      (p as any).role,
  }));

  const dbUser = await db.user.findUnique({ where: { id: user.id } });

  // Pusher bildirimi (Hata durumunda istek çökmemeli)
  try {
    await safeTrigger(`room-${room.id}`, "player-joined", {
      userId:    user.id,
      username:  body.data.username ?? user.username,
      avatarUrl: body.data.avatarUrl ?? dbUser?.avatarUrl,
      role:      isFull && !alreadyIn ? "SPECTATOR" : "PLAYER",
      players,
    });
  } catch (err) {
    console.error("Pusher trigger failed (player-joined):", err);
  }

  if (!alreadyIn && updated && updated.participants.length >= 2) {
    await db.room.update({ where: { id: room.id }, data: { status: "ACTIVE" } });
  }

  // Oda doldu → otomatik başlat (Sadece oyuncu sayısı dolunca, izleyici katıldığında değil)
  // startGame() kendi içinde transaction + existingGame guard'ı var; eş zamanlı iki istek
  // gelirse biri "Oyun zaten başlatıldı" fırlatır — bu catch'te güvenle yutulur.
  let activeGameId = room.games[0]?.id || null;

  if (updated) {
    const activePlayerCount = updated.participants.filter(p => (p as any).role !== "SPECTATOR").length;
    if (activePlayerCount >= room.maxPlayers) {
      try {
        const gameRes = await startGame(room.id);
        if (gameRes?.game?.id) {
          activeGameId = gameRes.game.id;
        }
      } catch (err: any) {
        if (err?.message !== "Oyun zaten başlatıldı") {
          console.error("Auto-start game failed:", err);
        }
        // "Oyun zaten başlatıldı" → race condition, diğer istek başlattı, sessizce geç
        const existingActive = await db.game.findFirst({
          where: { roomId: room.id, status: "ACTIVE" },
          select: { id: true },
        });
        if (existingActive) activeGameId = existingActive.id;
      }
    }
  }

  return NextResponse.json({ 
    id: room.id, 
    code: room.code, 
    players,
    activeGameId 
  });
}
