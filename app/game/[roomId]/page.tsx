"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TvDisplay } from "@/components/game/TvDisplay";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Clock, Sparkles, Loader2, Zap } from "lucide-react";
import { useGameStore } from "@/store/game.store";
import { useGameState, useRoomState } from "@/hooks/useGameState";
import { GameHeader }         from "@/components/game/GameHeader";
import { QuestionCard }       from "@/components/game/QuestionCard";
import { PlayerScoreBar }     from "@/components/game/PlayerScoreBar";
import { InteractionArea }    from "@/components/game/InteractionArea";
import { ScoringOverlay }     from "@/components/game/ScoringOverlay";
import { GameErrorBoundary }  from "@/components/game/GameErrorBoundary";
import { ReactionOverlay }    from "@/components/game/ReactionOverlay";
import { ReactionToolbar }    from "@/components/game/ReactionToolbar";
import { sounds }             from "@/lib/sounds";
import { getThemeFromRoom }   from "@/lib/logic/theme-mapper";
import { cn }                 from "@/lib/utils";

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isTv         = searchParams.get("display") === "tv";

  if (isTv) return <TvDisplay roomId={roomId} />;

  const {
    gameId, state, question, myRole, answererId, gameMode,
    players, lastRoundScore, lastQuizResults,
    currentRound, totalRounds, activeRoundId,
    guessCount, totalGuessers, setTheme, nextRoundData,
    isHostPlayer,
    setMyRole, setIsHostPlayer,
  } = useGameStore();

  const isQuiz   = gameMode === "QUIZ";
  const isExpose = gameMode === "EXPOSE";
  const isSpy    = gameMode === "SPY";

  const isAnswerer      = myRole === "answerer";
  const spotlightPlayer = players.find(p => p.id === answererId);

  const [myUserId, setMyUserId]           = useState<string | null>(null);
  const [pastAnswers, setPastAnswers]     = useState<any[]>([]);
  const [timeLeft, setTimeLeft]           = useState(60);
  const [scoringCountdown, setScoringCountdown] = useState<number | null>(null);

  const scoringRoundRef   = useRef<string | null>(null);
  const hasAutoSubmitted  = useRef(false);
  const timerHasRun       = useRef(false);

  // ── Kullanıcı kimliğini ve host durumunu çek ──────────────────────────────
  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(data => {
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
        fetch(`/api/rooms/${roomId}`)
          .then(r => r.json())
          .then(room => { if (room.hostId) setIsHostPlayer(room.hostId === data.id); })
          .catch(() => {});
      })
      .catch(() => {});
  }, [setMyRole, roomId, setIsHostPlayer]);

  // ── Rol güncelle (answererId değiştiğinde) ───────────────────────────────
  useEffect(() => {
    if (isQuiz || isExpose || !myUserId || !answererId) return;
    const me = players.find(p => p.id === myUserId);
    if (me?.role === "SPECTATOR") setMyRole("spectator");
    else setMyRole(answererId === myUserId ? "answerer" : "guesser");
  }, [answererId, myUserId, setMyRole, isQuiz, isExpose, players]);

  useGameState(gameId ?? "", myUserId ?? "");
  useRoomState(roomId);

  // ── Flashback sorgusu ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isQuiz && state === "GUESSING" && myRole === "guesser" && answererId && question?.id) {
      fetch(`/api/rounds/flashback?userId=${answererId}&questionId=${question.id}&currentRoundId=${activeRoundId}`)
        .then(r => r.json())
        .then(data => { if (data.pastAnswers) setPastAnswers(data.pastAnswers); })
        .catch(() => {});
    } else if (state !== "GUESSING") {
      setPastAnswers([]);
    }
  }, [state, myRole, answererId, question?.id, isQuiz, activeRoundId]);

  // ── Ses kilidi + başlangıç recovery ──────────────────────────────────────
  useEffect(() => {
    const unlockAudio = () => {
      import("@/lib/sounds").then(({ sounds }) => { sounds.tick(); });
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);

    fetch(`/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (data.activeGameId) {
          setTheme(getThemeFromRoom(data.category, data.gameMode || "SOCIAL"));
          recoverGameState(data.activeGameId);
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [roomId, router, gameId]);

  // ── Game state recovery ───────────────────────────────────────────────────
  const recoverGameState = async (id: string) => {
    try {
      const res  = await fetch(`/api/games/${id}`);
      const data = await res.json();
      if (!data.gameId) return;
      useGameStore.getState().hydrate(data);
      if (data.room?.category) setTheme(getThemeFromRoom(data.room.category, data.gameMode || "SOCIAL"));
      if (myUserId) {
        const me   = data.players.find((p: any) => p.id === myUserId);
        const role = me?.role === "SPECTATOR" ? "spectator"
          : (data.gameMode === "QUIZ" || data.gameMode === "EXPOSE" ? "guesser"
          : (data.answererId === myUserId ? "answerer" : "guesser"));
        useGameStore.getState().setMyRole(role);
        if (data.hostId) useGameStore.getState().setIsHostPlayer(data.hostId === myUserId);
      }
      if ((data.gameMode === "EXPOSE" || data.gameMode === "QUIZ" || !data.answererId) && data.state === "ANSWERING") {
        useGameStore.getState().setGameState("GUESSING");
      }
    } catch (e) {
      console.error("Game recovery failed", e);
    }
  };

  // ── Flow guard: answererId yokken ANSWERING → GUESSING ───────────────────
  useEffect(() => {
    if (state === "ANSWERING" && !isQuiz && !answererId && gameId) {
      useGameStore.getState().setGameState("GUESSING");
    }
  }, [state, answererId, isQuiz, gameId]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== "ANSWERING" && state !== "GUESSING") return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 1);
        if (next < prev) timerHasRun.current = true;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, activeRoundId]);

  useEffect(() => {
    if (state === "ANSWERING" || state === "GUESSING") {
      setTimeLeft(60);
      hasAutoSubmitted.current = false;
      timerHasRun.current = false;
    }
  }, [state, activeRoundId]);

  // ── Periyodik recovery (Pusher desync) ───────────────────────────────────
  useEffect(() => {
    if (state !== "ANSWERING" && state !== "GUESSING") return;
    if (!gameId) return;
    const interval = setInterval(() => { recoverGameState(gameId).catch(() => {}); }, 20_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, activeRoundId, gameId]);

  // ── SPY: yeni round'da kişisel konu için recovery ────────────────────────
  useEffect(() => {
    if (isSpy && activeRoundId && gameId) recoverGameState(gameId).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoundId, isSpy, gameId]);

  // ── Auto-submit / skip timeout ────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft !== 0 || hasAutoSubmitted.current || !timerHasRun.current) return;
    hasAutoSubmitted.current = true;
    if (state === "ANSWERING") {
      if (isAnswerer || isQuiz) submitAnswer("...").catch(() => {});
      skipRound().catch(() => {});
    } else if (state === "GUESSING") {
      if (isHostPlayer || isAnswerer) triggerScore().catch(() => skipRound().catch(() => {}));
    }
  }, [timeLeft, state, isAnswerer, isHostPlayer, isQuiz]);

  // ── Ses efektleri ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 10 && (state === "ANSWERING" || state === "GUESSING")) sounds.ping();
  }, [timeLeft, state]);

  useEffect(() => {
    if (state === "ANSWERING") { sounds.newRound(); sounds.ping(); }
    if (state === "GUESSING")  sounds.tick();
  }, [state]);

  // ── Auto-score (tüm tahminler geldi) ─────────────────────────────────────
  useEffect(() => {
    if (state !== "GUESSING") return;
    const canTrigger = isAnswerer || ((isQuiz || isExpose) && isHostPlayer);
    if (!canTrigger) return;
    if (guessCount > 0 && guessCount >= totalGuessers) {
      if (activeRoundId && scoringRoundRef.current !== activeRoundId) {
        scoringRoundRef.current = activeRoundId;
        triggerScore();
      }
    }
  }, [guessCount, totalGuessers, state, isAnswerer, isQuiz, isExpose, activeRoundId]);

  // ── Auto-advance (host, scoring) ─────────────────────────────────────────
  useEffect(() => {
    if (state !== "SCORING") { setScoringCountdown(null); return; }
    if (!isHostPlayer) return;
    const timeout = setTimeout(async () => {
      const nd = useGameStore.getState().nextRoundData;
      if (!nd?.id) return;
      await fetch(`/api/rounds/${nd.id}/start`, { method: "POST" }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isHostPlayer]);

  // ── Confetti / ses (scoring) ──────────────────────────────────────────────
  useEffect(() => {
    if (state !== "SCORING") return;
    const isSuccess = isQuiz
      ? lastQuizResults?.results.some(r => r.correct)
      : lastRoundScore?.guessResults.some(g => g.points >= 5);
    if (isSuccess) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#A855F7", "#F43F5E", "#06B6D4"] });
      sounds.exact();
    } else {
      sounds.wrong();
    }
  }, [state, lastQuizResults, lastRoundScore, isQuiz]);

  // ── Kategori teması ───────────────────────────────────────────────────────
  useEffect(() => {
    if (question?.category) setTheme(getThemeFromRoom(question.category, gameMode || "SOCIAL"));
  }, [question?.category, gameMode, setTheme]);

  // ── Derived ───────────────────────────────────────────────────────────────
  // ── API Actions ───────────────────────────────────────────────────────────
  async function submitAnswer(content: string) {
    if (!activeRoundId) return;
    const res = await fetch(`/api/rounds/${activeRoundId}/answer`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Sunucu hatası" }));
      console.error("submitAnswer failed", res.status, err);
      if (res.status === 409 && gameId) { recoverGameState(gameId).catch(() => {}); return; }
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
      console.error("submitGuess failed", res.status, err);
      if (res.status === 409 && gameId) { recoverGameState(gameId).catch(() => {}); return; }
      throw new Error(err.error || "Tahmin gönderilemedi");
    }
  }

  async function triggerScore() {
    if (!activeRoundId) return;
    const res = await fetch(`/api/rounds/${activeRoundId}/score`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Skor hesaplanamadı" }));
      console.error("triggerScore failed", res.status, err);
      throw new Error(err.error || "Skor hesaplanamadı");
    }
  }

  async function skipRound() {
    if (!activeRoundId) return;
    const res = await fetch(`/api/rounds/${activeRoundId}/skip`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Geçilemedi" }));
      console.error("skipRound failed", res.status, err);
    }
  }

  async function handleNextRound() {
    setScoringCountdown(null);
    if (!nextRoundData?.id) return;
    const res = await fetch(`/api/rounds/${nextRoundData.id}/start`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Tura geçilemedi");
    }
  }

  // ── Loading screen ────────────────────────────────────────────────────────
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

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <GameErrorBoundary roomId={roomId}>
      <main className="min-h-dvh bg-black flex flex-col relative overflow-hidden pt-safe pb-safe px-4 sm:px-8">
        <div className="aurora-bg fixed inset-0 pointer-events-none opacity-40" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.1)_0%,transparent_50%)] pointer-events-none" />

        <ReactionOverlay />

        <div className="relative z-10 flex flex-col w-full max-w-[480px] mx-auto px-4 py-6 gap-6 h-full min-h-dvh">
          <GameHeader roundNumber={currentRound} totalRounds={totalRounds} gameMode={gameMode ?? undefined} />

          {/* Timer Bar */}
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

          <PlayerScoreBar />

          <div className="flex flex-col gap-6 flex-1">
            {/* Spotlight */}
            {!isQuiz && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl w-fit"
              >
                <Sparkles className="text-accent" size={14} />
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                  ODAK: <span className="text-white font-black">
                    {isAnswerer ? "SENSİN" : `${spotlightPlayer?.avatarUrl || ""} ${spotlightPlayer?.username ?? "?"}`.trim().toUpperCase()}
                  </span>
                </p>
              </motion.div>
            )}

            <QuestionCard
              key={activeRoundId}
              text={question.text}
              category={question.category}
              roundNumber={currentRound}
              answererName={!isQuiz && !isAnswerer && state === "GUESSING" ? (spotlightPlayer?.username ?? undefined) : undefined}
              answererAvatar={!isQuiz && !isAnswerer && state === "GUESSING" ? (spotlightPlayer?.avatarUrl ?? undefined) : undefined}
              focusName={spotlightPlayer?.username}
            />

            <InteractionArea
              myUserId={myUserId}
              pastAnswers={pastAnswers}
              timeLeft={timeLeft}
              isAnswerer={isAnswerer}
              isHostPlayer={!!isHostPlayer}
              spotlightPlayer={spotlightPlayer}
              onSubmitAnswer={submitAnswer}
              onSubmitGuess={submitGuess}
              onTriggerScore={triggerScore}
              onSkipRound={skipRound}
            />

            {state === "END" && (
              <div className="flex flex-col items-center gap-4 py-12">
                <Loader2 className="animate-spin text-accent" size={32} />
                <p className="text-sm font-black text-white uppercase tracking-widest">Sonuçlar Hazırlanıyor...</p>
              </div>
            )}
          </div>

          <ReactionToolbar roomId={roomId} />
        </div>

        <ScoringOverlay onNextRound={handleNextRound} />

        {/* Footer */}
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
    </GameErrorBoundary>
  );
}
