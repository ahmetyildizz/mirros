import { db } from "@/lib/db";
import { pusherServer, safeTrigger } from "@/lib/pusher/server";
import { createAuditLog } from "@/lib/audit";
import { generateAndSaveQuestionsForRoom, refillGlobalPool } from "@/lib/services/ai.service";

// Havuzda bu sayının altına düşünce AI ile doldur
const LOW_WATER_MARK = 5;

const SOCIAL_ROUNDS = 10;
const QUIZ_ROUNDS   = 10;

async function pickQuestion(excludeIds: string[], gameMode: "SOCIAL" | "QUIZ" | "EXPOSE" | "BLUFF" | "SPY", ageGroup?: string | null, category?: string | null, roomId?: string | null, tx = db) {
  // Spice Level extraction (e.g., "Dedikodu Masası:Hot")
  let spiceLevel: "EASY" | "MEDIUM" | "HARD" | null = null;
  let baseCategory = category;

  if (category?.includes(":")) {
    const [cat, spice] = category.split(":");
    baseCategory = cat;
    if (spice === "Hot") spiceLevel = "MEDIUM";
    else if (spice === "Nuclear") spiceLevel = "HARD";
    else spiceLevel = "EASY";
  }

  // Tema/Lobi Modu eşleştirmesi
  const themeMap: Record<string, string[]> = {
    "Çift Gecesi": ["İlişki", "Duygu", "Kişilik", "Yaşam"],
    "Aile Toplantısı": ["Anılar", "Nostalji", "Yemek", "Yaşam", "Sosyal"],
    "Doğum Günü": ["Anılar", "Eğlence", "Kişilik", "Sosyal", "Nostalji"],
    "Takım Building": ["Yaşam", "Duygu", "Değerler", "Sosyal", "Kişilik", "Dijital"],
    "Dedikodu Masası": ["Eğlence", "Tehlike", "İhanet", "Para", "Kaos"],
    "Ofis Kaosu": ["Ofis Kaosu"],
  };

  // BLUFF ve SPY modları kendi özel sorularına veya QUIZ sorularına yönelebilir
  const effectiveMode: "SOCIAL" | "QUIZ" | "EXPOSE" | "SPY" = 
    gameMode === "BLUFF" ? "QUIZ" : gameMode;

  const targetCategories = baseCategory ? themeMap[baseCategory] : null;

  // 0. ÖNCELİKLİ: Varsa Odaya Özel Soru
  if (roomId) {
    const roomCandidates = await tx.question.findMany({
      where: {
        roomId,
        isActive: true,
        gameMode: effectiveMode,
        ...(spiceLevel ? { difficulty: spiceLevel } : {}),
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {})
      },
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
        gameMode: effectiveMode,
        category: { in: targetCategories },
        ...(spiceLevel ? { difficulty: spiceLevel } : {}),
        ...(effectiveMode === "EXPOSE" ? {} : { NOT: { options: { equals: [] } } }),
        ...(ageGroup ? {
          OR: [{ ageGroup: ageGroup as "CHILD" | "ADULT" | "WISE" }, { ageGroup: null }],
        } : {}),
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      select: { id: true },
    });
  }

  // 2. ADIM: Havuz boşsa (hiç şıklı soru yoksa veya bitmişse): Tüm Tema Soruları
  if (candidates.length === 0 && targetCategories) {
    candidates = await tx.question.findMany({
      where: {
        isActive: true,
        gameMode: effectiveMode,
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
        gameMode: effectiveMode,
        ...(spiceLevel ? { difficulty: spiceLevel } : {}),
        ...(ageGroup ? {
          OR: [{ ageGroup: ageGroup as "CHILD" | "ADULT" | "WISE" }, { ageGroup: null }],
        } : {}),
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      select: { id: true },
    });
  }

  // 4. ADIM: Son Çare: excludeIds kısıtını da kaldır (tüm havuz)
  if (candidates.length === 0) {
    candidates = await tx.question.findMany({
      where: { isActive: true, gameMode: effectiveMode },
      select: { id: true },
    });
  }

  if (candidates.length === 0) throw new Error("Soru havuzu gerçekten boş");

  // Havuz azaldığında daha agresif dolum: 30 soru üret (önceden 15'ti)
  if (candidates.length < LOW_WATER_MARK && baseCategory) {
    refillGlobalPool(effectiveMode, baseCategory, 30).catch((e) =>
      console.error("[AI] refillGlobalPool arka plan hatası:", e)
    );
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return tx.question.findUniqueOrThrow({ where: { id: pick.id } });
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
  
  // Sadece PLAYER olanları asıl katılımcı sayıyoruz
  const participants = room.participants.filter(p => (p as any).role !== "SPECTATOR");
  if (participants.length < 2) throw new Error("En az 2 ana oyuncu gerekli");
  if (room.status === "FINISHED") throw new Error("Oda kapandı");

  const isQuiz         = room.gameMode === "QUIZ";
  const isExpose       = room.gameMode === "EXPOSE";
  const isBluff        = room.gameMode === "BLUFF";
  const isSpy          = room.gameMode === "SPY";
  const participantIds = participants.map((p) => p.userId);
  const totalRounds    = (isQuiz || isSpy) ? QUIZ_ROUNDS : SOCIAL_ROUNDS;

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

  // ── AI: Oyuncu isimleriyle kişiselleştirilmiş sorular üret (arka planda, non-blocking) ──
  const playerNames = participants.map((p) => p.user.username ?? p.user.email ?? "Oyuncu");
  const baseSpiceLevel: "EASY" | "MEDIUM" | "HARD" =
    room.category?.includes(":Nuclear") ? "HARD"
    : room.category?.includes(":Hot") ? "MEDIUM"
    : "EASY";

  generateAndSaveQuestionsForRoom(
    roomId,
    room.gameMode,
    room.category,
    room.ageGroup,
    playerNames,
    baseSpiceLevel
  ).catch((e) => console.error("[AI] generateAndSaveQuestionsForRoom hatası:", e));

  // Son 30 gündeki oyunlarda bu katılımcıların gördüğü soruları dışla.
  // 30 günlük pencere: eski sorular havuza geri döner, havuz tükenmez.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const previousRounds = await db.round.findMany({
    where: {
      game: {
        startedAt: { gte: thirtyDaysAgo },
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

  const { game, round, question } = await db.$transaction(async (tx) => {
    // Transaction içinde atomik kontrol — race condition önlemi
    const existingGame = await tx.game.findFirst({
      where: { roomId, status: "ACTIVE" },
      include: { rounds: { take: 1 } },
    });

    if (existingGame) {
      if (existingGame.rounds.length > 0) {
        throw new Error("Oyun zaten başlatıldı");
      }
      // Ghost game'i temizle (varsa — round'u olmayan aktif oyun)
      await tx.game.update({ where: { id: existingGame.id }, data: { status: "FINISHED" } });
      await createAuditLog({
        action: "UPDATE",
        entityType: "GAME",
        entityId: existingGame.id,
        resource: "Ghost Game Cleaned",
        details: { status: "FINISHED" },
        oldValue: JSON.stringify({ status: "ACTIVE" }),
        newValue: JSON.stringify({ status: "FINISHED" }),
        tx,
      });
    }
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
    const answererId = isQuiz || isExpose || isBluff || isSpy ? null : resolveSpotlight(1, participantIds);
    const answerer   = answererId ? room.participants.find((p) => p.userId === answererId) : null;
    const roundAgeGroup = isQuiz || isExpose || isBluff ? majorityAgeGroup : (answerer?.ageGroup ?? majorityAgeGroup);

    const { round, question } = await createRound(newGame.id, 1, participantIds, usedIds, room.gameMode, roundAgeGroup, room.category, room.id, tx as any);
    return { game: newGame, round, question };
  });

  const players = room.participants.map((p) => ({
    id:       p.userId,
    username: p.user.username ?? p.user.email,
  }));

  await safeTrigger(`room-${roomId}`, "game-started", {
    gameId:           game.id,
    gameMode:         room.gameMode,
    ageGroup:         room.ageGroup,
    roundId:          round.id,
    roundNumber:      1,
    totalRounds,
    questionId:       question.id,
    questionText:     room.gameMode === "SPY" ? null : question.text,
    questionCategory: question.category,
    questionOptions:  question.options ?? null,
    answererId:       round.answererId ?? null,
    players,
  });

  return { game, round };
}

  roomId?:    string | null,
  tx = db
) {
  const isSocial = gameMode === "SOCIAL";
  const isExpose = gameMode === "EXPOSE";
  const isQuiz   = gameMode === "QUIZ";
  const isBluff  = gameMode === "BLUFF";
  const isSpy    = gameMode === "SPY";
  const answererId = isSocial ? resolveSpotlight(number, participantIds) : null;
  
  // SPY modunda rastgele bir casus seç
  const spyId = isSpy ? participantIds[Math.floor(Math.random() * participantIds.length)] : null;
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

  // EXPOSE ve QUIZ modunda herkes oylama/tahmin ile başlar, bekleme (ANSWERING) yoktur.
  // SPY modunda herkes "ipucu" yazar, yani ANSWERING ile başlar.
  const initialStatus = (isExpose || isQuiz) ? "GUESSING" : "ANSWERING";

  const round = await (tx as any).round.create({
    data: { 
      gameId, 
      number, 
      questionId: question.id, 
      answererId, 
      status: initialStatus,
      spyId: spyId,
      metadata: isSpy ? {
        spySubject: question.correct,
        citizenSubject: question.text
      } : null
    },
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

    // Streak güncelle: bugün oynayan oyuncuların streak'ini artır (batch — N*2 sorgu yerine 1+N)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const users = await db.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, streak: true, longestStreak: true, lastPlayedAt: true },
    });

    await db.$transaction(
      users
        .filter((user) => {
          const lastPlayed = user.lastPlayedAt ? new Date(user.lastPlayedAt) : null;
          if (lastPlayed) lastPlayed.setHours(0, 0, 0, 0);
          return lastPlayed?.getTime() !== today.getTime(); // bugün zaten oynamamış
        })
        .map((user) => {
          const lastPlayed = user.lastPlayedAt ? new Date(user.lastPlayedAt) : null;
          if (lastPlayed) lastPlayed.setHours(0, 0, 0, 0);
          const playedYesterday = lastPlayed?.getTime() === yesterday.getTime();
          const newStreak       = playedYesterday ? user.streak + 1 : 1;
          const longestStreak   = Math.max(user.longestStreak, newStreak);
          return db.user.update({
            where: { id: user.id },
            data:  { streak: newStreak, longestStreak, lastPlayedAt: new Date() },
          });
        })
    );

    await safeTrigger(`game-${gameId}`, "game-finished", { gameId, playerScores });
    return { finished: true, playerScores };
  }

  const nextNumber = completedRoundNumber + 1;
  // Son 30 gündeki oyunlarda bu katılımcıların gördüğü soruları dışla.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const allRoomRounds = await db.round.findMany({
    where: {
      game: {
        startedAt: { gte: thirtyDaysAgo },
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
