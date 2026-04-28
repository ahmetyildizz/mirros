"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface Props {
  user: any;
  onRandomPlay: () => void;
}

export function ExploreHeader({ user, onRandomPlay }: Props) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "İyi Geceler";
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "Tünaydın";
    return "İyi Akşamlar";
  };

  const name = user?.username || "Arkadaş";

  return (
    <div className="shrink-0 px-5 pt-10 pb-6 relative overflow-hidden">
      <div className="relative z-10 flex items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-1"
          >
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse" />
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em] italic">Keşfet</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
              {getGreeting()}, <span className="text-accent">{name}</span>
            </h2>
            <p className="text-[12px] text-slate-500 font-bold mt-2 leading-tight">
              Bugün ne oynayalım?
            </p>
          </motion.div>
        </div>

        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.92 }}
          onClick={onRandomPlay}
          className="shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-accent/10 border border-accent/20 hover:bg-accent/20 hover:border-accent/40 transition-all group"
        >
          <Zap size={18} className="text-accent group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-black text-accent uppercase tracking-widest whitespace-nowrap">Hızlı Oyna</span>
        </motion.button>
      </div>

      {/* Decorative Aura */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 blur-[80px] -mr-20 -mt-20" />
    </div>
  );
}
