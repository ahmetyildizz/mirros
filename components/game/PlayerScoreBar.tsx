"use client";

import { motion } from "framer-motion";
import { Zap, Flame } from "lucide-react";
import { useGameStore, type Player } from "@/store/game.store";
import { cn } from "@/lib/utils";

export function PlayerScoreBar() {
  const { players, playerScores, answererId, gameMode } = useGameStore();
  const isQuiz = gameMode === "QUIZ";

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none px-1">
      {players.map((p: Player, i: number) => (
        <motion.div
          key={p.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex flex-col items-center gap-2 min-w-[50px] group"
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 relative",
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
  );
}
