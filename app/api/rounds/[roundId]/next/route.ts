import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { advanceGame } from "@/lib/services/game.service";

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
  if (!round) return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status !== "SCORED") return NextResponse.json({ error: "Round henüz skorlanmadı" }, { status: 409 });

  const isAnswerer = round.answererId === userId;
  const isHost     = round.game.room.hostId === userId;
  // QUIZ modunda answererId null → sadece host ilerleyebilir
  // SOCIAL modunda answerer veya host ilerleyebilir
  if (!isAnswerer && !isHost) {
    return NextResponse.json({ error: "Sadece host veya cevap veren ilerleyebilir" }, { status: 403 });
  }

  const result = await advanceGame(round.gameId, round.number);
  return NextResponse.json(result);
}
