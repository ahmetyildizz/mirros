"use client";

import { use, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Loader2 } from "lucide-react";
import { useGameStore } from "@/store/game.store";
import { useGameState, useRoomState } from "@/hooks/useGameState";
import { getThemeFromRoom } from "@/lib/logic/theme-mapper";
import { cn } from "@/lib/utils";

interface Props {
  roomId: string;
}

export function TvDisplay({ roomId }: Props) {
  const {
    gameId, state, question, answererId, gameMode,
    players, playerScores, lastRoundScore, lastQuizResults,
    currentRound, totalRounds, activeRoundId, guessCount, totalGuessers,
    setTheme
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(!gameId);

  useGameState(gameId ?? "", "");
  useRoomState(roomId);

  // Recovery Logic for TV Mode
  useEffect(() => {
    if (gameId && question) {
      setLoading(false);
      return;
    }

    const recover = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        const room = await res.json();
        
        if (room.activeGameId) {
          const gameRes = await fetch(`/api/games/${room.activeGameId}`);
          const gameData = await gameRes.json();
          
          if (gameData.gameId) {
            useGameStore.getState().hydrate(gameData);
            setTheme(getThemeFromRoom(room.category, gameData.gameMode || "SOCIAL"));
          }
        }
      } catch (e) {
        console.error("[TV] Recovery failed", e);
      } finally {
        setLoading(false);
      }
    };

    recover();
  }, [roomId, gameId, question, setTheme]);

  // Timer
  useEffect(() => {
    if (state !== "ANSWERING" && state !== "GUESSING") {
      setTimeLeft(60);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(p => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [state, activeRoundId]);

  useEffect(() => {
    if (state === "ANSWERING" || state === "GUESSING") setTimeLeft(60);
  }, [state, activeRoundId]);

  const sortedPlayers = [...players].sort(
    (a, b) => (playerScores[b.id] ?? 0) - (playerScores[a.id] ?? 0)
  );
  const answerer = players.find(p => p.id === answererId);
  const isQuiz   = gameMode === "QUIZ";
  const isExpose = gameMode === "EXPOSE";

  const timerColor =
    timeLeft > 30 ? "text-green-400" :
    timeLeft > 10 ? "text-yellow-400" :
    "text-red-500";

  if (loading || !gameId || !question) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div className="aurora-bg fixed inset-0 pointer-events-none opacity-20" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="relative z-10"
        >
          <Monitor size={80} className="text-accent/40" />
        </motion.div>
        
        <div className="relative z-10 text-center space-y-4">
          <h2 className="text-white font-black tracking-[0.4em] text-3xl uppercase">
            Mirros <span className="text-accent">TV</span>
          </h2>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-accent/60" size={24} />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
              {loading ? "Oyun Verileri Senkronize Ediliyor..." : "Oyunun Başlaması Bekleniyor..."}
            </p>
          </div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 text-center">
          <p className="text-white/10 text-[8px] font-black uppercase tracking-[0.5em]">
            mirros.vercel.app — Social Gaming Framework
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden relative">
      {/* Background */}
      <div className="aurora-bg fixed inset-0 pointer-events-none opacity-30" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.12)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-12 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black tracking-tighter text-white">mirros</span>
          <span className="text-[11px] font-black text-accent/60 uppercase tracking-[0.35em] mt-1">TV</span>
        </div>
        <div className="flex items-center gap-6 text-slate-400 text-sm font-bold uppercase tracking-widest">
          <span>Tur {currentRound} / {totalRounds}</span>
          <span className="flex items-center gap-2">
            <Users size={14} />
            {players.filter(p => p.role !== "SPECTATOR").length} oyuncu
          </span>
        </div>
      </header>

      {/* Main content: 2 columns */}
      <div className="relative z-10 flex flex-1 gap-0 overflow-hidden">

        {/* Left: Question + State */}
        <div className="flex-1 flex flex-col justify-center px-16 py-12 gap-10">

          {/* Mode badge */}
          {!isQuiz && answerer && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-2xl">
                {answerer.avatarUrl || answerer.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-xs font-black text-accent/60 uppercase tracking-[0.3em]">Odak Oyuncu</p>
                <p className="text-xl font-black text-white">{answerer.username}</p>
              </div>
            </motion.div>
          )}

          {/* Category */}
          <p className="text-xs font-black text-white/30 uppercase tracking-[0.35em]">{question.category}</p>

          {/* Question text — big */}
          <motion.h1
            key={activeRoundId}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black leading-tight tracking-tight text-white"
          >
            {answerer?.username 
              ? question.text.replace(/\[İ?S[Iİ]M\]/gi, answerer.username)
              : question.text}
          </motion.h1>

          {/* State label */}
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={cn(
                "w-3 h-3 rounded-full",
                state === "ANSWERING" ? "bg-accent" :
                state === "GUESSING"  ? "bg-yellow-400" :
                state === "SCORING"   ? "bg-green-500" : "bg-white/20"
              )}
            />
            <p className="text-lg font-black text-slate-400 uppercase tracking-[0.25em]">
              {state === "ANSWERING" ? (isQuiz || isExpose ? "Herkes Cevap Veriyor" : `${answerer?.username} Cevap Veriyor`) :
               state === "GUESSING"  ? `${guessCount} / ${totalGuessers} Tahmin` :
               state === "SCORING"   ? "Sonuçlar!" : ""}
            </p>
          </div>

          {/* Timer */}
          {(state === "ANSWERING" || state === "GUESSING") && (
            <div className="flex items-end gap-4">
              <span className={cn("text-8xl font-black tabular-nums leading-none", timerColor)}>
                {timeLeft}
              </span>
              <span className="text-2xl font-black text-white/20 mb-3">sn</span>
            </div>
          )}

          {/* Multiple choice options */}
          {isQuiz && question.options && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              {(question.options as string[]).map((opt, i) => (
                <div
                  key={opt}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-3"
                >
                  <span className="w-7 h-7 rounded-full bg-accent/20 text-accent font-black text-sm flex items-center justify-center">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-bold text-lg text-white">{opt}</span>
                </div>
              ))}
            </div>
          )}

          {/* Scoring overlay */}
          <AnimatePresence>
            {state === "SCORING" && (lastRoundScore || lastQuizResults) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/5 border border-accent/20 rounded-3xl p-8 space-y-3"
              >
                {lastRoundScore && (
                  <>
                    <p className="text-xs font-black text-accent/60 uppercase tracking-[0.3em]">Doğru Cevap</p>
                    <p className="text-4xl font-black text-white italic">"{lastRoundScore.answer}"</p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {lastRoundScore.guessResults.map(g => (
                        <div key={g.userId} className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm",
                          g.points >= 10 ? "bg-accent/20 text-accent border border-accent/30" :
                          g.points >= 5  ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" :
                          "bg-white/5 text-slate-400 border border-white/10"
                        )}>
                          <span>{g.username}</span>
                          <span>+{g.points}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {lastQuizResults && (
                  <>
                    <p className="text-xs font-black text-accent/60 uppercase tracking-[0.3em]">Doğru Cevap</p>
                    <p className="text-4xl font-black text-white italic">"{lastQuizResults.correctAnswer}"</p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {lastQuizResults.results.filter(r => r.correct).map(r => (
                        <div key={r.userId} className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-black text-sm">
                          <span>✓</span>
                          <span>{r.username}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Scoreboard */}
        <div className="w-80 flex flex-col border-l border-white/5 bg-white/[0.015] overflow-y-auto py-8 px-6 gap-3">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-yellow-400" />
            <span className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Skor Tablosu</span>
          </div>

          {sortedPlayers.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-500",
                p.id === answererId && !isQuiz
                  ? "bg-accent/15 border-accent/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                  : "bg-white/[0.03] border-white/5"
              )}
            >
              <span className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
                i === 0 ? "bg-yellow-400/20 text-yellow-400" :
                i === 1 ? "bg-slate-400/20 text-slate-300" :
                i === 2 ? "bg-orange-600/20 text-orange-500" :
                "bg-white/5 text-white/30"
              )}>
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-white truncate">
                  {p.avatarUrl ? `${p.avatarUrl} ` : ""}{p.username || "Anonim"}
                </p>
                {(p.streak ?? 0) >= 2 && (
                  <p className="text-[10px] font-black text-orange-500 flex items-center gap-1">
                    <Flame size={10} className="fill-orange-500" /> {p.streak}x seri
                  </p>
                )}
              </div>

              <span className="text-xl font-black text-white tabular-nums">
                {playerScores[p.id] ?? 0}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-12 py-4 border-t border-white/5">
        <p className="text-[10px] font-black text-white/15 uppercase tracking-[0.4em]">
          mirros.vercel.app
        </p>
        <p className="text-[10px] font-black text-white/15 uppercase tracking-[0.4em]">
          📺 TV Modu — Oyuncular kendi telefonlarından oynuyor
        </p>
      </footer>
    </div>
  );
}
