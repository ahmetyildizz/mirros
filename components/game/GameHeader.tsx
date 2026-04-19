import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, History, LogOut } from "lucide-react";
import { SoundToggle } from "./SoundToggle";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameHistory } from "./GameHistory";
import { useGameStore } from "@/store/game.store";

interface Props {
  roundNumber: number;
  totalRounds: number;
}

export function GameHeader({ roundNumber, totalRounds }: Props) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const { gameId } = useGameStore();
  const router = useRouter();

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between py-2 px-1 border-b border-white/5 mb-2"
      >
        <div className="flex flex-col cursor-pointer" onClick={() => setShowExitConfirm(true)}>
          <span className="text-2xl font-black tracking-tighter gradient-text leading-none drop-shadow-sm">
            mirros
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            aria-label="Geçmişi Gör"
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

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 flex flex-col gap-4 max-w-xs w-full text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <LogOut size={22} className="text-red-400" />
              </div>
              <div>
                <p className="font-black text-white text-[15px]">Oyundan Çıkılsın mı?</p>
                <p className="text-[12px] text-slate-500 mt-1">İlerlemen kaybolacak.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  type="button"
                  className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[13px] font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Kal
                </button>
                <button
                  onClick={() => router.push("/")}
                  type="button"
                  className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-[13px] font-black text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Çık
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
