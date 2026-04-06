import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { ResultsClient } from "@/components/results/ResultsClient";

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

  // Finalize compatMap for component
  const finalCompatMap: Record<string, { username: string; pct: number; bestGuesser?: { name: string; points: number } }> = {};
  for (const [uid, data] of Object.entries(compatMap)) {
    const sortedGuessers = Object.values(data.guessers).sort((a, b) => b.points - a.points);
    finalCompatMap[uid] = {
      username: data.username,
      pct: data.maxPossible > 0 ? Math.round((data.totalPoints / data.maxPossible) * 100) : 0,
      bestGuesser: sortedGuessers[0]
    };
  }

  // Memory logic
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
    <main className="min-h-dvh bg-black flex flex-col relative overflow-x-hidden p-6 sm:p-12">
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
          funniestRound={funniestRound ? { question: funniestRound.question.text, answer: funniestRound.answers[0]?.content ?? "" } : null}
          compatMap={finalCompatMap}
        />
      </div>
    </main>
  );
}
