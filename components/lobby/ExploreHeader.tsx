"use client";

import { motion } from "framer-motion";

interface Props {
  user: any;
}

export function ExploreHeader({ user }: Props) {
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
      <div className="relative z-10">
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
          <p className="text-[12px] text-slate-500 font-bold mt-2 max-w-[240px] leading-tight">
            Günün soruları, istatistikler ve popüler kategoriler burada.
          </p>
        </motion.div>
      </div>

      {/* Decorative Aura */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 blur-[80px] -mr-20 -mt-20" />
    </div>
  );
}
