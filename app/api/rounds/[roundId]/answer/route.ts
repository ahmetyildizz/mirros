import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";

const bodySchema = z.object({ content: z.string().min(1).max(120) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const user = await requireAuth();
  const { roundId } = await params;
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Geçersiz içerik" }, { status: 400 });

  const round = await db.round.findUnique({ where: { id: roundId } });
  if (!round)                          return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.answererId !== user.id)    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  if (round.status !== "ANSWERING")    return NextResponse.json({ error: "Bu round cevap kabul etmiyor" }, { status: 409 });

  const answer = await db.answer.create({
    data: { roundId, userId: user.id, content: body.data.content },
  });

  await db.round.update({ where: { id: roundId }, data: { status: "GUESSING" } });

  const game = await db.game.findUnique({ where: { id: round.gameId } });
  await pusherServer.trigger(`game-${round.gameId}`, "answer-submitted", {
    roundId,
    roomId: game?.roomId,
  });

  return NextResponse.json(answer, { status: 201 });
}
