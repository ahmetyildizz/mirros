import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher/server";
import { createAuditLog } from "@/lib/audit";

const SOCIAL_ROUNDS = 10;
const QUIZ_ROUNDS   = 10;

async function pickQuestion(excludeIds: string[], gameMode: "SOCIAL" | "QUIZ" | "EXPOSE", ageGroup?: string | null, category?: string | null, roomId?: string | null, tx = db) {
  // Tema/Lobi Modu eşleştirmesi
  const themeMap: Record<string, string[]> = {
    "Çift Gecesi": ["İlişki", "Duygu", "Kişilik", "Yaşam"],
    "Aile Toplantısı": ["Anılar", "Nostalji", "Yemek", "Yaşam", "Sosyal"],
    "Doğum Günü": ["Anılar", "Eğlence", "Kişilik", "Sosyal", "Nostalji"],
    "Takım Building": ["Yaşam", "Duygu", "Değerler", "Sosyal", "Kişilik", "Dijital"],
  };

  const targetCategories = category ? themeMap[category] : null;

  // 0. ÖNCELİKLİ: Varsa Odaya Özel Soru
  if (roomId) {
    const roomCandidates = await tx.question.findMany({
      where: { roomId, isActive: true, gameMode, ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}) },
      select: { id: true },
    });
    if (roomCandidates.length > 0) {
      const pick = roomCandidates[Math.floor(Math.random() * roomCandidates.length)];
      return tx.question.findUniqueOrThrow({ where: { id: pick.id } });
    }
  }

  // 1. ADIM: Tema Eşleşen VE ŞIKLI (Multiple Choice) Sorular
  let candidates: { id: string }[] = [];
  if (targetCategories) {
    candidates = await tx.question.findMany({
      where: {
        isActive: true,
        gameMode,
        category: { in: targetCategories },
        ...(gameMode === "EXPOSE" ? {} : { NOT: { options: { equals: [] } } }), // Boş dizi olmayanları (şıklıları) bul, EXPOSE ise şık gerekmez
        ...(ageGroup ? {
          OR: [{ ageGroup: ageGroup as "CHILD" | "ADULT" | "WISE" }, { ageGroup: null }],
        } : {}),
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      select: { id: true },
    });
  }

  // 2. ADIM: Havuz boşsa (hiç şıklı soru yoksa veya bitmişse): Tüm Tema Soruları (Şıklı veya Şıksız)
  if (candidates.length === 0 && targetCategories) {
    candidates = await tx.question.findMany({
      where: {
        isActive: true,
        gameMode,
        category: { in: targetCategories },
        ...(ageGroup ? {
          OR: [{ ageGroup: ageGroup as "CHILD" | "ADULT" | "WISE" }, { ageGroup: null }],
        } : {}),
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      select: { id: true },
    });
  }

  // 3. ADIM: Hala boşsa: Tema kısıtlamasını kaldır, genel havuzdan seç
  if (candidates.length === 0) {
    candidates = await tx.question.findMany({
      where: {
        isActive: true,
        gameMode,
        ...(ageGroup ? {
          OR: [{ ageGroup: ageGroup as "CHILD" | "ADULT" | "WISE" }, { ageGroup: null }],
        } : {}),
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      select: { id: true },
    });
  }

  // 4. ADIM: Son Çare: Her şeyi esnet (exclude ve ageGroup dahil)
  if (candidates.length === 0) {
    candidates = await tx.question.findMany({
      where: { isActive: true, gameMode },
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
  
  // Sadece PLAYER olanları asıl katılımcı sayıyoruz
  const participants = room.participants.filter(p => (p as any).role !== "SPECTATOR");
  if (participants.length < 2) throw new Error("En az 2 ana oyuncu gerekli");
  if (room.status === "FINISHED") throw new Error("Oda kapandı");

  const isQuiz         = room.gameMode === "QUIZ";
  const isExpose       = room.gameMode === "EXPOSE";
  const participantIds = participants.map((p) => p.userId);
  const totalRounds    = isQuiz ? QUIZ_ROUNDS : SOCIAL_ROUNDS;

  const ageCounts: Record<string, number> = {};
  for (const p of room.participants) {
    if (p.ageGroup) ageCounts[p.ageGroup] = (ageCounts[p.ageGroup] ?? 0) + 1;
  }
  const majorityAgeGroup = (Object.entries(ageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as "CHILD" | "ADULT" | "WISE" | null;

  if (majorityAgeGroup) {
    await db.room.update({ where: { id: roomId }, data: { ageGroup: majorityAgeGroup } });
    await createAuditLog({
      action: "UPDATE",
      entityType: "ROOM",
      entityId: roomId,
      resource: `Room ${room.code}`,
      details: { majorityAgeGroup },
      newValue: JSON.stringify({ ageGroup: majorityAgeGroup }),
    });
  }

  // Sadece odaya özel değil, bu katılımcıların oynadığı TÜM oyunlardaki soruları dışla
  const previousRounds = await db.round.findMany({
    where: {
      game: {
        room: {
          participants: {
             some: { userId: { in: participantIds } }
          }
        }
      }
    },
    select: { questionId: true },
  });
  const usedIds = previousRounds.map((r) => r.questionId);

  // Ghost game'i temizle (varsa)
  if (existingGame) {
    await db.game.update({ where: { id: existingGame.id }, data: { status: "FINISHED" } });
    await createAuditLog({
      action: "UPDATE",
      entityType: "GAME",
      entityId: existingGame.id,
      resource: "Ghost Game Cleaned",
      details: { status: "FINISHED" },
      oldValue: JSON.stringify({ status: "ACTIVE" }),
      newValue: JSON.stringify({ status: "FINISHED" }),
    });
  }

  const { game, round, question } = await db.$transaction(async (tx) => {
    const newGame = await tx.game.create({
      data: { roomId, totalRounds, status: "ACTIVE" },
    });

    await createAuditLog({
      action: "START_GAME",
      entityType: "GAME",
      entityId: newGame.id,
      resource: `Game in Room ${room.code}`,
      details: { totalRounds, gameMode: room.gameMode },
      tx,
    });

    // İlk round için de kişiselleştirilmiş yaş grubunu bulalım
    const answererId = isQuiz || isExpose ? null : resolveSpotlight(1, participantIds);
    const answerer   = answererId ? room.participants.find((p) => p.userId === answererId) : null;
    const roundAgeGroup = isQuiz || isExpose ? majorityAgeGroup : (answerer?.ageGroup ?? majorityAgeGroup);

    const { round, question } = await createRound(newGame.id, 1, participantIds, usedIds, room.gameMode, roundAgeGroup, room.category, room.id, tx as any);
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
  gameMode:   "SOCIAL" | "QUIZ" | "EXPOSE",
  ageGroup?:  string | null,
  category?:  string | null,
  roomId?:    string | null,
  tx = db
) {
  const isSocial = gameMode === "SOCIAL";
  const isExpose = gameMode === "EXPOSE";
  const isQuiz   = gameMode === "QUIZ";
  const answererId = isSocial ? resolveSpotlight(number, participantIds) : null;
  
  // Eğer SOCIAL modundaysak, answerer'ın kendi yaş grubunu kullanalım (kişiselleştirme)
  let actualAgeGroup = ageGroup;
  if (isSocial && answererId) {
    const participant = await tx.roomParticipant.findFirst({
       where: {
         userId: answererId,
         room: { games: { some: { id: gameId } } }
       },
       select: { ageGroup: true }
    });
    if (participant?.ageGroup) actualAgeGroup = participant.ageGroup;
  }

  const question = await pickQuestion(usedQuestionIds, gameMode, actualAgeGroup, category, roomId, tx as any);

  const round = await (tx as any).round.create({
    data: { gameId, number, questionId: question.id, answererId, status: isExpose ? "GUESSING" : "ANSWERING" },
  });

  await createAuditLog({
    action: "CREATE",
    entityType: "ROUND",
    entityId: round.id,
    resource: `Round ${number} for Game ${gameId}`,
    details: { questionId: question.id, answererId },
    tx,
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
  const participants   = game.room.participants.filter(p => (p as any).role !== "SPECTATOR");
  const participantIds = participants.map((p) => p.userId);
  const isLastRound    = completedRoundNumber >= game.totalRounds;

  if (isLastRound) {
    await db.game.update({ where: { id: gameId }, data: { status: "FINISHED", finishedAt: new Date() } });
    await db.room.update({ where: { id: game.roomId }, data: { status: "FINISHED" } });

    await createAuditLog({
      action: "UPDATE",
      entityType: "GAME",
      entityId: gameId,
      resource: "Game Finished",
      details: { status: "FINISHED" },
    });

    await createAuditLog({
      action: "UPDATE",
      entityType: "ROOM",
      entityId: game.roomId,
      resource: "Room Closed",
      details: { status: "FINISHED" },
    });

    const allScores = await db.score.findMany({ where: { gameId } });
    const playerScores: Record<string, number> = {};
    for (const s of allScores) {
      playerScores[s.guesserId] = (playerScores[s.guesserId] ?? 0) + s.points;
    }

    await pusherServer.trigger(`game-${gameId}`, "game-finished", { gameId, playerScores });
    return { finished: true, playerScores };
  }

  const nextNumber = completedRoundNumber + 1;
  // Odadaki veya geçmişteki TÜM oyunların kullandığı soruları dışla
  const allRoomRounds = await db.round.findMany({
    where: {
      game: {
        room: {
          participants: {
             some: { userId: { in: participantIds } }
          }
        }
      }
    },
    select: { questionId: true },
  });
  const usedIds = allRoomRounds.map((r) => r.questionId);
  const { round, question } = await createRound(gameId, nextNumber, participantIds, usedIds, game.room.gameMode, game.room.ageGroup, game.room.category, game.roomId);

  return { finished: false, round };
}
