import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";
import { createAuditLog } from "@/lib/audit";

/** Türkçeye duyarlı metin normalleştirme: ilk harf büyük, trim, çoklu boşluk temizle */
function normalizeAnswer(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  const trUpperMap: Record<string, string> = { i: "İ", ı: "I", ş: "Ş", ç: "Ç", ğ: "Ğ", ü: "Ü", ö: "Ö" };
  const first = trimmed[0];
  const upperFirst = trUpperMap[first] ?? first.toUpperCase();
  return upperFirst + trimmed.slice(1);
}

const bodySchema = z.object({ content: z.string().min(1).max(200) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const user = await requireAuth();
  const { roundId } = await params;
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Geçersiz içerik" }, { status: 400 });

  const round = await db.round.findUnique({
    where:   { id: roundId },
    include: { game: { include: { room: { include: { participants: true } } } } },
  });
  if (!round)                       return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status !== "ANSWERING") return NextResponse.json({ error: "Bu round cevap kabul etmiyor" }, { status: 409 });

  const isParticipant = round.game.room.participants.some((p) => p.userId === user.id);
  if (!isParticipant) return NextResponse.json({ error: "Bu oyunun katılımcısı değilsin" }, { status: 403 });

  const isQuiz = round.game.room.gameMode === "QUIZ";

  // SOCIAL: sadece answererId cevap verebilir
  if (!isQuiz && round.answererId !== user.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const normalizedContent = normalizeAnswer(body.data.content);

  // Daha önce cevap verdiyse güncelle
  const answer = await db.answer.upsert({
    where:  { roundId_userId: { roundId, userId: user.id } },
    create: { roundId, userId: user.id, content: normalizedContent },
    update: { content: normalizedContent },
  });

  await createAuditLog({
    action: "SUBMIT_ANSWER",
    entityType: "ANSWER",
    entityId: answer.id,
    resource: `User submitted answer for Round ${roundId}`,
    userId: user.id,
    details: { content: normalizedContent, isQuiz },
  });

  if (isQuiz) {
    const totalParticipants = round.game.room.participants.length;
    const answerCount       = await db.answer.count({ where: { roundId } });
    const allAnswered       = answerCount >= totalParticipants;

    await pusherServer.trigger(`game-${round.gameId}`, "answer-submitted", {
      roundId,
      userId:        user.id,
      answerCount,
      totalParticipants,
      allAnswered,
    });

    if (allAnswered) {
      // Otomatik skor tetikle
      await scoreQuizRound(roundId, round.gameId);
    }
  } else {
    // SOCIAL: cevap verildi → guessing başlasın
    // Eğer serbest metin girdiyse, normalize edilmiş hali şıklara ekle
    const question = await db.question.findUnique({ where: { id: round.questionId } });
    const existingOptions = (question?.options ?? []) as string[];
    let updatedOptions: string[] | null = null;
    if (!existingOptions.includes(normalizedContent)) {
      // Shuffle'dan önce normalize edilmiş cevabı listeye karıştır
      const withCustom = [...existingOptions, normalizedContent];
      // Karıştır (Fisher-Yates)
      for (let i = withCustom.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [withCustom[i], withCustom[j]] = [withCustom[j], withCustom[i]];
      }
      updatedOptions = withCustom;
    }

    await db.round.update({ where: { id: roundId }, data: { status: "GUESSING" } });
    const totalGuessers = round.game.room.participants.length - 1; // answerer hariç
    await pusherServer.trigger(`game-${round.gameId}`, "answer-submitted", {
      roundId,
      answererId:   user.id,
      roomId:       round.game.roomId,
      updatedOptions,
      totalGuessers, // client'ın 0/0 göstermemesi için
    });
  }

  return NextResponse.json(answer, { status: 201 });
}

async function scoreQuizRound(roundId: string, gameId: string) {
  const round = await db.round.findUnique({
    where:   { id: roundId },
    include: {
      question: true,
      answers:  { include: { user: { select: { id: true, username: true, email: true } } } },
      game:     { include: { room: { include: { participants: true } } } },
    },
  });
  if (!round || round.status === "SCORED") return;

  const correct = round.question.correct ?? "";
  const results: { userId: string; username: string; answer: string; correct: boolean; points: number }[] = [];

  for (const ans of round.answers) {
    const isCorrect = ans.content.trim().toLowerCase() === correct.trim().toLowerCase();
    const points    = isCorrect ? 10 : 0;

    const score = await db.score.upsert({
      where:  { roundId_guesserId: { roundId, guesserId: ans.userId } },
      create: { roundId, gameId, guesserId: ans.userId, matchLevel: isCorrect ? "EXACT" : "WRONG", points },
      update: { matchLevel: isCorrect ? "EXACT" : "WRONG", points },
    });

    await createAuditLog({
      action: "SUBMIT_SCORE",
      entityType: "SCORE",
      entityId: score.id,
      resource: `Quiz Round Scored for User ${ans.userId}`,
      details: { points, isCorrect, matchLevel: score.matchLevel },
    });

    results.push({
      userId:   ans.userId,
      username: ans.user.username ?? ans.user.email,
      answer:   ans.content,
      correct:  isCorrect,
      points,
    });
  }

  await db.round.update({ where: { id: roundId }, data: { status: "SCORED" } });

  const allScores = await db.score.findMany({ where: { gameId } });
  const playerScores: Record<string, number> = {};
  for (const s of allScores) {
    playerScores[s.guesserId] = (playerScores[s.guesserId] ?? 0) + s.points;
  }

  // 2. Bir sonraki turu arkada başlat veya oyunu bitir
  const { advanceGame } = await import("@/lib/services/game.service");
  const advanceResult = await advanceGame(gameId, round.number);
  const isFinished    = advanceResult.finished;
  let nextRoundData: any = null;

  if (!isFinished && advanceResult.round) {
    // Round detaylarını al (Pusher'dan client'a göndereceğiz)
    const nextR = await db.round.findUnique({
      where: { id: advanceResult.round.id },
      include: { question: true }
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

  // 3. Tek bir event ile hem sonuçları hem de yeni soruyu gönder
  await pusherServer.trigger(`game-${gameId}`, "quiz-round-scored", {
    roundId,
    correctAnswer: correct,
    results,
    playerScores,
    penalty:   round.question.penalty ?? null,
    nextRound: nextRoundData, // Host'un 'Sıradaki Tura Geç' butonu için gerekli
  });
}
