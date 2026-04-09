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
  Loader2,
  Users,
  Flame
} from "lucide-react";
import { useGameStore } from "@/store/game.store";
import { useGameState, useRoomState } from "@/hooks/useGameState";
import { GameHeader }           from "@/components/game/GameHeader";
import { QuestionCard }         from "@/components/game/QuestionCard";
import { AnswerInput }          from "@/components/game/AnswerInput";
import { GuessInput }           from "@/components/game/GuessInput";
import { MultipleChoiceInput }  from "@/components/game/MultipleChoiceInput";
import { FlashbackCard }        from "@/components/game/FlashbackCard";
import { sounds }               from "@/lib/sounds";
import { getThemeFromRoom } from "@/lib/logic/theme-mapper";
import { cn } from "@/lib/utils";

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router     = useRouter();

  const {
    gameId, state, question, myRole, answererId, gameMode,
    players, playerScores, lastRoundScore, lastQuizResults, lastPenalty,
    currentRound, totalRounds, activeRoundId,
    guessCount, totalGuessers, setTheme,
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
        const me    = store.players.find(p => p.id === data.id);
        
        if (me?.role === "SPECTATOR") {
          setMyRole("spectator");
        } else if (store.gameMode === "QUIZ") {
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
    
    const me = players.find(p => p.id === myUserId);
    if (me?.role === "SPECTATOR") {
      setMyRole("spectator");
    } else {
      setMyRole(answererId === myUserId ? "answerer" : "guesser");
    }
  }, [answererId, myUserId, setMyRole, isQuiz, players]);

  useGameState(gameId ?? "", myUserId ?? "");
  useRoomState(roomId);

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
          // Sync Theme
          setTheme(getThemeFromRoom(data.category, data.gameMode || "SOCIAL"));

          if (data.activeGameId !== gameId) {
            recoverGameState(data.activeGameId);
          }
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [roomId, router, gameId]);

  const recoverGameState = async (id: string) => {
    try {
      const res  = await fetch(`/api/games/${id}`);
      const data = await res.json();
      if (data.gameId) {
        useGameStore.getState().hydrate(data);
        // Sync Theme from room category if available
        if (data.room?.category) {
          setTheme(getThemeFromRoom(data.room.category, data.gameMode || "SOCIAL"));
        }
        if (myUserId) {
          const me = data.players.find((p: any) => p.id === myUserId);
          const role = me?.role === "SPECTATOR" ? "spectator" : (data.gameMode === "QUIZ" ? "guesser" : (data.answererId === myUserId ? "answerer" : "guesser"));
          useGameStore.getState().setMyRole(role);
        }
      }
    } catch (e) {
      console.error("Game recovery failed", e);
    }
  };

  const spotlightPlayer = players.find((p) => p.id === answererId);
  const isAnswerer      = myRole === "answerer";

  useEffect(() => {
    if (state === "ANSWERING") {
      sounds.newRound();
      sounds.ping(); // Ekstra bildirim sesi
    }
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
  }, [guessCount, totalGuessers, state, isAnswerer, activeRoundId]);

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

  return (
    <main className="min-h-dvh bg-black flex flex-col relative overflow-hidden p-4 sm:p-8">
      {/* Background Elements */}
      <div className="aurora-bg fixed inset-0 pointer-events-none opacity-40" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.1)_0%,transparent_50%)] pointer-events-none" />
      
      {/* Floating Reactions Layer */}
      <FloatingReactions />

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
                <span className={cn(p.avatarUrl ? "text-xl" : "text-sm font-black text-white")}>
                  {p.avatarUrl || (p.username ?? "?")[0].toUpperCase()}
                </span>
                {p.id === answererId && !isQuiz && (
                  <div className="absolute -top-1 -right-1 z-20">
                    <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  </div>
                )}
                {p.streak >= 2 && (
                  <div className="absolute -bottom-1 -left-1 z-20">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} 
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Flame size={16} className="text-orange-500 fill-orange-500" />
                    </motion.div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[48px]">
                  {p.username || "Anonim"}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[14px] font-black text-white drop-shadow-md">{playerScores[p.id] ?? 0}</span>
                  {p.streak >= 2 && (
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-tighter">x{p.streak}</span>
                  )}
                </div>
              </div>
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
                ODAK: <span className="text-white font-black">{isAnswerer ? "SENSİN" : `${spotlightPlayer?.avatarUrl || ""} ${spotlightPlayer?.username ?? "?"}`.trim().toUpperCase()}</span>
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
            answererAvatar={!isQuiz && !isAnswerer && state === "GUESSING" ? (spotlightPlayer?.avatarUrl ?? undefined) : undefined}
          />

          {/* Interaction Area */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {myRole === "spectator" ? (
                <motion.div 
                  key="spectator-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card-elevated p-8 flex flex-col items-center gap-4 text-center border-accent/20"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">İzleyici Modu</h4>
                    <p className="text-[12px] font-medium text-slate-400">
                      Oyun şu an dolu, ama her anı canlı izleyebilir ve emoji gönderebilirsin!
                    </p>
                  </div>
                </motion.div>
              ) : state === "ANSWERING" ? (
                <motion.div 
                  key="answering-area"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  {isQuiz ? (
                    question.options
                      ? <MultipleChoiceInput options={question.options} onSubmit={submitAnswer} gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                      : (
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit mx-auto mb-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serbest Yazım ✍️</span>
                           </div>
                           <AnswerInput onSubmit={submitAnswer} gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                        </div>
                      )
                  ) : (
                    isAnswerer
                      ? (question.options
                          ? <MultipleChoiceInput options={question.options} onSubmit={submitAnswer} allowFreeText gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                          : (
                            <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit mx-auto mb-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serbest Yazım ✍️</span>
                               </div>
                               <AnswerInput onSubmit={submitAnswer} gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                            </div>
                          )
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
              ) : !isQuiz && state === "GUESSING" ? (
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
                        <MultipleChoiceInput options={question.options} onSubmit={submitGuess} allowFreeText showReason gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                      ) : (
                        <GuessInput opponentName={spotlightPlayer?.username ?? "Arkadaşın"} onSubmit={submitGuess} gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
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
              ) : null}
            </AnimatePresence>
          </div>

          {/* Final Results Redirect (if state is END) */}
          {state === "END" && (
            <div className="flex flex-col items-center gap-4 py-12">
               <Loader2 className="animate-spin text-accent" size={32} />
               <p className="text-sm font-black text-white uppercase tracking-widest">Sonuçlar Hazırlanıyor...</p>
            </div>
          )}
        </div>

        {/* Reaction Toolbar */}
        <ReactionToolbar roomId={roomId} />
      </div>

      {/* Results Overlay (Social) */}
      <AnimatePresence>
        {!isQuiz && lastRoundScore && state === "ANSWERING" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 bottom-24 z-50 flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Önceki Round</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="glass-card-elevated p-5 border-blue-500/10">
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
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg shadow-inner">
                      {players.find(p => p.id === g.userId)?.avatarUrl || g.username?.[0].toUpperCase()}
                    </div>
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
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 glass-card-elevated p-6 border-accent/20"
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

            <div className="flex flex-col gap-2 max-h-[40dvh] overflow-y-auto">
              {lastQuizResults.results.map((r) => (
                <div key={r.userId} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  r.correct ? "bg-green-500/10 border-green-500/30" : "bg-white/[0.02] border-white/5 opacity-60"
                )}>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg shadow-inner">
                    {players.find(p => p.id === r.userId)?.avatarUrl || r.username?.[0].toUpperCase()}
                  </div>
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
      <AnimatePresence>
        {lastPenalty && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-24 right-4 z-[60] bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded-r-2xl max-w-[240px]"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="text-orange-500" size={16} />
              <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">🎭 Ceza Vakti!</span>
            </div>
            <p className="text-[14px] font-bold text-orange-200 leading-relaxed italic">&quot;{lastPenalty}&quot;</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer/Progress */}
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black to-transparent pointer-events-none">
        <div className="flex items-center justify-between opacity-30 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Clock size={12} />
            <span>Oyun Sürüyor</span>
          </div>
          <span>Mirros · {gameMode}</span>
        </div>
      </div>
    </main>
  );
}

function ReactionToolbar({ roomId }: { roomId: string }) {
  const emojis = ["🔥", "😂", "😮", "🤨", "👏", "💩"];
  const [sending, setSending] = useState<string | null>(null);

  const sendReaction = async (emoji: string) => {
    setSending(emoji);
    sounds.pop(); // Gönderme sesi
    try {
      await fetch(`/api/rooms/${roomId}/reactions`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ emoji }),
      });
    } catch {}
    setTimeout(() => setSending(null), 100);
  };

  return (
    <div className="flex justify-center gap-2 px-1">
      {emojis.map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          onClick={() => sendReaction(emoji)}
          className={cn(
            "w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-xl transition-all shadow-sm",
            sending === emoji ? "bg-accent/40 border-accent/60 scale-110" : ""
          )}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}

function FloatingReactions() {
  const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number; username: string }[]>([]);

  useEffect(() => {
    const handleReaction = (e: any) => {
      const { emoji, username } = e.detail;
      const id = Math.random().toString(36).substr(2, 9);
      const x = 20 + Math.random() * 60; // 20% to 80% width
      setReactions((prev) => [...prev, { id, emoji, x, username }]);
      
      sounds.reaction(); // Emoji gelme sesi

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    };

    window.addEventListener("mirros-reaction", handleReaction);
    return () => window.removeEventListener("mirros-reaction", handleReaction);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: "100dvh", opacity: 0, x: `${r.x}%` }}
            animate={{ y: "-10dvh", opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute flex flex-col items-center gap-1"
          >
            <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {r.emoji}
            </span>
            {r.username && (
              <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter whitespace-nowrap bg-black/20 px-1 rounded">
                {r.username}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
