import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";
import { scoreRound, getPoints } from "@/lib/services/scoring.service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { id: userId } = await requireAuth();
  const { roundId } = await params;

  const round = await db.round.findUnique({
    where:   { id: roundId },
    include: {
      question: { select: { penalty: true } },
      answers: true,
      guesses: { include: { user: { select: { id: true, username: true, email: true } } } },
      game:    { include: { room: { include: { participants: true } } } },
    },
  });
  if (!round)                       return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status === "SCORED")    return NextResponse.json({ error: "Zaten skorlandı" }, { status: 409 });
  if (round.status !== "GUESSING")  return NextResponse.json({ error: "Round henüz tahmin aşamasında değil" }, { status: 409 });

  // Sadece odanın host'u veya round'un answerer'ı skorlayabilir
  const isHost     = round.game.room.hostId === userId;
  const isAnswerer = round.answererId === userId;
  if (!isHost && !isAnswerer) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const answer = round.answers.find((a) => a.userId === round.answererId);
  if (!answer) return NextResponse.json({ error: "Cevap henüz gönderilmedi" }, { status: 422 });

  // Tüm tahminleri değerlendir (her guesser için ayrı skor)
  const scores: { id: string; gameId: string; roundId: string; guesserId: string; matchLevel: string; points: number; createdAt: Date }[] = [];
  const guessResults: { userId: string; username: string; guess: string; reason: string | null; matchLevel: string; points: number }[] = [];

  for (const guess of round.guesses) {
    const matchLevel = scoreRound(answer.content, guess.content);
    const points     = getPoints(matchLevel);

    const score = await db.score.upsert({
      where:  { roundId_guesserId: { roundId, guesserId: guess.userId } },
      create: { roundId, gameId: round.gameId, guesserId: guess.userId, matchLevel, points },
      update: { matchLevel, points },
    });
    scores.push(score);
    guessResults.push({
      userId:    guess.userId,
      username:  guess.user.username ?? guess.user.email,
      guess:     guess.content,
      reason:    guess.reason ?? null,
      matchLevel,
      points,
    });
  }

  await db.round.update({ where: { id: roundId }, data: { status: "SCORED" } });

  // Her oyuncunun toplam puanı
  const allScores = await db.score.findMany({ where: { gameId: round.gameId } });
  const playerScores: Record<string, number> = {};
  for (const s of allScores) {
    playerScores[s.guesserId] = (playerScores[s.guesserId] ?? 0) + s.points;
  }

  await pusherServer.trigger(`game-${round.gameId}`, "round-scored", {
    roundId,
    answererId:  round.answererId,
    answer:      answer.content,
    guessResults,
    playerScores,
    penalty:     round.question?.penalty ?? null,
  });

  return NextResponse.json({ scores, playerScores });
}
