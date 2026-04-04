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

  const round = await db.round.findUnique({ where: { id: roundId } });
  if (!round) return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status !== "SCORED") return NextResponse.json({ error: "Round henüz skorlanmadı" }, { status: 409 });
  if (round.answererId !== userId) return NextResponse.json({ error: "Sadece cevap veren ilerleyebilir" }, { status: 403 });

  const result = await advanceGame(round.gameId, round.number);
  return NextResponse.json(result);
}
