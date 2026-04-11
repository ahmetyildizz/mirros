import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { ResultsClient } from "@/components/results/ResultsClient";
import { generateAIInsight } from "@/lib/logic/ai-analysis";
import { getThemeFromRoom } from "@/lib/logic/theme-mapper";

function familiarityEmoji(f: number) {
  if (f >= 90) return "🔥";
  if (f >= 70) return "💜";
  if (f >= 50) return "✨";
  if (f >= 30) return "🌱";
  return "🌙";
}

function familiarityText(f: number) {
  if (f >= 90) return "İkiniz neredeyse aynı zihin yapısına sahipsiniz!";
  if (f >= 70) return "Birbirinizi gerçekten iyi tanıyorsunuz.";
  if (f >= 50) return "Birbirinizi oldukça iyi tanıyorsunuz.";
  if (f >= 30) return "Birbirinizi tanımak için güzel bir başlangıç!";
  return "Birbirinizi keşfetmek için harika bir yolculuk başlıyor.";
}

export default async function ResultsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { id: myId } = await requireAuth();
  const { gameId }   = await params;

  const game = await db.game.findUnique({
    where:   { id: gameId },
    include: {
      scores: { orderBy: { points: "desc" } },
      rounds: {
        orderBy: { number: "asc" },
        include: {
          question: true,
          answers:  { include: { user: { select: { id: true, username: true } } } },
          guesses:  { include: { user: { select: { id: true, username: true } } } },
          scores:   { include: { guesser: { select: { id: true, username: true } } } },
        },
      },
      room: {
        include: {
          participants: {
            orderBy: { joinedAt: "asc" },
            include: { user: { select: { id: true, username: true } } },
          },
        },
      },
    },
  });

  if (!game) notFound();

  // Leaderboard
  const playerTotals: Record<string, { username: string; points: number; isMe: boolean }> = {};
  for (const p of game.room.participants) {
    playerTotals[p.userId] = {
      username: p.user.username ?? "Gizemli Oyuncu",
      points:   0,
      isMe:     p.userId === myId,
    };
  }
  for (const s of game.scores) {
    if (playerTotals[s.guesserId]) {
      playerTotals[s.guesserId].points += s.points;
    }
  }
  const leaderboard = Object.entries(playerTotals)
    .sort((a, b) => b[1].points - a[1].points)
    .map(([uid, data]) => ({ userId: uid, ...data }));

  const maxPoints  = game.totalRounds * 10;
  const topPoints  = leaderboard[0]?.points ?? 0;
  const familiarity = Math.round((topPoints / maxPoints) * 100);

  // Compatibility calculation
  const compatMap: Record<string, { username: string; pct: number; totalPoints: number; maxPossible: number; guessers: Record<string, { name: string; points: number }> }> = {};
  
  if (game.room.gameMode === "SOCIAL") {
    for (const round of game.rounds) {
      if (!round.answererId) continue;
      const aId = round.answererId;
      
      if (!compatMap[aId]) {
        const p = game.room.participants.find(x => x.userId === aId);
        compatMap[aId] = { 
          username: p?.user.username ?? "Gizemli", 
          pct: 0, 
          totalPoints: 0, 
          maxPossible: 0, 
          guessers: {} 
        };
      }

      for (const sc of round.scores) {
        compatMap[aId].totalPoints += sc.points;
        compatMap[aId].maxPossible += 10;
        
        const gId = sc.guesserId;
        if (!compatMap[aId].guessers[gId]) {
          compatMap[aId].guessers[gId] = { name: sc.guesser.username ?? "Anonim", points: 0 };
        }
        compatMap[aId].guessers[gId].points += sc.points;
      }
    }
  }

  const finalCompatMap: Record<string, { username: string; pct: number; bestGuesser?: { name: string; points: number }; title?: string }> = {};
  
  // Memory logic (Needs to be evaluated before titles)
  const currentQuestionIds = game.rounds.map((r) => r.questionId);
  const previousAnswers = await db.answer.findMany({
    where: {
      userId: myId,
      round: {
        questionId: { in: currentQuestionIds },
        game: { startedAt: { lt: game.startedAt }, room: { gameMode: "SOCIAL" } },
      },
    },
    select: { round: { select: { questionId: true } }, content: true, submittedAt: true },
    orderBy: { submittedAt: "desc" },
  });
  const pastAnswerMap = new Map<string, { content: string; at: Date }>();
  for (const a of previousAnswers) {
    if (!pastAnswerMap.has(a.round.questionId)) {
      pastAnswerMap.set(a.round.questionId, { content: a.content, at: a.submittedAt });
    }
  }

  // Calculate Stats and Titles for ALL players
  const playerStats: Record<string, { exactCount: number; closeCount: number; reasonCount: number; totalRounds: number }> = {};
  for (const p of game.room.participants) playerStats[p.userId] = { exactCount: 0, closeCount: 0, reasonCount: 0, totalRounds: game.rounds.length };
  
  for (const round of game.rounds) {
    for (const sc of round.scores) {
      if (playerStats[sc.guesserId]) {
        if (sc.matchLevel === "EXACT") playerStats[sc.guesserId].exactCount++;
        if (sc.matchLevel === "CLOSE") playerStats[sc.guesserId].closeCount++;
      }
    }
    for (const g of round.guesses) {
      if (g.reason && playerStats[g.userId]) playerStats[g.userId].reasonCount++;
    }
  }

  for (const p of game.room.participants) {
    const uid = p.userId;
    const stats = playerStats[uid];
    const data = compatMap[uid] || { username: p.user.username ?? "?", pct: 0, totalPoints: 0, maxPossible: 0, guessers: {} };
    const sortedGuessers = Object.values(data.guessers).sort((a, b) => b.points - a.points);
    
    // Advanced Title Logic
    let title = "Oda Sakini";
    const isMe = uid === myId;
    
    // Yürüyen Hafıza: Kendi geçmiş cevabıyla %100 aynı cevap veren (En az 1 kere)
    const hasPerfectMemory = game.rounds.some(r => {
      const past = pastAnswerMap.get(r.questionId);
      const current = r.answers.find(a => a.userId === uid)?.content;
      return past && current && past.content.trim().toLowerCase() === current.trim().toLowerCase();
    });

    if (stats.exactCount >= 3) title = "Zihin Okuyucu";
    else if (hasPerfectMemory && isMe) title = "Yürüyen Hafıza";
    else if (stats.exactCount === 0 && data.pct > 70) title = "Uyumlu";
    else if (stats.reasonCount >= 3) title = "Kaos Mimarı";
    else if (stats.closeCount >= 3) title = "Empati Şampiyonu";
    else if (stats.exactCount === 0 && data.totalPoints < 10 && data.maxPossible > 20) title = "Kapalı Kutu";
    else if (data.pct > 85) title = "Açık Kitap";

    finalCompatMap[uid] = {
      username: data.username,
      pct: data.maxPossible > 0 ? Math.round((data.totalPoints / data.maxPossible) * 100) : 0,
      bestGuesser: sortedGuessers[0],
      title
    };
  }

  // Telemetry AI data preparation
  const unpredictableUserId = Object.entries(compatMap).sort((a, b) => a[1].pct - b[1].pct)[0]?.[0];
  const mostIntuitiveUserId = Object.entries(playerStats).sort((a, b) => b[1].exactCount - a[1].exactCount)[0]?.[0];
  const wrongRate = game.rounds.reduce((acc, r) => acc + r.scores.filter(s => s.matchLevel === "WRONG").length, 0) / (game.rounds.length * game.room.participants.length || 1);

  // Prepare detailed round data for AI
  const roundsDataForAI = game.rounds.map(r => ({
    question: r.question.text,
    answerer: game.room.participants.find(p => p.userId === r.answererId)?.user.username ?? "Anonim",
    answer: r.answers[0]?.content ?? "Cevapsız",
    guesses: r.scores.map(sc => ({
      guesser: sc.guesser.username ?? "Anonim",
      content: r.guesses.find(g => g.userId === sc.guesserId)?.content ?? "Tahmin yok",
      points: sc.points
    }))
  }));

  const aiReport = await generateAIInsight({
    familiarity,
    gameMode: game.room.gameMode || "SOCIAL",
    category: game.room.category || "Genel",
    topPlayerName: leaderboard[0]?.username || "Anonim",
    unpredictableName: game.room.participants.find(p => p.userId === unpredictableUserId)?.user.username || "Gizemli",
    mostIntuitiveName: game.room.participants.find(p => p.userId === mostIntuitiveUserId)?.user.username || "Zihin Okuyucu",
    chaoticLevel: wrongRate > 0.5 ? "HIGH" : wrongRate > 0.2 ? "MEDIUM" : "LOW",
    rounds: roundsDataForAI
  });

  // Funniest Moment
  const funniestRound = game.rounds.reduce<typeof game.rounds[0] | null>((best, r) => {
    const wrongCount  = r.scores.filter((sc) => sc.matchLevel === "WRONG").length;
    const reasonCount = r.guesses.filter((g) => !!g.reason).length;
    let score = wrongCount * 10 + reasonCount * 25;
    const bestScore = best ? (best.scores.filter(s => s.matchLevel === "WRONG").length * 10 + best.guesses.filter(g => !!g.reason).length * 25) : -1;
    return score > bestScore ? r : best;
  }, null);

  // Map Rounds to Client Props
  const roundsData = game.rounds.map(r => ({
    id: r.id,
    number: r.number,
    question: { text: r.question.text },
    answererName: game.room.participants.find(p => p.userId === r.answererId)?.user.username ?? "?",
    answerContent: r.answers[0]?.content ?? null,
    pastAnswer: pastAnswerMap.get(r.questionId),
    scores: r.scores.map(sc => ({
      id: sc.id,
      guesserName: sc.guesser.username ?? "?",
      guessContent: r.guesses.find(g => g.userId === sc.guesserId)?.content ?? null,
      matchLevel: sc.matchLevel,
      points: sc.points
    }))
  }));

  return (
    <main className="min-h-dvh bg-black flex flex-col relative overflow-x-hidden pt-safe pb-safe px-6 sm:px-12">
      {/* Background */}
      <div className="aurora-bg fixed inset-0 pointer-events-none opacity-40" />

      <div className="relative z-10 w-full max-w-[480px] mx-auto">
        <ResultsClient 
          gameId={gameId}
          leaderboard={leaderboard}
          familiarity={familiarity}
          familiarityText={familiarityText(familiarity)}
          familiarityEmoji={familiarityEmoji(familiarity)}
          rounds={roundsData}
          funniestRound={funniestRound ? { 
            question: funniestRound.question.text, 
            answer: funniestRound.answers[0]?.content ?? "",
            reason: funniestRound.guesses.find(g => !!g.reason)?.reason ?? null,
            username: funniestRound.guesses.find(g => !!g.reason)?.user.username ?? null
          } : null}
          compatMap={finalCompatMap}
          aiReport={aiReport}
          roomCategory={game.room.category}
          gameMode={game.room.gameMode}
        />
      </div>
    </main>
  );
}
