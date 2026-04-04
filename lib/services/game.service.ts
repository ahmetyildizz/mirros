import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher/server";

const TOTAL_ROUNDS = 5;

function resolveRoles(
  roundNumber: number,
  hostId: string,
  guestId: string
): { answererId: string; guesserId: string } {
  return roundNumber % 2 === 1
    ? { answererId: hostId, guesserId: guestId }
    : { answererId: guestId, guesserId: hostId };
}

async function pickQuestion(excludeIds: string[]) {
  const question = await db.question.findFirst({
    where:   { isActive: true, ...(excludeIds.length && { id: { notIn: excludeIds } }) },
    orderBy: { id: "asc" },
    skip:    Math.floor(Math.random() * 5),
  });
  if (!question) throw new Error("Soru havuzu tükendi");
  return question;
}

export async function startGame(roomId: string) {
  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room?.guestId) throw new Error("Oda henüz dolu değil");
  if (room.status !== "ACTIVE") throw new Error("Oda aktif değil");

  const game = await db.game.create({
    data: { roomId, totalRounds: TOTAL_ROUNDS, status: "ACTIVE" },
  });

  const { round, question } = await createRound(game.id, 1, room.hostId, room.guestId, []);

  await pusherServer.trigger(`room-${roomId}`, "game-started", {
    gameId:           game.id,
    roundId:          round.id,
    roundNumber:      1,
    questionId:       round.questionId,
    questionText:     question.text,
    questionCategory: question.category,
    answererId:       round.answererId,
    guesserId:        round.guesserId,
  });

  return { game, round };
}

async function createRound(
  gameId: string,
  number: number,
  hostId: string,
  guestId: string,
  usedQuestionIds: string[]
) {
  const { answererId, guesserId } = resolveRoles(number, hostId, guestId);
  const question = await pickQuestion(usedQuestionIds);

  const round = await db.round.create({
    data: { gameId, number, questionId: question.id, answererId, guesserId, status: "ANSWERING" },
  });

  return { round, question };
}

export async function advanceGame(gameId: string, completedRoundNumber: number) {
  const game = await db.game.findUnique({
    where:   { id: gameId },
    include: { rounds: { select: { questionId: true } }, room: true },
  });
  if (!game) throw new Error("Oyun bulunamadı");

  const isLastRound = completedRoundNumber >= TOTAL_ROUNDS;

  if (isLastRound) {
    await db.game.update({ where: { id: gameId }, data: { status: "FINISHED", finishedAt: new Date() } });
    await db.room.update({ where: { id: game.roomId }, data: { status: "FINISHED" } });

    const allScores   = await db.score.findMany({ where: { gameId } });
    const totalPoints = allScores.reduce((s, sc) => s + sc.points, 0);
    const familiarity = Math.round((totalPoints / (TOTAL_ROUNDS * 10)) * 100);

    await pusherServer.trigger(`game-${gameId}`, "game-finished", { gameId, familiarity });
    return { finished: true, familiarity };
  }

  const nextNumber = completedRoundNumber + 1;
  const usedIds    = game.rounds.map((r) => r.questionId);
  const { round, question } = await createRound(
    gameId,
    nextNumber,
    game.room.hostId,
    game.room.guestId!,
    usedIds
  );

  await pusherServer.trigger(`game-${gameId}`, "round-started", {
    roundId:          round.id,
    roundNumber:      nextNumber,
    questionId:       round.questionId,
    questionText:     question.text,
    questionCategory: question.category,
    answererId:       round.answererId,
    guesserId:        round.guesserId,
  });

  return { finished: false, round };
}
