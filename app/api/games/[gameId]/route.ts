import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const user = await requireAuth();
  const { gameId } = await params;

  const game = await db.game.findUnique({
    where:   { id: gameId },
    include: {
      room:   { include: { participants: { include: { user: true } } } },
      rounds: {
        orderBy: { number: "desc" },
        take:    1,
        include: { question: true, answers: true, guesses: true },
      },
      scores: true,
    },
  });

  if (!game) return NextResponse.json({ error: "Oyun bulunamadı" }, { status: 404 });

  const isParticipant = game.room.participants.some((p) => p.userId === user.id);
  if (!isParticipant) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const currentRound = game.rounds[0];
  if (!currentRound) return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });

  // Oyuncuları ve skorlarını hazırla
  const playerScores: Record<string, number> = {};
  for (const s of game.scores) {
    playerScores[s.guesserId] = (playerScores[s.guesserId] ?? 0) + s.points;
  }

  // Round durumuna göre tahmin sayısını belirle
  let guessCount = 0;
  if (currentRound.status === "GUESSING") {
    guessCount = currentRound.guesses.length;
  } else if (currentRound.status === "ANSWERING" && game.room.gameMode === "QUIZ") {
    guessCount = currentRound.answers.length;
  }

  return NextResponse.json({
    gameId:       game.id,
    roomId:       game.roomId,
    gameMode:     game.room.gameMode,
    state:        currentRound.status,
    activeRoundId:currentRound.id,
    currentRound: currentRound.number,
    totalRounds:  game.totalRounds,
    answererId:   currentRound.answererId,
    question: {
      id:       currentRound.question.id,
      text:     currentRound.question.text,
      category: currentRound.question.category,
      options:  currentRound.question.options,
    },
    playerScores,
    guessCount,
    // EXPOSE modunda herkes tahmin eder, SOCIAL/QUIZ'de answerer hariç
    totalGuessers: game.room.gameMode === "EXPOSE"
      ? game.room.participants.length
      : (game.room.participants.length - 1) || 0,
    totalParticipants: game.room.participants.length,
    players: game.room.participants.map((p) => ({
      id:       p.userId,
      username: (p as any).user?.username ?? (p as any).user?.email ?? "?",
    })),
  });
}
