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
  if (!round)                        return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.guesserId !== user.id)   return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  if (round.status !== "GUESSING")   return NextResponse.json({ error: "Bu round tahmin kabul etmiyor" }, { status: 409 });

  const guess = await db.guess.create({
    data: { roundId, userId: user.id, content: body.data.content },
  });

  await pusherServer.trigger(`game-${round.gameId}`, "guess-submitted", { roundId });

  return NextResponse.json(guess, { status: 201 });
}
