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
      guesses: { include: { user: { select: { id: true, username: true } } } },
      game:    { include: { room: { include: { participants: { include: { user: true } } } } } },
    },
  });
  if (!round)                       return NextResponse.json({ error: "Round bulunamadı" }, { status: 404 });
  if (round.status === "SCORED")    return NextResponse.json({ error: "Zaten skorlandı" }, { status: 409 });
  if (round.status !== "GUESSING")  return NextResponse.json({ error: "Round henüz tahmin aşamasında değil" }, { status: 409 });

  // Auth check ÖNCE — claim'den önce yapılmazsa non-host round'u "SCORED" işaretler,
  // host sonra 409 alır ve scoring hiç gerçekleşmez (kritik bug fix).
  const isHost     = round.game.room.hostId === userId;
  const isAnswerer = round.answererId !== null && round.answererId === userId;
  if (!isHost && !isAnswerer) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  // Race condition koruması: GUESSING → SCORED geçişini atomik olarak sahiplen.
  // İki eş zamanlı istek gelirse sadece biri 1 satır günceller, diğeri 0 alır → erken çıkar.
  const claimed = await db.round.updateMany({
    where: { id: roundId, status: "GUESSING" },
    data:  { status: "SCORED" },
  });
  if (claimed.count === 0) {
    return NextResponse.json({ error: "Zaten skorlandı" }, { status: 409 });
  }

  const isExpose = round.game.room.gameMode === "EXPOSE";
  const isBluff  = round.game.room.gameMode === "BLUFF";
  const isSpy    = round.game.room.gameMode === "SPY";
  const answer = round.answers.find((a) => a.userId === round.answererId);
  if (!isExpose && !isBluff && !isSpy && !answer) return NextResponse.json({ error: "Cevap henüz gönderilmedi" }, { status: 422 });

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
    const maxVotes = Math.max(...Object.values(voteCounts));
    const tiedOptions = Object.keys(voteCounts).filter(k => voteCounts[k] === maxVotes);

    if (tiedOptions.length === 1) {
      // Açık kazanan var
      exposeWinnerContent = tiedOptions[0];
      const normalizedWinner = exposeWinnerContent.toLowerCase().trim();
      const winnerPart = round.game.room.participants.find(
        p => (p.user.username ?? "Anonim").toLowerCase().trim() === normalizedWinner
      );
      exposeWinnerId = winnerPart?.userId ?? null;
    } else {
      // Beraberlik: kimse expose edilmiyor, kimse puan almıyor
      exposeWinnerContent = null;
      exposeWinnerId = null;
    }
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

    // 1+2: Tüm puanları önce bellekte hesapla, sonra toplu yaz
    const pointsMap: Record<string, { matchLevel: string; points: number }> = {};

    for (const g of bluffRound.guesses) {
      const isCorrect = normalize(g.content) === normalize(realAnswer);
      pointsMap[g.userId] = { matchLevel: isCorrect ? "EXACT" : "WRONG", points: isCorrect ? 5 : 0 };
      bluffGuessResults.push({ userId: g.userId, username: g.user.username ?? "?", guess: g.content, reason: g.reason ?? null, matchLevel: isCorrect ? "EXACT" : "WRONG", points: isCorrect ? 5 : 0 });
    }

    // Sahte cevabına oy gelen oyunculara +3 puan/oy (bellekte aggregation)
    for (const ans of bluffRound.answers) {
      const votesForBluff = bluffRound.guesses.filter(g => normalize(g.content) === normalize(ans.content)).length;
      if (votesForBluff > 0) {
        const existing = pointsMap[ans.userId];
        pointsMap[ans.userId] = {
          matchLevel: "CLOSE",
          points: (existing?.points ?? 0) + votesForBluff * 3,
        };
      }
    }

    // Tek seferde toplu upsert (paralel)
    await Promise.all(
      Object.entries(pointsMap).map(([guesserId, { matchLevel, points }]) =>
        db.score.upsert({
          where:  { roundId_guesserId: { roundId, guesserId } },
          create: { roundId, gameId: round.gameId, guesserId, matchLevel: matchLevel as any, points },
          update: { matchLevel: matchLevel as any, points },
        })
      )
    );

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

  // SPY Modu skoru
  if (isSpy) {
    const spyId = round.spyId;
    if (!spyId) return NextResponse.json({ error: "Spy ID missing" }, { status: 500 });

    const voteCounts: Record<string, number> = {};
    for (const g of round.guesses) {
      voteCounts[g.content] = (voteCounts[g.content] || 0) + 1;
    }

    const maxVotes = Math.max(...Object.values(voteCounts));
    const tiedOptions = Object.keys(voteCounts).filter(k => voteCounts[k] === maxVotes);
    
    // Beraberlik durumunda Casus lehine karar ver: Sadece TEK BİR isim en çok oyu aldıysa ve o casussa yakalanır.
    // Eğer oylarda beraberlik varsa (örn: 1-1-1 veya 2-2), casus yakalanmamış sayılır.
    const majorityVote = tiedOptions.length === 1 ? tiedOptions[0] : "BERABERLIK";

    const spyUser = round.game.room.participants.find(p => p.userId === spyId)?.user;
    const spyUsername = spyUser?.username ?? "";
    const isSpyCaught = majorityVote.toLowerCase().trim() === spyUsername.toLowerCase().trim();

    const spyRoundResults: any[] = [];
    
    // 1. Puanları dağıt
    for (const p of round.game.room.participants.filter(pt => pt.role !== "SPECTATOR")) {
      let pts = 0;
      let matchLabel = "WRONG";

      if (p.userId === spyId) {
        // Casus yakalanmadıysa +10
        pts = isSpyCaught ? 0 : 10;
        matchLabel = isSpyCaught ? "WRONG" : "EXACT";
      } else {
        // Vatandaşlar casusu bulduysa +5 (oy verenler)
        const myGuess = round.guesses.find(g => g.userId === p.userId)?.content ?? "";
        const didIVoteForSpy = myGuess.toLowerCase().trim() === spyUsername.toLowerCase().trim();
        pts = (didIVoteForSpy && isSpyCaught) ? 5 : 0;
        matchLabel = (didIVoteForSpy && isSpyCaught) ? "EXACT" : "WRONG";
      }

      await db.score.upsert({
        where:  { roundId_guesserId: { roundId, guesserId: p.userId } },
        create: { roundId, gameId: round.gameId, guesserId: p.userId, matchLevel: matchLabel as any, points: pts },
        update: { matchLevel: matchLabel as any, points: pts },
      });

      spyRoundResults.push({
        userId:    p.userId,
        username:  p.user.username ?? "Anonim",
        guess:     round.guesses.find(g => g.userId === p.userId)?.content ?? "-",
        reason:    round.guesses.find(g => g.userId === p.userId)?.reason ?? null,
        matchLevel: matchLabel,
        points:     pts,
      });
    }

    const allScores = await db.score.findMany({ where: { gameId: round.gameId } });
    const spyPlayerScores: Record<string, number> = {};
    for (const s of allScores) {
      spyPlayerScores[s.guesserId] = (spyPlayerScores[s.guesserId] ?? 0) + s.points;
    }

    const advanceRes = await advanceGame(round.gameId, round.number);
    let spyNextRound: any = null;
    if (!advanceRes.finished && advanceRes.round) {
      const nextR = await db.round.findUnique({ where: { id: advanceRes.round.id }, include: { question: true } });
      if (nextR) spyNextRound = { id: nextR.id, number: nextR.number, questionId: nextR.questionId, questionText: nextR.question.text, questionCategory: nextR.question.category, questionOptions: nextR.question.options as string[] | null, answererId: nextR.answererId };
    }

    await safeTrigger(`game-${round.gameId}`, "round-scored", {
      roundId,
      answererId:   spyId, // Casus "odak" olsun
      answer:       spyUsername,
      winnerId:     isSpyCaught ? null : spyId,
      guessResults: spyRoundResults,
      playerScores: spyPlayerScores,
      nextRound:    spyNextRound ? { ...spyNextRound, questionText: null } : null,
    });

    return NextResponse.json({ playerScores: spyPlayerScores, nextRound: spyNextRound });
  }

  for (const guess of round.guesses) {
    let matchLevel = "WRONG";
    let points = 0;

    if (isExpose) {
      if (exposeWinnerContent === null) {
        // Beraberlik — kimse puan almaz
        matchLevel = "WRONG";
        points = 0;
      } else if (guess.content === exposeWinnerContent) {
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
      username:  guess.user.username ?? "Anonim",
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
    answer:       isExpose ? (exposeWinnerContent ?? "Beraberlik! Kimse expose edilmedi.") : answer!.content,
    winnerId:     exposeWinnerId, // EXPOSE modu için kazanan (kurban) ID'si
    guessResults,
    playerScores,
    penalty:      round.question?.penalty ?? null,
    nextRound:    nextRoundData ? (round.game.room.gameMode === "SPY" ? { ...nextRoundData, questionText: null } : nextRoundData) : null, // SPY modunda metni gizle
  });

  return NextResponse.json({ scores, playerScores, nextRound: nextRoundData });
}
