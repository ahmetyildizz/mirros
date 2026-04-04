import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";
import { scoreRound, getPoints, calculateFamiliarity } from "@/lib/services/scoring.service";
import { advanceGame } from "@/lib/services/game.service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  await requireAuth();
  const { roundId } = await params;

  const round = await db.round.findUnique({
    where:   { id: roundId },
    include: { answers: true, guesses: true, game: true },
  });
  if (!round)                    return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status === "SCORED") return NextResponse.json({ error: "Zaten skorlandı" }, { status: 409 });

  const answer = round.answers.find((a) => a.userId === round.answererId);
  const guess  = round.guesses.find((g) => g.userId === round.guesserId);
  if (!answer || !guess) return NextResponse.json({ error: "Cevap veya tahmin eksik" }, { status: 422 });

  const matchLevel = scoreRound(answer.content, guess.content);
  const points     = getPoints(matchLevel);

  const score = await db.score.create({
    data: { roundId, gameId: round.gameId, guesserId: round.guesserId, matchLevel, points },
  });

  await db.round.update({ where: { id: roundId }, data: { status: "SCORED" } });

  const allScores   = await db.score.findMany({ where: { gameId: round.gameId } });
  const totalPoints = allScores.reduce((s, sc) => s + sc.points, 0);
  const familiarity = calculateFamiliarity(totalPoints, round.game.totalRounds);

  await pusherServer.trigger(`game-${round.gameId}`, "round-scored", {
    roundId, matchLevel, points, familiarity,
    answer: answer.content,
    guess:  guess.content,
  });

  // Sonraki round veya oyun sonu
  await advanceGame(round.gameId, round.number);

  return NextResponse.json({ ...score, familiarity });
}
