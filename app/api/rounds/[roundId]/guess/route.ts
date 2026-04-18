import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer, safeTrigger } from "@/lib/pusher/server";
import { createAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  content: z.string().min(1).max(120),
  reason:  z.string().max(100).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const user = await requireAuth();

  // Rate limit: kullanıcı başına 15 tahmin/dakika
  const rl = await rateLimit(`guess:${user.id}`, { max: 15, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: "Çok fazla istek gönderdin" }, { status: 429 });

  const { roundId } = await params;
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Geçersiz içerik" }, { status: 400 });

  const round = await db.round.findUnique({
    where:   { id: roundId },
    include: { game: { include: { room: { include: { participants: true } } } } },
  });
  if (!round) return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status !== "GUESSING") return NextResponse.json({ error: "Bu round tahmin kabul etmiyor" }, { status: 409 });

  const isParticipant = round.game.room.participants.some((p) => p.userId === user.id);
  if (!isParticipant) return NextResponse.json({ error: "Bu oyunun katılımcısı değilsin" }, { status: 403 });
  if (round.answererId === user.id) return NextResponse.json({ error: "Cevaplayan tahmin edemez" }, { status: 403 });

  // Upsert: aynı kullanıcı tekrar tahmin gönderirse güncelle
  const guess = await db.guess.upsert({
    where:  { roundId_userId: { roundId, userId: user.id } },
    create: { roundId, userId: user.id, content: body.data.content, reason: body.data.reason },
    update: { content: body.data.content, reason: body.data.reason },
  });

  await createAuditLog({
    action: "SUBMIT_GUESS",
    entityType: "GUESS",
    entityId: guess.id,
    resource: `User submitted guess for Round ${roundId}`,
    userId: user.id,
    details: { content: body.data.content, reason: body.data.reason },
  });

  const isExpose     = round.game.room.gameMode === "EXPOSE";
  const participants = round.game.room.participants.filter(p => p.role === "PLAYER");
  
  // Tekilleştirme (Aynı kullanıcı ID'si kazara iki kez varsa)
  const uniqueParticipants = Array.from(new Map(participants.map(p => [p.userId, p])).values());
  const guessCount    = await db.guess.count({ where: { roundId } });

  // EXPOSE modunda herkes tahmin eder, SOCIAL'da answerer hariç
  const totalGuessers = isExpose
    ? uniqueParticipants.length
    : Math.max(0, uniqueParticipants.length - 1);

  await safeTrigger(`game-${round.gameId}`, "guess-submitted", {
    roundId,
    userId:      user.id,
    guessCount,
    totalGuessers,
    allDone: guessCount >= totalGuessers && totalGuessers >= 1,
  });

  return NextResponse.json(guess, { status: 201 });
}
