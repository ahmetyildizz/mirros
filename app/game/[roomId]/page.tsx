"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Trophy, 
  User as UserIcon, 
  Clock, 
  Brain, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Loader2
} from "lucide-react";
import { useGameStore } from "@/store/game.store";
import { useGameState } from "@/hooks/useGameState";
import { GameHeader }           from "@/components/game/GameHeader";
import { QuestionCard }         from "@/components/game/QuestionCard";
import { AnswerInput }          from "@/components/game/AnswerInput";
import { GuessInput }           from "@/components/game/GuessInput";
import { MultipleChoiceInput }  from "@/components/game/MultipleChoiceInput";
import { FlashbackCard }        from "@/components/game/FlashbackCard";
import { sounds }               from "@/lib/sounds";
import { cn } from "@/lib/utils";

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router     = useRouter();

  const {
    gameId, state, question, myRole, answererId, gameMode,
    players, playerScores, lastRoundScore, lastQuizResults, lastPenalty,
    currentRound, totalRounds, activeRoundId,
    guessCount, totalGuessers,
    setGameState, setMyRole, setAnswererId,
  } = useGameStore();
  const isQuiz = gameMode === "QUIZ";

  const [myUserId, setMyUserId]   = useState<string | null>(null);
  const [pastAnswers, setPastAnswers] = useState<any[]>([]);

  const scoringRoundRef  = useRef<string | null>(null);
  const advancingRoundRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setMyUserId(data.id);
        const store = useGameStore.getState();
        if (store.gameMode === "QUIZ") {
          setMyRole("guesser");
        } else {
          setMyRole(store.answererId === data.id ? "answerer" : "guesser");
        }
      })
      .catch(() => {});
  }, [setMyRole]);

  useEffect(() => {
    if (isQuiz) return;
    if (!myUserId || !answererId) return;
    setMyRole(answererId === myUserId ? "answerer" : "guesser");
  }, [answererId, myUserId, setMyRole, isQuiz]);

  useGameState(gameId ?? "", myUserId ?? "");

  // Flashback/Hafıza sorgulama
  useEffect(() => {
    if (!isQuiz && state === "GUESSING" && myRole === "guesser" && answererId && question?.id) {
       fetch(`/api/rounds/flashback?userId=${answererId}&questionId=${question.id}&currentRoundId=${activeRoundId}`)
         .then(r => r.json())
         .then(data => {
           if (data.pastAnswers) setPastAnswers(data.pastAnswers);
         })
         .catch(() => {});
    } else if (state !== "GUESSING") {
      setPastAnswers([]);
    }
  }, [state, myRole, answererId, question?.id, isQuiz, activeRoundId]);

  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.activeGameId) {
          if (data.activeGameId !== gameId) {
            recoverGameState(data.activeGameId);
          } else if (gameId) {
            recoverGameState(gameId);
          }
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [roomId, router]);

  const recoverGameState = async (id: string) => {
    try {
      const res  = await fetch(`/api/games/${id}`);
      const data = await res.json();
      if (data.gameId) {
        useGameStore.getState().hydrate(data);
        if (myUserId) {
          const role = data.gameMode === "QUIZ" ? "guesser" : (data.answererId === myUserId ? "answerer" : "guesser");
          useGameStore.getState().setMyRole(role);
        }
      }
    } catch (e) {
      console.error("Game recovery failed", e);
    }
  };

  useEffect(() => {
    if (state === "ANSWERING") sounds.newRound();
    if (state === "GUESSING")  sounds.tick();
  }, [state]);

  useEffect(() => {
    if (state !== "GUESSING" || !isAnswerer) return;
    if (guessCount > 0 && guessCount >= totalGuessers) {
      if (activeRoundId && scoringRoundRef.current !== activeRoundId) {
        scoringRoundRef.current = activeRoundId;
        triggerScore();
      }
    }
  }, [guessCount, totalGuessers]);

  useEffect(() => {
    if (state !== "SCORING") return;
    
    let isSuccess = false;
    if (isQuiz && lastQuizResults) {
      isSuccess = lastQuizResults.results.some((r) => r.correct);
    } else if (!isQuiz && lastRoundScore) {
      isSuccess = lastRoundScore.guessResults.some((g) => g.points >= 5);
    }

    if (isSuccess) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#F43F5E', '#06B6D4']
      });
      sounds.exact();
    } else {
      sounds.wrong();
    }
  }, [state, lastQuizResults, lastRoundScore, isQuiz]);

  useEffect(() => {
    if (state === "ANSWERING" && lastRoundScore) {
      const timer = setTimeout(() => {
        useGameStore.getState().setLastRoundScore(null);
        useGameStore.getState().setLastPenalty(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [state, lastRoundScore]);

  if (!gameId || !question) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-black">
        <Loader2 className="animate-spin text-accent mb-4" size={32} />
        <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Mirros Yükleniyor...</p>
      </main>
    );
  }

  const spotlightPlayer = players.find((p) => p.id === answererId);
  const isAnswerer      = myRole === "answerer";

  async function submitAnswer(content: string) {
    if (!activeRoundId) return;
    await fetch(`/api/rounds/${activeRoundId}/answer`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async function submitGuess(content: string, reason?: string) {
    if (!activeRoundId) return;
    await fetch(`/api/rounds/${activeRoundId}/guess`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, reason }),
    });
  }

  async function triggerScore() {
    if (!activeRoundId) return;
    await fetch(`/api/rounds/${activeRoundId}/score`, { method: "POST" });
  }

  async function advanceToNext() {
    if (!activeRoundId) return;
    if (advancingRoundRef.current === activeRoundId) return;
    advancingRoundRef.current = activeRoundId;
    await fetch(`/api/rounds/${activeRoundId}/next`, { method: "POST" });
  }

  return (
    <main className="relative min-h-dvh flex flex-col bg-black overflow-x-hidden">
      {/* Aurora Background 2.0 (Subtle for game) */}
      <div className="aurora-bg fixed inset-0 pointer-events-none opacity-30" aria-hidden>
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
      </div>

      <div className="relative z-10 flex flex-col w-full max-w-[480px] mx-auto px-4 py-6 gap-6 h-full min-h-dvh">
        <GameHeader roundNumber={currentRound} totalRounds={totalRounds} />

        {/* Scoring Bar */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none px-1">
          {players.map((p, i) => (
            <motion.div 
              key={p.id} 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-2 min-w-[50px] group"
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                p.id === answererId 
                  ? "bg-accent/20 border-accent shadow-[0_0_15px_var(--accent-glow)] scale-110" 
                  : "bg-white/[0.03] border-white/5"
              )}>
                <span className="text-sm font-black text-white">{(p.username ?? "?")[0].toUpperCase()}</span>
                {p.id === answererId && !isQuiz && (
                  <div className="absolute -top-1 -right-1">
                    <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  </div>
                )}
              </div>
              <span className="text-[14px] font-black text-white drop-shadow-md">{playerScores[p.id] ?? 0}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-6 flex-1">
          {/* Spotlight indicator */}
          {!isQuiz && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl w-fit"
            >
              <Sparkles className="text-accent" size={14} />
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                ODAK: <span className="text-white font-black">{isAnswerer ? "SENSİN" : (spotlightPlayer?.username ?? "?").toUpperCase()}</span>
              </p>
            </motion.div>
          )}

          {/* Question Section */}
          <QuestionCard
            key={activeRoundId}
            text={question.text}
            category={question.category}
            roundNumber={currentRound}
            answererName={!isQuiz && !isAnswerer && state === "GUESSING" ? (spotlightPlayer?.username ?? undefined) : undefined}
          />

          {/* Interaction Area */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {state === "ANSWERING" && (
                <motion.div 
                  key="answering-area"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  {isQuiz ? (
                    question.options
                      ? <MultipleChoiceInput options={question.options} onSubmit={submitAnswer} />
                      : <AnswerInput onSubmit={submitAnswer} />
                  ) : (
                    isAnswerer
                      ? (question.options
                          ? <MultipleChoiceInput options={question.options} onSubmit={submitAnswer} allowFreeText />
                          : <AnswerInput onSubmit={submitAnswer} />
                        )
                      : (
                        <div className="glass-card-elevated p-8 flex flex-col items-center gap-4 text-center">
                          <div className="relative">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-2 border-dashed border-accent/30" />
                            <UserIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" size={20} />
                          </div>
                          <p className="text-[13px] font-medium text-slate-300 leading-relaxed">
                            <span className="text-white font-black">{spotlightPlayer?.username ?? "Arkadaşın"}</span> şu an cevap veriyor...
                          </p>
                        </div>
                      )
                  )}
                </motion.div>
              )}

              {!isQuiz && state === "GUESSING" && (
                <motion.div 
                  key="guessing-area"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  {isAnswerer ? (
                    <div className="glass-card-elevated p-8 flex flex-col items-center gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[11px] font-black text-slate-500 tracking-[0.2em] uppercase">Tahminler Bekleniyor</p>
                        <div className="flex gap-2">
                          {Array.from({ length: totalGuessers }).map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={i < guessCount ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                              className={cn(
                                "w-3 h-3 rounded-full transition-colors duration-500",
                                i < guessCount ? "bg-accent shadow-[0_0_10px_var(--accent)]" : "bg-white/10"
                              )} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[15px] font-bold text-white tracking-tight">
                        {guessCount} / {totalGuessers} arkadaşın tahmin etti
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {question.options ? (
                        <MultipleChoiceInput options={question.options} onSubmit={submitGuess} allowFreeText showReason />
                      ) : (
                        <GuessInput opponentName={spotlightPlayer?.username ?? "Arkadaşın"} onSubmit={submitGuess} />
                      )}

                      {/* Flashback/Hafıza Kartı */}
                      <AnimatePresence>
                        {pastAnswers.length > 0 && (
                          <FlashbackCard 
                            username={spotlightPlayer?.username ?? "Arkadaşın"} 
                            pastAnswers={pastAnswers} 
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Overlay (Social) */}
          <AnimatePresence>
            {!isQuiz && lastRoundScore && state === "ANSWERING" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Önceki Round</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="glass-card p-5 border-blue-500/10">
                  <div className="flex flex-col gap-1 mb-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gerçek Cevap</span>
                    <p className="text-xl font-black text-cyan-400 drop-shadow-sm">{lastRoundScore.answer}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {lastRoundScore.guessResults.map((g) => (
                      <div key={g.userId} className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                        g.matchLevel === "EXACT" ? "bg-green-500/10 border-green-500/30" : g.matchLevel === "CLOSE" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-white/[0.02] border-white/5"
                      )}>
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs uppercase">{g.username?.[0]}</div>
                        <div className="flex-1 flex flex-col">
                          <span className="text-[11px] font-bold text-slate-400">{g.username}</span>
                          <span className="text-[13px] font-bold text-white">{g.guess}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap size={10} className={cn(g.points > 0 ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
                          <span className="text-[15px] font-black text-white">+{g.points}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quiz Scoring Box */}
            {isQuiz && state === "SCORING" && lastQuizResults && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card-elevated p-6 border-accent/20"
              >
                <div className="flex flex-col items-center gap-4 text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)]">
                    <Trophy className="text-white" size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">Doğru Cevap</span>
                    <h4 className="text-2xl font-black text-white">{lastQuizResults.correctAnswer}</h4>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {lastQuizResults.results.map((r) => (
                    <div key={r.userId} className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border",
                      r.correct ? "bg-green-500/10 border-green-500/30" : "bg-white/[0.02] border-white/5 opacity-60"
                    )}>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs">{r.username?.[0]}</div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{r.username}</p>
                        <p className="text-[14px] font-black text-white tracking-tight">{r.answer}</p>
                      </div>
                      {r.correct && <CheckCircle2 size={16} className="text-green-500" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Penalties */}
          {lastPenalty && (
             <motion.div 
               initial={{ x: 300, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               className="bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded-r-2xl"
             >
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="text-orange-500" size={16} />
                  <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">🎭 Ceza Vakti!</span>
                </div>
                <p className="text-[14px] font-bold text-orange-200 leading-relaxed italic">&quot;{lastPenalty}&quot;</p>
             </motion.div>
          )}
        </div>

        {/* Footer/Progress */}
        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center justify-between opacity-30 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>Oyun Sürüyor</span>
            </div>
            <span>Mirros · {gameMode}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
