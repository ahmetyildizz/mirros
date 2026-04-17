"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TvDisplay } from "@/components/game/TvDisplay";
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
  Flame,
  ArrowRight,
  MessageSquareText
} from "lucide-react";
import { useGameStore } from "@/store/game.store";
import { useGameState, useRoomState } from "@/hooks/useGameState";
import { GameHeader }           from "@/components/game/GameHeader";
import { QuestionCard }         from "@/components/game/QuestionCard";
import { AnswerInput }          from "@/components/game/AnswerInput";
import { GuessInput }           from "@/components/game/GuessInput";
import { MultipleChoiceInput }  from "@/components/game/MultipleChoiceInput";
import { GoogleAd }             from "@/components/ads/GoogleAd";
import { FlashbackCard }        from "@/components/game/FlashbackCard";
import { sounds }               from "@/lib/sounds";
import { getThemeFromRoom } from "@/lib/logic/theme-mapper";
import { cn } from "@/lib/utils";

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isTv         = searchParams.get("display") === "tv";

  if (isTv) return <TvDisplay roomId={roomId} />;

  const {
    gameId, state, question, myRole, answererId, gameMode,
    players, playerScores, lastRoundScore, lastQuizResults, lastPenalty,
    currentRound, totalRounds, activeRoundId,
    guessCount, totalGuessers, setTheme, nextRoundData,
    bluffOptions, bluffAnswers, isHostPlayer,
    setGameState, setMyRole, setAnswererId, setIsHostPlayer,
  } = useGameStore();
  const isQuiz   = gameMode === "QUIZ";
  const isExpose = gameMode === "EXPOSE";
  const isBluff  = gameMode === "BLUFF";

  const [myUserId, setMyUserId]   = useState<string | null>(null);
  const [pastAnswers, setPastAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);

  const scoringRoundRef     = useRef<string | null>(null);
  const advancingRoundRef   = useRef<string | null>(null);
  const hasAutoSubmitted    = useRef(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setMyUserId(data.id);
        const store = useGameStore.getState();
        const me    = store.players.find(p => p.id === data.id);

        if (me?.role === "SPECTATOR") {
          setMyRole("spectator");
        } else if (store.gameMode === "QUIZ" || store.gameMode === "EXPOSE") {
          setMyRole("guesser");
        } else {
          setMyRole(store.answererId === data.id ? "answerer" : "guesser");
        }

        // isHostPlayer: /api/rooms ile doğrula — localStorage ya da lobby
        // akışından gelen değer yanlış olabilir (yenileme, farklı cihaz).
        fetch(`/api/rooms/${roomId}`)
          .then(r => r.json())
          .then(room => {
            if (room.hostId) setIsHostPlayer(room.hostId === data.id);
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [setMyRole, roomId, setIsHostPlayer]);

  useEffect(() => {
    if (isQuiz || isExpose) return;
    if (!myUserId || !answererId) return;
    
    const me = players.find(p => p.id === myUserId);
    if (me?.role === "SPECTATOR") {
      setMyRole("spectator");
    } else {
      setMyRole(answererId === myUserId ? "answerer" : "guesser");
    }
  }, [answererId, myUserId, setMyRole, isQuiz, isExpose, players]);

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
          const role = me?.role === "SPECTATOR" ? "spectator" : (data.gameMode === "QUIZ" || data.gameMode === "EXPOSE" ? "guesser" : (data.answererId === myUserId ? "answerer" : "guesser"));
          useGameStore.getState().setMyRole(role);
          if (data.hostId) useGameStore.getState().setIsHostPlayer(data.hostId === myUserId);
        }

        // AGGRESSIVE SYNC: Eğer EXPOSE/QUIZ modundaysak ve state ANSWERING olarak gelmişse (race condition), GUESSING'e zorla
        if ((data.gameMode === "EXPOSE" || data.gameMode === "QUIZ" || !data.answererId) && data.state === "ANSWERING") {
          console.log("Auto-correcting state to GUESSING for non-answering mode");
          useGameStore.getState().setGameState("GUESSING");
        }
      }
    } catch (e) {
      console.error("Game recovery failed", e);
    }
  };

  const spotlightPlayer = players.find((p) => p.id === answererId);
  const isAnswerer      = myRole === "answerer";

  // Global Flow Guard: Eğer her şeyin sonunda hala state ANSWERING ise ama answererId yoksa, bu bir EXPOSE/QUIZ tuluğudur.
  // Otomatik olarak GUESSING'e zorla.
  useEffect(() => {
    if (state === "ANSWERING" && !isQuiz && !answererId && gameId) {
      console.log("Global Flow Guard: Auto-correcting state to GUESSING (null answerer detected)");
      useGameStore.getState().setGameState("GUESSING");
    }
  }, [state, answererId, isQuiz, gameId]);

  // Timer: say down every second while active
  useEffect(() => {
    if (state !== "ANSWERING" && state !== "GUESSING") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [state, activeRoundId]);

  // Reset timer + auto-submit guard on new round/state
  useEffect(() => {
    if (state === "ANSWERING" || state === "GUESSING") {
      setTimeLeft(60);
      hasAutoSubmitted.current = false;
    }
  }, [state, activeRoundId]);

  // Auto-submit / skip when time runs out
  useEffect(() => {
    if (timeLeft !== 0 || hasAutoSubmitted.current) return;
    hasAutoSubmitted.current = true;

    if (state === "ANSWERING") {
      // Answerer kendi cevabını gönderir (server 403 verirse susar)
      if (isAnswerer || isQuiz) submitAnswer("...").catch(() => {});
      // Host bağımsız olarak skip atar — server race condition'ı 409 ile reddeder, sorun olmaz
      if (isHostPlayer) skipRound().catch(() => {});
    } else if (state === "GUESSING") {
      // Önce score dene (tahminleri değerlendir), başarısız olursa skip
      if (isHostPlayer || isAnswerer) {
        triggerScore().catch(() => skipRound().catch(() => {}));
      }
    }
  }, [timeLeft, state, isAnswerer, isHostPlayer, isQuiz]);

  // Warning sound at 10 seconds
  useEffect(() => {
    if (timeLeft === 10 && (state === "ANSWERING" || state === "GUESSING")) {
      sounds.ping();
    }
  }, [timeLeft, state]);

  useEffect(() => {
    if (state === "ANSWERING") {
      sounds.newRound();
      sounds.ping(); // Ekstra bildirim sesi
    }
    if (state === "GUESSING")  sounds.tick();
  }, [state]);

  useEffect(() => {
    if (state !== "GUESSING") return;
    const { isHostPlayer } = useGameStore.getState();
    const canTrigger = isAnswerer || ((isQuiz || isExpose) && isHostPlayer);
    
    if (!canTrigger) return;

    if (guessCount > 0 && guessCount >= totalGuessers) {
      if (activeRoundId && scoringRoundRef.current !== activeRoundId) {
        scoringRoundRef.current = activeRoundId;
        triggerScore();
      }
    }
  }, [guessCount, totalGuessers, state, isAnswerer, isQuiz, isExpose, activeRoundId]);

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

  // Kategori degisirse temayı guncelle
  useEffect(() => {
    if (question?.category) {
      setTheme(getThemeFromRoom(question.category, gameMode || "SOCIAL"));
    }
  }, [question?.category, gameMode, setTheme]);

  if (!gameId || !question) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
        <div className="aurora-bg fixed inset-0 pointer-events-none opacity-20" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative z-10 mb-6"
        >
          <Loader2 className="text-accent" size={48} />
        </motion.div>
        <div className="relative z-10 text-center">
          <p className="text-white font-black tracking-[0.3em] text-sm uppercase mb-2 animate-pulse">Mirros Hazırlanıyor</p>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest opacity-60">Oyun verileri senkronize ediliyor...</p>
        </div>
        
        {/* Safety Net: Eğer 5 saniye içinde yüklenmezse lobiye dön butonu göster */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5 }}
          className="mt-12 relative z-10"
        >
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="text-[10px] font-black text-slate-500 hover:text-white underline underline-offset-4 tracking-widest uppercase"
          >
            Çok mu uzun sürdü? Lobiye Dön
          </button>
        </motion.div>
      </main>
    );
  }

  async function submitAnswer(content: string) {
    if (!activeRoundId) return;
    const res = await fetch(`/api/rounds/${activeRoundId}/answer`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Sunucu hatası" }));
      throw new Error(err.error || "Cevap gönderilemedi");
    }
  }

  async function submitGuess(content: string, reason?: string) {
    if (!activeRoundId) return;
    const res = await fetch(`/api/rounds/${activeRoundId}/guess`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Tahmin gönderilemedi" }));
      throw new Error(err.error || "Tahmin gönderilemedi");
    }
  }

  async function triggerScore() {
    if (!activeRoundId) return;
    const res = await fetch(`/api/rounds/${activeRoundId}/score`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Skor hesaplanamadı" }));
      throw new Error(err.error || "Skor hesaplanamadı");
    }
  }

  async function skipRound() {
    if (!activeRoundId) return;
    const res = await fetch(`/api/rounds/${activeRoundId}/skip`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Geçilemedi" }));
      console.error("[skipRound]", err.error);
    }
  }

  return (
    <main className="min-h-dvh bg-black flex flex-col relative overflow-hidden pt-safe pb-safe px-4 sm:px-8">
      {/* Background Elements */}
      <div className="aurora-bg fixed inset-0 pointer-events-none opacity-40" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.1)_0%,transparent_50%)] pointer-events-none" />
      
      {/* Floating Reactions Layer */}
      <FloatingReactions />

      <div className="relative z-10 flex flex-col w-full max-w-[480px] mx-auto px-4 py-6 gap-6 h-full min-h-dvh">
        <GameHeader roundNumber={currentRound} totalRounds={totalRounds} />

        {/* Global Timer Bar */}
        {(state === "ANSWERING" || state === "GUESSING") && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / 60) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className={cn(
                  "h-full transition-colors duration-500",
                  timeLeft > 20 ? "bg-accent" : timeLeft > 10 ? "bg-orange-500" : "bg-red-500 animate-pulse"
                )}
              />
            </div>
            <span className={cn(
              "text-[11px] font-black tabular-nums min-w-[24px] text-right transition-colors",
              timeLeft > 20 ? "text-accent" : timeLeft > 10 ? "text-orange-500" : "text-red-500 animate-pulse"
            )}>
              {timeLeft}s
            </span>
          </div>
        )}

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
                /* 1. SPECTATOR VIEW */
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
              ) : isBluff ? (
                /* 2b. BLUFF MODU */
                <motion.div key="bluff-area" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  {state === "ANSWERING" ? (
                    <div className="flex flex-col gap-3">
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl px-4 py-3 text-center">
                        <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">🎭 Sahte Cevap Yaz!</p>
                        <p className="text-[10px] text-slate-400 mt-1">Başkalarını kandır — gerçekmiş gibi görünen bir cevap yaz</p>
                      </div>
                      <AnswerInput onSubmit={submitAnswer} gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                      <p className="text-center text-[10px] text-slate-600 font-bold">{guessCount} / {totalGuessers} cevap gönderildi</p>
                    </div>
                  ) : state === "GUESSING" && bluffOptions.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl px-4 py-3 text-center">
                        <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">🔍 Hangisi Gerçek?</p>
                        <p className="text-[10px] text-slate-400 mt-1">Doğru cevabı bul — sahte yazanlara oy gelirse onlar da kazanır!</p>
                      </div>
                      <MultipleChoiceInput
                        options={bluffOptions}
                        onSubmit={submitGuess}
                        allowFreeText={false}
                        gameId={gameId}
                        username={players.find(p => p.id === myUserId)?.username}
                      />
                    </div>
                  ) : (
                    <div className="glass-card-elevated p-8 flex flex-col items-center gap-4 text-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-2 border-dashed border-violet-500/40" />
                      <p className="text-[13px] font-bold text-slate-400">Cevaplar toplanıyor…</p>
                    </div>
                  )}
                </motion.div>
              ) : (isQuiz || isExpose) ? (
                /* 2. QUIZ VEYA EXPOSE: Doğrudan Giriş/Tahmin Alanı (State ne olursa olsun) */
                <motion.div key="simultaneous-area" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  {isExpose ? (
                    <MultipleChoiceInput
                      options={players.filter(p => p.role !== "SPECTATOR").map(p => p.username || "Anonim")}
                      onSubmit={submitGuess}
                      allowFreeText={false}
                      showReason={true}
                      gameId={gameId}
                      username={players.find(p => p.id === myUserId)?.username}
                    />
                  ) : (
                    question.options
                      ? <MultipleChoiceInput options={question.options} onSubmit={submitAnswer} gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                      : <AnswerInput onSubmit={submitAnswer} gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                  )}
                </motion.div>
              ) : state === "ANSWERING" && answererId !== null ? (
                /* 3. SOCIAL MODE - ANSWERING */
                <motion.div key="answering-area" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  {isAnswerer ? (
                    question.options
                      ? <MultipleChoiceInput options={question.options} onSubmit={submitAnswer} allowFreeText gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                      : <AnswerInput onSubmit={submitAnswer} gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                  ) : (
                    <div className="glass-card-elevated p-8 flex flex-col items-center gap-4 text-center">
                      <div className="relative">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-2 border-dashed border-accent/30" />
                        <UserIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" size={20} />
                      </div>
                      <p className="text-[13px] font-medium text-slate-300 leading-relaxed">
                        <span className="text-white font-black">{spotlightPlayer?.username ?? "Arkadaşın"}</span> şu an cevap veriyor...
                      </p>
                      <span className={cn(
                        "text-[11px] font-black tabular-nums px-3 py-1 rounded-full border",
                        timeLeft <= 10
                          ? "text-red-400 border-red-500/30 bg-red-500/10 animate-pulse"
                          : "text-slate-500 border-white/10"
                      )}>
                        {timeLeft}s kaldı
                      </span>
                    </div>
                  )}
                </motion.div>
              ) : state === "GUESSING" ? (
                /* 4. SOCIAL MODE - GUESSING */
                <motion.div key="guessing-area" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  {isAnswerer ? (
                    <div className="glass-card-elevated p-8 flex flex-col items-center gap-6">
                      <p className="text-[15px] font-bold text-white tracking-tight">
                        {guessCount} / {totalGuessers} arkadaşın tahmin etti
                      </p>
                    </div>
                  ) : (
                    question.options
                      ? <MultipleChoiceInput options={question.options} onSubmit={submitGuess} allowFreeText showReason gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                      : <GuessInput opponentName={spotlightPlayer?.username ?? "Arkadaşın"} onSubmit={submitGuess} gameId={gameId} username={players.find(p => p.id === myUserId)?.username} />
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Flashback/Hafıza Kartı */}
            <AnimatePresence>
              {pastAnswers.length > 0 && (
                <FlashbackCard
                  username={spotlightPlayer?.username ?? "Arkadaşın"}
                  pastAnswers={pastAnswers}
                />
              )}
            </AnimatePresence>

            {/* Host Skip/Force Score Button */}
            {isHostPlayer && (state === "ANSWERING" || state === "GUESSING") && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  if (state === "GUESSING") triggerScore().catch(() => skipRound().catch(() => {}));
                  else skipRound();
                }}
                className="mt-4 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 group"
              >
                <Zap size={12} className="group-hover:text-yellow-400 transition-colors" />
                Süreyi Bitir ve İlerle
              </motion.button>
            )}
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
        {!isQuiz && lastRoundScore && state === "SCORING" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-[440px] glass-card-elevated p-6 md:p-8 space-y-8 border-accent/20 shadow-[0_0_50px_rgba(168,85,247,0.2)]"
            >
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                   <div className="h-px w-8 bg-accent/30" />
                   <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">{isExpose ? "Gıybet Sonuçları" : "Tur Özeti"}</span>
                   <div className="h-px w-8 bg-accent/30" />
                </div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{isExpose ? "Grup Kararını Verdi:" : "Doğru Cevap Şuydu:"}</h3>
                <p className={cn(
                  "text-3xl font-black text-white tracking-tighter italic text-center",
                  isExpose ? "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                )}>
                  {isExpose ? `🔥 ${lastRoundScore.answer} 🔥` : `"${lastRoundScore.answer}"`}
                </p>
              </div>

              <div className="space-y-3 max-h-[35dvh] overflow-y-auto pr-2 custom-scrollbar">
                {lastRoundScore.guessResults.map((g, i) => {
                  const isVictim = isExpose && g.userId === lastRoundScore.winnerId;
                  return (
                    <motion.div 
                      key={g.userId} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all relative overflow-hidden",
                        isVictim 
                          ? "bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                          : g.matchLevel === "EXACT" 
                            ? "bg-green-500/10 border-green-500/30" 
                            : g.matchLevel === "CLOSE" 
                              ? "bg-yellow-500/10 border-yellow-500/30" 
                              : "bg-white/[0.02] border-white/5"
                      )}
                    >
                      {isVictim && (
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border",
                        isVictim ? "bg-red-500/20 border-red-500/40" : "bg-white/5 border-white/10"
                      )}>
                        {players.find(p => p.id === g.userId)?.avatarUrl || g.username?.[0].toUpperCase()}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-500 uppercase">{g.username}</span>
                          {isVictim ? (
                            <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter animate-bounce">Exposed</span>
                          ) : g.matchLevel === "EXACT" && (
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[15px] font-bold text-white tracking-tight">{g.guess}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                        <Zap size={12} className={cn(g.points > 0 ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
                        <span className="text-[18px] font-black text-white tabular-nums">+{g.points}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Anonymous Gossip Wall (Reasons) */}
              {isExpose && lastRoundScore.guessResults.filter(g => g.reason).length > 0 && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 px-1">
                    <MessageSquareText size={14} className="text-red-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gıybet Duvarı (Anonim)</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {lastRoundScore.guessResults.filter(g => g.reason).map((g, idx) => (
                      <motion.div
                        key={`reason-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl italic text-[12px] text-slate-300 leading-relaxed relative"
                      >
                        <span className="text-red-500/40 text-xl absolute -top-1 -left-1 font-serif">&ldquo;</span>
                        {g.reason}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                {/* Ad Space */}
                <GoogleAd slot="2233445566" className="mt-2" />
                
                {useGameStore.getState().isHostPlayer ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!nextRoundData) return;
                      const res = await fetch(`/api/rounds/${nextRoundData.id}/start`, { method: "POST" });
                      if (!res.ok) {
                        const err = await res.json();
                        alert(err.error || "Tura geçilemedi");
                      }
                    }}
                    className="w-full py-5 rounded-[24px] bg-gradient-to-r from-accent to-fuchsia-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    SIRADAKİ TURA GEÇ
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
                      Oda sahibinin turu başlatması bekleniyor...
                    </p>
                    <div className="flex justify-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent/30 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-accent/30 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-accent/30 animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Quiz Scoring Box (Full Screen) */}
        {isQuiz && state === "SCORING" && lastQuizResults && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto"
          >
            <div className="w-full max-w-lg space-y-8 py-12">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center gap-6 text-center"
              >
                <div className="w-20 h-20 rounded-[2.5rem] bg-accent/20 border border-accent/40 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.3)] ring-1 ring-accent/30">
                  <Trophy className="text-accent" size={40} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Bilgi Yarışması</span>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">Doğru Cevabı Kim Bildi?</h3>
                </div>
              </motion.div>

              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 space-y-4 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-fuchsia-500 to-accent opacity-50" />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/10 px-3 py-1 rounded-full">Doğru Cevap</span>
                  <h4 className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{lastQuizResults.correctAnswer}</h4>
                </div>
              </motion.div>

              <div className="space-y-3">
                {lastQuizResults.results.map((r, i) => (
                  <motion.div 
                    key={r.userId} 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                      r.correct 
                        ? "bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]" 
                        : "bg-white/[0.02] border-white/5 opacity-60"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shadow-inner border border-white/10">
                      {players.find(p => p.id === r.userId)?.avatarUrl || r.username?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{r.username}</span>
                      <span className="text-[15px] font-bold text-white tracking-tight">{r.answer}</span>
                    </div>
                    {r.correct && <CheckCircle2 size={18} className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
                  </motion.div>
                ))}
              </div>

              <GoogleAd slot="3344556677" className="mt-4" />

              {/* Next Round Controller */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="pt-8"
              >
                {useGameStore.getState().isHostPlayer ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!nextRoundData) return;
                      const res = await fetch(`/api/rounds/${nextRoundData.id}/start`, { method: "POST" });
                      if (!res.ok) {
                        const err = await res.json();
                        alert(err.error || "Tura geçilemedi");
                      }
                    }}
                    className="w-full py-6 rounded-[2rem] bg-gradient-to-r from-accent to-fuchsia-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_20px_40px_rgba(168,85,247,0.4)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 ring-1 ring-white/20"
                  >
                    SIRADAKİ SORUYA GEÇ
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">
                      Ev Sahibi Yeni Soruyu Getiriyor...
                    </p>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-accent/40 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 rounded-full bg-accent/40 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" />
                    </div>
                  </div>
                )}
              </motion.div>
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
              <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">🎭 {isExpose ? "Yüzleşme Cezası!" : "Ceza Vakti!"}</span>
            </div>
            <p className="text-[14px] font-bold text-orange-200 leading-relaxed italic">
              {isExpose ? `${lastRoundScore?.answer}: ` : ""}&quot;{lastPenalty}&quot;
            </p>
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
    <div className="flex justify-center gap-3 px-1">
      {emojis.map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          onClick={() => sendReaction(emoji)}
          className={cn(
            "w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-xl transition-all shadow-sm",
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
