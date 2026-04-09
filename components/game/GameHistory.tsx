"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  History as HistoryIcon, 
  ChevronDown, 
  Sparkles,
  User,
  Quote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

interface HistoryItem {
  number: number;
  question: string;
  category: string;
  answererId: string;
  answer: string;
  answererName: string;
  answererAvatar?: string | null;
  guesses: {
    username: string;
    guess: string;
    matchLevel: string;
  }[];
}

interface Props {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GameHistory({ gameId, isOpen, onClose }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && gameId) {
      setLoading(true);
      fetch(`/api/games/${gameId}/history`)
        .then((r) => r.json())
        .then((data) => {
          setHistory(data.history || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, gameId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-20 bg-zinc-950 border-t border-white/10 rounded-t-[32px] z-[110] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <HistoryIcon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest">Oyun Geçmişi</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Oynanan Rauntlar</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <HistoryIcon size={32} className="opacity-20" />
                  </motion.div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]">Yükleniyor...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <HistoryIcon size={32} className="text-slate-700" />
                  </div>
                  <h3 className="text-white font-black uppercase tracking-widest mb-2">Henüz Veri Yok</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed max-w-[200px]">
                    İlk raunt tamamlandığında burada görünecek.
                  </p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative pl-6 border-l-2 border-white/5"
                  >
                    {/* Round Bubble */}
                    <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-zinc-900 border-2 border-accent flex items-center justify-center text-[10px] font-black text-accent shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                      {item.number}
                    </div>

                    <div className="glass-card p-5 space-y-4">
                      {/* Question */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Sparkles size={10} className="text-slate-500" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.category}</span>
                        </div>
                        <p className="text-[15px] font-bold text-white leading-tight">{item.question}</p>
                      </div>

                      {/* The Truth */}
                      <div className="bg-accent/5 rounded-2xl p-4 border border-accent/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center text-[12px]">
                            {item.answererAvatar || (item.answererName || "?")[0].toUpperCase()}
                          </div>
                          <span className="text-[10px] font-black text-accent uppercase tracking-widest">{item.answererName}</span>
                        </div>
                        <div className="flex gap-2">
                          <Quote size={12} className="text-accent opacity-40 shrink-0 mt-1" />
                          <p className="text-[16px] font-black text-white italic tracking-tight italic select-none">
                            {item.answer}
                          </p>
                        </div>
                      </div>

                      {/* Guesses Summary */}
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Tahminler</p>
                        <div className="flex flex-wrap gap-2">
                          {item.guesses.map((g, i) => (
                            <div key={i} className={cn(
                              "px-3 py-1.5 rounded-xl border text-[11px] font-bold",
                              g.matchLevel === "EXACT" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                              g.matchLevel === "CLOSE" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                              "bg-white/[0.02] border-white/5 text-slate-500"
                            )}>
                              <span className="opacity-50 mr-1">{g.username}:</span> {g.guess}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
