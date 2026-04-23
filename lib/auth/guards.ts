import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

type GuardResult =
  | { ok: true; userId: string; username: string }
  | { ok: false; response: NextResponse };

/** Kimlik doğrulama — başarısız olursa 401 döner. */
export async function guardAuth(): Promise<GuardResult> {
  try {
    const session = await requireAuth();
    return { ok: true, userId: session.id, username: session.username };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Giriş yapman gerekiyor" }, { status: 401 }) };
  }
}

/** Kullanıcının belirtilen oyunda katılımcı olup olmadığını doğrular. */
export async function guardGameParticipant(
  userId: string,
  gameId: string
): Promise<{ ok: true; game: any } | { ok: false; response: NextResponse }> {
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { room: { include: { participants: true } } },
  });
  if (!game) {
    return { ok: false, response: NextResponse.json({ error: "Oyun bulunamadı" }, { status: 404 }) };
  }
  const isParticipant = game.room.participants.some((p: any) => p.userId === userId);
  if (!isParticipant) {
    return { ok: false, response: NextResponse.json({ error: "Yetkisiz" }, { status: 403 }) };
  }
  return { ok: true, game };
}

/** Kullanıcının belirtilen odanın host'u olup olmadığını doğrular. */
export async function guardRoomHost(
  userId: string,
  roomId: string
): Promise<{ ok: true; room: any } | { ok: false; response: NextResponse }> {
  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return { ok: false, response: NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 }) };
  }
  if (room.hostId !== userId) {
    return { ok: false, response: NextResponse.json({ error: "Sadece host bu işlemi yapabilir" }, { status: 403 }) };
  }
  return { ok: true, room };
}

/** Kullanıcının belirtilen round'a ait oyunda katılımcı olduğunu doğrular. */
export async function guardRoundParticipant(
  userId: string,
  roundId: string
): Promise<{ ok: true; round: any } | { ok: false; response: NextResponse }> {
  const round = await db.round.findUnique({
    where: { id: roundId },
    include: { game: { include: { room: { include: { participants: true } } } } },
  });
  if (!round) {
    return { ok: false, response: NextResponse.json({ error: "Round bulunamadı" }, { status: 404 }) };
  }
  const isParticipant = round.game.room.participants.some((p: any) => p.userId === userId);
  if (!isParticipant) {
    return { ok: false, response: NextResponse.json({ error: "Yetkisiz" }, { status: 403 }) };
  }
  return { ok: true, round };
}
