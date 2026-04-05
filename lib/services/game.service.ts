import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher/server";

const SOCIAL_ROUNDS = 10;
const QUIZ_ROUNDS   = 10;

async function pickQuestion(excludeIds: string[], gameMode: "SOCIAL" | "QUIZ", ageGroup?: string | null) {
  const candidates = await db.question.findMany({
    where: {
      isActive: true,
      gameMode,
      ...(ageGroup ? { ageGroup: ageGroup as "CHILD" | "ADULT" | "WISE" } : {}),
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    },
    select: { id: true },
  });
  if (candidates.length === 0) throw new Error("Soru havuzu tükendi");
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return db.question.findUniqueOrThrow({ where: { id: pick.id } });
}

function resolveSpotlight(roundNumber: number, participantIds: string[]): string {
  return participantIds[(roundNumber - 1) % participantIds.length];
}

export async function startGame(roomId: string) {
  const room = await db.room.findUnique({
    where:   { id: roomId },
    include: { participants: { orderBy: { joinedAt: "asc" }, include: { user: true } } },
  });
  if (!room) throw new Error("Oda bulunamadı");
  if (room.participants.length < 2) throw new Error("En az 2 oyuncu gerekli");
  if (room.status !== "ACTIVE") throw new Error("Oda aktif değil");

  const isQuiz         = room.gameMode === "QUIZ";
  const participantIds = room.participants.map((p) => p.userId);
  const totalRounds    = isQuiz ? QUIZ_ROUNDS : Math.max(SOCIAL_ROUNDS, participantIds.length * 2);

  // Bu odada daha önce kullanılan tüm soruları dışla (çapraz oyun tekrar önleme)
  const previousRounds = await db.round.findMany({
    where: { game: { roomId } },
    select: { questionId: true },
  });
  const usedIds = previousRounds.map((r) => r.questionId);

  const game = await db.game.create({ data: { roomId, totalRounds, status: "ACTIVE" } });

  const { round, question } = await createRound(game.id, 1, participantIds, usedIds, isQuiz, room.ageGroup);

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
  ageGroup?:  string | null
) {
  const question   = await pickQuestion(usedQuestionIds, isQuiz ? "QUIZ" : "SOCIAL", ageGroup);
  const answererId = isQuiz ? null : resolveSpotlight(number, participantIds);

  const round = await db.round.create({
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
