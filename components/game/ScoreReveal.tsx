"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Search,
  Sparkles,
  Trophy
} from "lucide-react";
import type { MatchLevel } from "@/store/game.store";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

const CONFIG: Record<MatchLevel, { label: string; colorClass: string; icon: any; points: number }> = {
  EXACT:  { label: "TAM BİLDİN!",  colorClass: "text-green-500",  icon: Trophy,       points: 10 },
  CLOSE:  { label: "YAKINDI!",     colorClass: "text-yellow-500", icon: Sparkles,     points: 5  },
  WRONG:  { label: "YANLIŞ",       colorClass: "text-slate-500",  icon: XCircle,      points: 0  },
};

interface Props {
  matchLevel: MatchLevel;
  answer: string;
  guess: string;
}

export function ScoreReveal({ matchLevel, answer, guess }: Props) {
  const cfg = CONFIG[matchLevel];
  const Icon = cfg.icon;

  useEffect(() => {
    if (matchLevel === "EXACT") {
      const dur = 3 * 1000;
      const end = Date.now() + dur;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#a855f7', '#ec4899', '#ffffff']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#a855f7', '#ec4899', '#ffffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else if (matchLevel === "CLOSE") {
       confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#eab308', '#ffffff']
       });
    }
  }, [matchLevel]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 15, stiffness: 300 }}
      className={cn(
        "glass-card-elevated p-8 flex flex-col items-center text-center relative overflow-hidden",
        matchLevel === "EXACT" ? "border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.3)] ring-1 ring-green-500/20" : 
        matchLevel === "CLOSE" ? "border-yellow-500/30 shadow-[0_0_60px_rgba(234,179,8,0.3)] ring-1 ring-yellow-500/20" : ""
      )}
    >
      <div className={cn("mb-4 p-5 rounded-[2rem] bg-white/[0.03] shadow-inner", cfg.colorClass)}>
        <Icon size={56} strokeWidth={3} className="drop-shadow-[0_0_15px_currentColor]" />
      </div>

      <p className={cn("text-[13px] font-black uppercase tracking-[0.3em] mb-2", cfg.colorClass)}>
        {cfg.label}
      </p>

      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-6xl font-black text-white tracking-tighter">+{cfg.points}</span>
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Puan</span>
      </div>

      <div className="w-full flex flex-col gap-3 pt-6 border-t border-white/5">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
            <CheckCircle2 size={10} /> Gerçek Cevap
          </span>
          <p className="text-xl font-black text-white tracking-tight">{answer}</p>
        </div>

        <div className="flex flex-col gap-1 opacity-60">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
            <Search size={10} /> Senin Tahminin
          </span>
          <p className="text-lg font-bold text-slate-300 tracking-tight">{guess}</p>
        </div>
      </div>

      {matchLevel === "EXACT" && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ x: ["-100%", "200%"], y: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            className="absolute top-0 left-0 w-20 h-[200%] bg-white/10 rotate-45 blur-xl"
          />
        </div>
      )}
    </motion.div>
  );
}
