import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";

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
  if (round.answererId === user.id) return NextResponse.json({ error: "Cevaplayan tahmin edemez" }, { status: 403 });

  // Upsert: aynı kullanıcı tekrar tahmin gönderirse güncelle
  const guess = await db.guess.upsert({
    where:  { roundId_userId: { roundId, userId: user.id } },
    create: { roundId, userId: user.id, content: body.data.content, reason: body.data.reason },
    update: { content: body.data.content, reason: body.data.reason },
  });

  // Kaç kişi tahmin etti?
  const guessCount    = await db.guess.count({ where: { roundId } });
  const totalGuessers = round.game.room.participants.length - 1; // answerer hariç

  await pusherServer.trigger(`game-${round.gameId}`, "guess-submitted", {
    roundId,
    userId:      user.id,
    guessCount,
    totalGuessers,
    allDone: guessCount >= totalGuessers,
  });

  return NextResponse.json(guess, { status: 201 });
}
