import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher/server";

const SOCIAL_ROUNDS = 10;
const QUIZ_ROUNDS   = 10;

async function pickQuestion(excludeIds: string[], gameMode: "SOCIAL" | "QUIZ", ageGroup?: string | null, tx = db) {
  // 1. TAM EŞLEŞEN: Aynı gameMode VE aynı ageGroup (veya null)
  let candidates = await tx.question.findMany({
    where: {
      isActive: true,
      gameMode,
      ...(ageGroup ? {
        OR: [
          { ageGroup: ageGroup as "CHILD" | "ADULT" | "WISE" },
          { ageGroup: null },
        ],
      } : {}),
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    },
    select: { id: true },
  });

  // 2. Havuz boşsa (hiç soru yoksa veya hepsi kullanıldıysa): Yaş kriterini esnet ve exclude'u kaldır
  if (candidates.length === 0) {
    candidates = await tx.question.findMany({
      where: {
        isActive: true,
        gameMode,
        // Yaş kriterini kaldırıyoruz veya sadece null olanları alıyoruz
      },
      select: { id: true },
    });
  }

  if (candidates.length === 0) throw new Error("Soru havuzu gerçekten boş");
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return tx.question.findUniqueOrThrow({ where: { id: pick.id } });
}

function resolveSpotlight(roundNumber: number, participantIds: string[]): string {
  return participantIds[(roundNumber - 1) % participantIds.length];
}

