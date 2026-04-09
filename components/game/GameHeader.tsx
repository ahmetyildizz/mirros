import { motion } from "framer-motion";
import { Sparkles, History } from "lucide-react";
import { SoundToggle } from "./SoundToggle";
import { useState } from "react";
import { GameHistory } from "./GameHistory";
import { useGameStore } from "@/store/game.store";

interface Props {
  roundNumber: number;
  totalRounds: number;
}

export function GameHeader({ roundNumber, totalRounds }: Props) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { gameId } = useGameStore();

  return (
    <>
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

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-colors"
          >
            <History size={18} className="text-slate-400 hover:text-white transition-colors" />
          </button>

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

      <GameHistory 
        gameId={gameId ?? ""} 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
    </>
  );
}
