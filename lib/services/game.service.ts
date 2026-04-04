import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher/server";

const TOTAL_ROUNDS = 10; // N oyuncu için daha fazla round

async function pickQuestion(excludeIds: string[]) {
  const question = await db.question.findFirst({
    where:   { isActive: true, ...(excludeIds.length && { id: { notIn: excludeIds } }) },
    orderBy: { id: "asc" },
    skip:    Math.floor(Math.random() * 5),
  });
  if (!question) throw new Error("Soru havuzu tükendi");
  return question;
}

/** Spotlight sırası: katılım sırasına göre döngüsel */
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

  const participantIds = room.participants.map((p) => p.userId);
  const totalRounds    = Math.max(TOTAL_ROUNDS, participantIds.length * 2);

  const game = await db.game.create({
    data: { roomId, totalRounds, status: "ACTIVE" },
  });

  const { round, question } = await createRound(game.id, 1, participantIds, []);

  const players = room.participants.map((p) => ({
    id:       p.userId,
    username: p.user.username ?? p.user.email,
  }));

  await pusherServer.trigger(`room-${roomId}`, "game-started", {
    gameId:           game.id,
    roundId:          round.id,
    roundNumber:      1,
    totalRounds,
    questionId:       question.id,
    questionText:     question.text,
    questionCategory: question.category,
    answererId:       round.answererId,
    players,
  });

  return { game, round };
}

async function createRound(
  gameId: string,
  number: number,
  participantIds: string[],
  usedQuestionIds: string[]
) {
  const answererId = resolveSpotlight(number, participantIds);
  const question   = await pickQuestion(usedQuestionIds);

  const round = await db.round.create({
    data: { gameId, number, questionId: question.id, answererId, status: "ANSWERING" },
  });

  return { round, question };
}

export async function advanceGame(gameId: string, completedRoundNumber: number) {
  const game = await db.game.findUnique({
    where:   { id: gameId },
    include: {
      rounds:  { select: { questionId: true } },
      room:    { include: { participants: { orderBy: { joinedAt: "asc" } } } },
    },
  });
  if (!game) throw new Error("Oyun bulunamadı");

  const participantIds = game.room.participants.map((p) => p.userId);
  const isLastRound    = completedRoundNumber >= game.totalRounds;

  if (isLastRound) {
    await db.game.update({ where: { id: gameId }, data: { status: "FINISHED", finishedAt: new Date() } });
    await db.room.update({ where: { id: game.roomId }, data: { status: "FINISHED" } });

    // Her oyuncu için toplam puan hesapla
    const allScores = await db.score.findMany({ where: { gameId } });
    const playerScores: Record<string, number> = {};
    for (const s of allScores) {
      playerScores[s.guesserId] = (playerScores[s.guesserId] ?? 0) + s.points;
    }

    await pusherServer.trigger(`game-${gameId}`, "game-finished", { gameId, playerScores });
    return { finished: true, playerScores };
  }

  const nextNumber = completedRoundNumber + 1;
  const usedIds    = game.rounds.map((r) => r.questionId);
  const { round, question } = await createRound(gameId, nextNumber, participantIds, usedIds);

  await pusherServer.trigger(`game-${gameId}`, "round-started", {
    roundId:          round.id,
    roundNumber:      nextNumber,
    questionId:       question.id,
    questionText:     question.text,
    questionCategory: question.category,
    answererId:       round.answererId,
  });

  return { finished: false, round };
}
