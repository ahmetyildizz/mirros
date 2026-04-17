import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer, safeTrigger } from "@/lib/pusher/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { id: userId } = await requireAuth();
  const { roundId } = await params;

  const round = await db.round.findUnique({
    where:   { id: roundId },
    include: {
      question: true,
      game:    { include: { room: true } },
    },
  });

  if (!round) return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });

  // Sadece odanın host'u başlatabilir
  if (round.game.room.hostId !== userId) {
    return NextResponse.json({ error: "Sadece oda sahibi sonraki tura geçebilir" }, { status: 403 });
  }

  // The initial state is managed by createRound in game.service.ts

  // Broadcat start to all players
  await safeTrigger(`game-${round.gameId}`, "round-started", {
    roundId:          round.id,
    roundNumber:      round.number,
    questionId:       round.questionId,
    questionText:     round.question.text,
    questionCategory: round.question.category,
    questionOptions:  round.question.options ?? null,
    answererId:       round.answererId ?? null,
  });

  return NextResponse.json({ success: true });
}
