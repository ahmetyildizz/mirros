import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer, safeTrigger } from "@/lib/pusher/server";
import { scoreRound, getPoints, normalize } from "@/lib/services/scoring.service";
import { advanceGame } from "@/lib/services/game.service";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { id: userId } = await requireAuth();
  const { roundId } = await params;

  const round = await db.round.findUnique({
    where:   { id: roundId },
    include: {
      question: { select: { penalty: true } },
      answers: true,
      guesses: { include: { user: { select: { id: true, username: true, email: true } } } },
      game:    { include: { room: { include: { participants: { include: { user: true } } } } } },
    },
  });
  if (!round)                       return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status === "SCORED")    return NextResponse.json({ error: "Zaten skorlandı" }, { status: 409 });
  if (round.status !== "GUESSING")  return NextResponse.json({ error: "Round henüz tahmin aşamasında değil" }, { status: 409 });

  // Race condition koruması: GUESSING → SCORED geçişini atomik olarak sahiplen.
  // İki eş zamanlı istek gelirse sadece biri 1 satır günceller, diğeri 0 alır → erken çıkar.
  const claimed = await db.round.updateMany({
    where: { id: roundId, status: "GUESSING" },
    data:  { status: "SCORED" },
  });
  if (claimed.count === 0) {
    return NextResponse.json({ error: "Zaten skorlandı" }, { status: 409 });
  }

  // EXPOSE modunda answererId null olduğundan isAnswerer her zaman false,
  // EXPOSE'da sadece host scoring yapabilir.
  const isHost     = round.game.room.hostId === userId;
  const isAnswerer = round.answererId !== null && round.answererId === userId;
  if (!isHost && !isAnswerer) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const isExpose = round.game.room.gameMode === "EXPOSE";
  const isBluff  = round.game.room.gameMode === "BLUFF";
  const answer = round.answers.find((a) => a.userId === round.answererId);
  if (!isExpose && !isBluff && !answer) return NextResponse.json({ error: "Cevap henüz gönderilmedi" }, { status: 422 });

  // Tüm tahminleri değerlendir (her guesser için ayrı skor)
  const scores: { id: string; gameId: string; roundId: string; guesserId: string; matchLevel: string; points: number; createdAt: Date }[] = [];
  const guessResults: { userId: string; username: string; guess: string; reason: string | null; matchLevel: string; points: number }[] = [];

  // EXPOSE Modu için çoğunluk oylaması (Majority Vote)
  let exposeWinnerContent: string | null = null;
  let exposeWinnerId: string | null = null;
  
  if (isExpose && round.guesses.length > 0) {
    const voteCounts: Record<string, number> = {};
    for (const g of round.guesses) {
      voteCounts[g.content] = (voteCounts[g.content] || 0) + 1;
    }
    // Beraberlik durumunda kazananlardan rastgele birini seç
    const maxVotes = Math.max(...Object.values(voteCounts));
    const tiedOptions = Object.keys(voteCounts).filter(k => voteCounts[k] === maxVotes);
    exposeWinnerContent = tiedOptions[Math.floor(Math.random() * tiedOptions.length)];

    // Kazanan kullanıcının ID'sini bul (büyük/küçük harf + boşluk toleranslı)
    const normalizedWinner = exposeWinnerContent.toLowerCase().trim();
    const winnerPart = round.game.room.participants.find(
      p => (p.user.username ?? p.user.email ?? "").toLowerCase().trim() === normalizedWinner
    );
    exposeWinnerId = winnerPart?.userId ?? null;
  }

  // BLUFF Modu skoru
  if (isBluff) {
    const bluffRound = await db.round.findUnique({
      where: { id: roundId },
      include: {
        question: true,
        answers: { include: { user: { select: { id: true, username: true } } } },
        guesses: { include: { user: { select: { id: true, username: true } } } },
      },
    });
    if (!bluffRound) return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });

    const realAnswer = bluffRound.question.correct ?? "";
    const bluffGuessResults: { userId: string; username: string; guess: string; reason: string | null; matchLevel: string; points: number }[] = [];

    // 1. Doğru cevabı tahmin edenlere +5 puan
    for (const g of bluffRound.guesses) {
      const isCorrect = normalize(g.content) === normalize(realAnswer);
      const pts = isCorrect ? 5 : 0;
      await db.score.upsert({
        where:  { roundId_guesserId: { roundId, guesserId: g.userId } },
        create: { roundId, gameId: round.gameId, guesserId: g.userId, matchLevel: isCorrect ? "EXACT" : "WRONG", points: pts },
        update: { matchLevel: isCorrect ? "EXACT" : "WRONG", points: pts },
      });
      bluffGuessResults.push({ userId: g.userId, username: g.user.username ?? "?", guess: g.content, reason: g.reason ?? null, matchLevel: isCorrect ? "EXACT" : "WRONG", points: pts });
    }

    // 2. Sahte cevabına oy gelen oyunculara +3 puan/oy
    for (const ans of bluffRound.answers) {
      const votesForBluff = bluffRound.guesses.filter(g => normalize(g.content) === normalize(ans.content)).length;
      if (votesForBluff > 0) {
        const bonusPts = votesForBluff * 3;
        // Mevcut skoru oku, üzerine ekle (Prisma upsert.update fonksiyon kabul etmez)
        const existing = await db.score.findUnique({
          where: { roundId_guesserId: { roundId, guesserId: ans.userId } },
        });
        await db.score.upsert({
          where:  { roundId_guesserId: { roundId, guesserId: ans.userId } },
          create: { roundId, gameId: round.gameId, guesserId: ans.userId, matchLevel: "CLOSE", points: bonusPts },
          update: { matchLevel: "CLOSE", points: (existing?.points ?? 0) + bonusPts },
        });
      }
    }

    // round.update kaldırıldı — optimistic lock ile yukarıda zaten SCORED yapıldı

    const allScores = await db.score.findMany({ where: { gameId: round.gameId } });
    const bluffPlayerScores: Record<string, number> = {};
    for (const s of allScores) {
      bluffPlayerScores[s.guesserId] = (bluffPlayerScores[s.guesserId] ?? 0) + s.points;
    }

    const { advanceGame } = await import("@/lib/services/game.service");
    const bluffAdvance = await advanceGame(round.gameId, round.number);
    let bluffNextRound: any = null;
    if (!bluffAdvance.finished && bluffAdvance.round) {
      const nextR = await db.round.findUnique({ where: { id: bluffAdvance.round.id }, include: { question: true } });
      if (nextR) bluffNextRound = { id: nextR.id, number: nextR.number, questionId: nextR.questionId, questionText: nextR.question.text, questionCategory: nextR.question.category, questionOptions: nextR.question.options as string[] | null, answererId: nextR.answererId };
    }

    await safeTrigger(`game-${round.gameId}`, "round-scored", {
      roundId,
      answererId:   null,
      answer:       realAnswer,
      guessResults: bluffGuessResults,
      playerScores: bluffPlayerScores,
      penalty:      null,
      nextRound:    bluffNextRound,
    });

    return NextResponse.json({ bluffPlayerScores, nextRound: bluffNextRound });
  }

  for (const guess of round.guesses) {
    let matchLevel = "WRONG";
    let points = 0;

    if (isExpose) {
       if (guess.content === exposeWinnerContent) {
         matchLevel = "EXACT";
         points = 10;
       } else {
         matchLevel = "WRONG";
         points = 0;
       }
    } else {
       matchLevel = scoreRound(answer!.content, guess.content);
       points     = getPoints(matchLevel as any);
    }

    const score = await db.score.upsert({
      where:  { roundId_guesserId: { roundId, guesserId: guess.userId } },
      create: { roundId, gameId: round.gameId, guesserId: guess.userId, matchLevel: matchLevel as any, points },
      update: { matchLevel: matchLevel as any, points },
    });

    const isSuccess = matchLevel === "EXACT" || matchLevel === "CLOSE";
    const updatedParticipant = await db.roomParticipant.update({
      where: { roomId_userId: { roomId: round.game.roomId, userId: guess.userId } },
      data:  { streak: isSuccess ? { increment: 1 } : 0 } as any
    }) as any;

    scores.push(score);
    guessResults.push({
      userId:    guess.userId,
      username:  guess.user.username ?? guess.user.email,
      guess:     guess.content,
      reason:    guess.reason ?? null,
      matchLevel,
      points,
      streak:    updatedParticipant.streak
    } as any);

    await createAuditLog({
      action: "SUBMIT_SCORE",
      entityType: "SCORE",
      entityId: score.id,
      resource: `Round ${roundId} scored for guesser ${guess.userId}`,
      userId: userId,
      details: { points, matchLevel }
    });
  }

  // round.update kaldırıldı — optimistic lock ile yukarıda zaten SCORED yapıldı

  // 1. Her oyuncunun toplam puanı
  const allScores = await db.score.findMany({ where: { gameId: round.gameId } });
  const playerScores: Record<string, number> = {};
  for (const s of allScores) {
    playerScores[s.guesserId] = (playerScores[s.guesserId] ?? 0) + s.points;
  }

  // 2. Bir sonraki turu arkada başlat veya oyunu bitir
  const advanceResult = await advanceGame(round.gameId, round.number);
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
  await safeTrigger(`game-${round.gameId}`, "round-scored", {
    roundId:      roundId,
    answererId:   round.answererId,
    answer:       isExpose ? exposeWinnerContent : answer!.content,
    winnerId:     exposeWinnerId, // EXPOSE modu için kazanan (kurban) ID'si
    guessResults,
    playerScores,
    penalty:      round.question?.penalty ?? null,
    nextRound:    nextRoundData, // Opsiyonel: varsa client hemen geçer
  });

  return NextResponse.json({ scores, playerScores, nextRound: nextRoundData });
}
