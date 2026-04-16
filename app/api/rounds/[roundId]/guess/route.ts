import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";
import { createAuditLog } from "@/lib/audit";

const bodySchema = z.object({
  content: z.string().min(1).max(120),
  reason:  z.string().max(100).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const user = await requireAuth();
  const { roundId } = await params;
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Geçersiz içerik" }, { status: 400 });

  const round = await db.round.findUnique({
    where:   { id: roundId },
    include: { game: { include: { room: { include: { participants: true } } } } },
  });
  if (!round) return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status !== "GUESSING") return NextResponse.json({ error: "Bu round tahmin kabul etmiyor" }, { status: 409 });

  const isParticipant = round.game.room.participants.some((p) => p.userId === user.id);
  if (!isParticipant) return NextResponse.json({ error: "Bu oyunun katılımcısı değilsin" }, { status: 403 });
  if (round.answererId === user.id) return NextResponse.json({ error: "Cevaplayan tahmin edemez" }, { status: 403 });

  // Upsert: aynı kullanıcı tekrar tahmin gönderirse güncelle
  const guess = await db.guess.upsert({
    where:  { roundId_userId: { roundId, userId: user.id } },
    create: { roundId, userId: user.id, content: body.data.content, reason: body.data.reason },
    update: { content: body.data.content, reason: body.data.reason },
  });

  await createAuditLog({
    action: "SUBMIT_GUESS",
    entityType: "GUESS",
    entityId: guess.id,
    resource: `User submitted guess for Round ${roundId}`,
    userId: user.id,
    details: { content: body.data.content, reason: body.data.reason },
  });

  const isExpose     = round.game.room.gameMode === "EXPOSE";

  // Kaç kişi tahmin etti?
  const guessCount    = await db.guess.count({ where: { roundId } });
  // EXPOSE modunda herkes tahmin eder (answerer yok), SOCIAL'da answerer hariç
  const totalGuessers = isExpose
    ? round.game.room.participants.length
    : round.game.room.participants.length - 1;

  await pusherServer.trigger(`game-${round.gameId}`, "guess-submitted", {
    roundId,
    userId:      user.id,
    guessCount,
    totalGuessers,
    allDone: guessCount >= totalGuessers,
  });

  return NextResponse.json(guess, { status: 201 });
}
