"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SoundToggle } from "./SoundToggle";

interface Props {
  roundNumber: number;
  totalRounds: number;
}

export function GameHeader({ roundNumber, totalRounds }: Props) {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between py-2 px-1 border-b border-white/5 mb-2"
    >
      <div className="flex flex-col">
        <span className="text-2xl font-black tracking-tighter gradient-text leading-none drop-shadow-sm">
          mirros
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 shadow-inner">
          <Sparkles size={12} className="text-accent" />
          <span className="text-[11px] font-black text-slate-300 tracking-widest uppercase">
            ROUND {roundNumber} <span className="opacity-30 mx-1">/</span> {totalRounds}
          </span>
        </div>
        
        <div className="w-px h-6 bg-white/10" />
        
        <SoundToggle />
      </div>
    </motion.header>
  );
}