export async function startGame(roomId: string) {
  // Atomik kontrol: zaten aktif bir game varsa erken çık (race condition önlemi)
  const existingGame = await db.game.findFirst({
    where: { roomId, status: "ACTIVE" },
    include: { rounds: { take: 1 } },
  });

  // Eğer oyun varsa ve round'u da varsa hata ver. Ama round'u yoksa (ghost game), onu bitmiş sayıp yeni başlatabiliriz.
  if (existingGame && existingGame.rounds.length > 0) {
    throw new Error("Oyun zaten başlatıldı");
  }

  const room = await db.room.findUnique({
    where:   { id: roomId },
    include: { participants: { orderBy: { joinedAt: "asc" }, include: { user: true } } },
  });
  if (!room) throw new Error("Oda bulunamadı");
  if (room.participants.length < 2) throw new Error("En az 2 oyuncu gerekli");
  if (room.status === "FINISHED") throw new Error("Oda kapandı");

  const isQuiz         = room.gameMode === "QUIZ";
  const participantIds = room.participants.map((p) => p.userId);
  const totalRounds    = isQuiz ? QUIZ_ROUNDS : SOCIAL_ROUNDS;

  const ageCounts: Record<string, number> = {};
  for (const p of room.participants) {
    if (p.ageGroup) ageCounts[p.ageGroup] = (ageCounts[p.ageGroup] ?? 0) + 1;
  }
  const majorityAgeGroup = (Object.entries(ageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as "CHILD" | "ADULT" | "WISE" | null;

  if (majorityAgeGroup) {
    await db.room.update({ where: { id: roomId }, data: { ageGroup: majorityAgeGroup } });
  }

  const previousRounds = await db.round.findMany({
    where: { game: { roomId } },
    select: { questionId: true },
  });
  const usedIds = previousRounds.map((r) => r.questionId);

  // Ghost game'i temizle (varsa)
  if (existingGame) {
    await db.game.update({ where: { id: existingGame.id }, data: { status: "FINISHED" } });
  }

  const { game, round, question } = await db.$transaction(async (tx) => {
    const newGame = await tx.game.create({
      data: { roomId, totalRounds, status: "ACTIVE" },
    });

    // İlk round için de kişiselleştirilmiş yaş grubunu bulalım
    const answererId = isQuiz ? null : resolveSpotlight(1, participantIds);
    const answerer   = room.participants.find((p) => p.userId === answererId);
    const roundAgeGroup = isQuiz ? majorityAgeGroup : (answerer?.ageGroup ?? majorityAgeGroup);

    const { round, question } = await createRound(newGame.id, 1, participantIds, usedIds, isQuiz, roundAgeGroup, tx as any);
    return { game: newGame, round, question };
  });

  const players = room.participants.map((p) => ({
    id:       p.userId,
    username: p.user.username ?? p.user.email,
  }));

  await pusherServer.trigger(`room-${roomId}`, "game-started", {
    gameId:           game.id,
    gameMode:         room.gameMode,
    ageGroup:         room.ageGroup,
    roundId:          round.id,
    roundNumber:      1,
    totalRounds,
    questionId:       question.id,
    questionText:     question.text,
    questionCategory: question.category,
    questionOptions:  question.options ?? null,
    answererId:       round.answererId ?? null,
    players,
  });

  return { game, round };
}

async function createRound(
  gameId:     string,
  number:     number,
  participantIds: string[],
  usedQuestionIds: string[],
  isQuiz:     boolean,
  ageGroup?:  string | null,
  tx = db
) {
  const answererId = isQuiz ? null : resolveSpotlight(number, participantIds);
  
  // Eğer SOCIAL modundaysak, answerer'ın kendi yaş grubunu kullanalım (kişiselleştirme)
  let actualAgeGroup = ageGroup;
  if (!isQuiz && answererId) {
    const participant = await tx.roomParticipant.findFirst({
       where: {
         userId: answererId,
         room: { games: { some: { id: gameId } } }
       },
       select: { ageGroup: true }
    });
    if (participant?.ageGroup) actualAgeGroup = participant.ageGroup;
  }

  const question = await pickQuestion(usedQuestionIds, isQuiz ? "QUIZ" : "SOCIAL", actualAgeGroup, tx as any);

  const round = await (tx as any).round.create({
    data: { gameId, number, questionId: question.id, answererId, status: "ANSWERING" },
  });

  return { round, question };
}

export async function advanceGame(gameId: string, completedRoundNumber: number) {
  const game = await db.game.findUnique({
    where:   { id: gameId },
    include: {
      rounds: { select: { questionId: true } },
      room:   { include: { participants: { orderBy: { joinedAt: "asc" } } } },
    },
  });
  if (!game) throw new Error("Oyun bulunamadı");

  const isQuiz         = game.room.gameMode === "QUIZ";
  const participantIds = game.room.participants.map((p) => p.userId);
  const isLastRound    = completedRoundNumber >= game.totalRounds;

  if (isLastRound) {
    await db.game.update({ where: { id: gameId }, data: { status: "FINISHED", finishedAt: new Date() } });
    await db.room.update({ where: { id: game.roomId }, data: { status: "FINISHED" } });

    const allScores = await db.score.findMany({ where: { gameId } });
    const playerScores: Record<string, number> = {};
    for (const s of allScores) {
      playerScores[s.guesserId] = (playerScores[s.guesserId] ?? 0) + s.points;
    }

    await pusherServer.trigger(`game-${gameId}`, "game-finished", { gameId, playerScores });
    return { finished: true, playerScores };
  }

  const nextNumber = completedRoundNumber + 1;
  // Bu odadaki tüm oyunların kullandığı soruları dışla
  const allRoomRounds = await db.round.findMany({
    where: { game: { roomId: game.roomId } },
    select: { questionId: true },
  });
  const usedIds = allRoomRounds.map((r) => r.questionId);
  const { round, question } = await createRound(gameId, nextNumber, participantIds, usedIds, isQuiz, game.room.ageGroup);

  await pusherServer.trigger(`game-${gameId}`, "round-started", {
    roundId:          round.id,
    roundNumber:      nextNumber,
    questionId:       question.id,
    questionText:     question.text,
    questionCategory: question.category,
    questionOptions:  question.options ?? null,
    answererId:       round.answererId ?? null,
  });

  return { finished: false, round };
}
