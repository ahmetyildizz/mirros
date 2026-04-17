import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { safeTrigger } from "@/lib/pusher/server";
import { advanceGame } from "@/lib/services/game.service";

/**
 * POST /api/rounds/[roundId]/skip
 * Cevap alınamayan (stuck) bir round'u host geçer.
 * Sadece ANSWERING veya GUESSING state'inde çalışır.
 * Skorsuz olarak SCORED'a geçirir, oyunu ilerletir.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { id: userId } = await requireAuth();
  const { roundId } = await params;

  const round = await db.round.findUnique({
    where:   { id: roundId },
    include: { game: { include: { room: true } } },
  });

  if (!round)                    return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status === "SCORED") return NextResponse.json({ error: "Zaten tamamlandı" }, { status: 409 });
  if (round.status !== "ANSWERING" && round.status !== "GUESSING") {
    return NextResponse.json({ error: "Geçilemez durum" }, { status: 409 });
  }

  const isHost     = round.game.room.hostId === userId;
  const isAnswerer = round.answererId !== null && round.answererId === userId;
  if (!isHost && !isAnswerer) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await db.round.update({ where: { id: roundId }, data: { status: "SCORED" } });

  // Mevcut puanları topla (bu turda puan yok, önceki birikimler korunur)
  const allScores = await db.score.findMany({ where: { gameId: round.gameId } });
  const playerScores: Record<string, number> = {};
  for (const s of allScores) {
    playerScores[s.guesserId] = (playerScores[s.guesserId] ?? 0) + s.points;
  }

  const advanceResult = await advanceGame(round.gameId, round.number);
  let nextRoundData: any = null;
  if (!advanceResult.finished && advanceResult.round) {
    const nextR = await db.round.findUnique({
      where:   { id: advanceResult.round.id },
      include: { question: true },
    });
    if (nextR) {
      nextRoundData = {
        id:               nextR.id,
        number:           nextR.number,
        questionId:       nextR.questionId,
        questionText:     nextR.question.text,
        questionCategory: nextR.question.category,
        questionOptions:  nextR.question.options as string[] | null,
        answererId:       nextR.answererId,
      };
    }
  }

  await safeTrigger(`game-${round.gameId}`, "round-scored", {
    roundId,
    answererId:   round.answererId,
    answer:       "⏭️ Geçildi",
    winnerId:     null,
    guessResults: [],
    playerScores,
    penalty:      null,
    nextRound:    nextRoundData,
  });

  return NextResponse.json({ ok: true, skipped: true });
}
