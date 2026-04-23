"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Trophy, AlertCircle, CheckCircle2, ChevronRight, ArrowRight, Zap, MessageSquareText,
} from "lucide-react";
import { useGameStore } from "@/store/game.store";
import { GoogleAd } from "@/components/ads/GoogleAd";
import { cn } from "@/lib/utils";

interface Props {
  onNextRound: () => Promise<void>;
}

export function ScoringOverlay({ onNextRound }: Props) {
  const {
    state, gameMode, lastRoundScore, lastQuizResults, lastPenalty,
    players, playerScores, nextRoundData, isHostPlayer,
  } = useGameStore();

  const isQuiz   = gameMode === "QUIZ";
  const isExpose = gameMode === "EXPOSE";
  const isSpy    = gameMode === "SPY";

  const NextRoundButton = ({ className }: { className?: string }) => (
    isHostPlayer ? (
      <button
        type="button"
        disabled={!nextRoundData}
        onClick={onNextRound}
        className={cn(
          "w-full py-5 rounded-[24px] bg-gradient-to-r from-accent to-fuchsia-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait",
          className
        )}
      >
        {isQuiz ? "SIRADAKİ SORUYA GEÇ" : "SIRADAKİ TURA GEÇ"}
        {isQuiz ? <ArrowRight size={20} /> : <ChevronRight size={18} />}
      </button>
    ) : (
      <div className="text-center space-y-2">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
          {isQuiz ? "Ev Sahibi Yeni Soruyu Getiriyor..." : "Oda sahibinin turu başlatması bekleniyor..."}
        </p>
        <div className="flex justify-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent/30 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/30 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/30 animate-bounce" />
        </div>
      </div>
    )
  );

  return (
    <AnimatePresence>
      {/* Social / EXPOSE / SPY Scoring */}
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
                <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">
                  {isExpose ? "Gıybet Sonuçları" : isSpy ? "Casus İfşası" : "Tur Özeti"}
                </span>
                <div className="h-px w-8 bg-accent/30" />
              </div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                {isExpose ? "Grup Kararını Verdi:" : isSpy ? "Gruptaki Casus Şuydu:" : "Doğru Cevap Şuydu:"}
              </h3>
              <p className={cn(
                "text-3xl font-black text-white tracking-tighter italic text-center",
                (isExpose || isSpy) ? "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              )}>
                {`"${lastRoundScore.answer}"`}
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
                    {isVictim && <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />}
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

            {/* Anonymous Gossip Wall */}
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
              <GoogleAd slot="2233445566" className="mt-2" />
              <NextRoundButton />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Quiz Scoring */}
      {isQuiz && state === "SCORING" && lastQuizResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto"
        >
          <div className="w-full max-w-lg space-y-8 py-12">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-accent/20 border border-accent/40 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.3)] ring-1 ring-accent/30">
                <Trophy className="text-accent" size={40} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Bilgi Yarışması</span>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">Doğru Cevabı Kim Bildi?</h3>
              </div>
            </motion.div>

            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 space-y-4 shadow-2xl relative overflow-hidden">
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

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="pt-8">
              <NextRoundButton className="py-6 rounded-[2rem] shadow-[0_15px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_20px_40px_rgba(168,85,247,0.4)] ring-1 ring-white/20" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Ceza Bildirimi */}
      {lastPenalty && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed top-24 right-4 z-[60] bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded-r-2xl max-w-[240px]"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="text-orange-500" size={16} />
            <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">
              {isExpose ? "Yüzleşme Cezası!" : "Ceza Vakti!"}
            </span>
          </div>
          <p className="text-[14px] font-bold text-orange-200 leading-relaxed italic">
            {isExpose ? `${lastRoundScore?.answer}: ` : ""}&quot;{lastPenalty}&quot;
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
