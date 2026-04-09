"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface DailyData {
  id: string;
  question: {
    id: string;
    text: string;
    options: string[];
    category: string;
  };
  answered: boolean;
  userAnswer?: string;
  totalParticipants: number;
  percentages: Record<string, number>;
}

export function DailyWidget() {
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetch("/api/daily")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAnswer = async (option: string) => {
    if (!data || data.answered || submitting) return;
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyQuestionId: data.id, content: option }),
      });

      if (res.ok) {
        // Refetch to get updated stats
        const updated = await fetch("/api/daily").then(r => r.json());
        setData(updated);
        setShowStats(true); // Auto show stats on first answer
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#A855F7", "#D946EF", "#6366F1"]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="w-full h-32 glass-card animate-pulse flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="glass-card-elevated overflow-hidden relative group"
    >
      <div className="p-6 relative z-10">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Günün Sorusu</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                <Globe size={10} /> Global İstatistikler
              </p>
            </div>
          </div>
          {(!data.answered || showStats) && (
            <div className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <Users size={12} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-300 tracking-tighter">{data.totalParticipants} KİŞİ</span>
            </div>
          )}
        </header>

        <div className="space-y-6">
          {(!data.answered || showStats) && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={10} className="text-accent" />
                <span className="text-[9px] font-black text-accent uppercase tracking-widest">{data.question.category}</span>
              </div>
              <h4 className="text-[17px] font-bold text-white leading-tight pr-8">
                {data.question.text}
              </h4>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!data.answered ? (
              <motion.div 
                key="options"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-2"
              >
                {data.question.options.map((opt, i) => (
                  <motion.button
                    key={opt}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(opt)}
                    className="w-full text-left p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-accent/30 transition-all text-[13px] font-bold text-slate-300 flex items-center justify-between group/opt"
                  >
                    {opt}
                    <ArrowRight size={14} className="opacity-0 group-hover/opt:opacity-100 group-hover/opt:translate-x-1 transition-all text-accent" />
                  </motion.button>
                ))}
              </motion.div>
            ) : !showStats ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between p-4 rounded-2xl bg-accent/5 border border-accent/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Bu soruyu yanıtladın</span>
                </div>
                <button 
                  onClick={() => setShowStats(true)}
                  className="px-4 py-2 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Sonuçları Gör
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3"
              >
                {data.question.options.map((opt) => {
                  const pct = data.percentages[opt] || 0;
                  const isUserAnswer = data.userAnswer === opt;
                  
                  return (
                    <div key={opt} className="relative group/res">
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className={cn(
                          "text-[12px] font-bold flex items-center gap-2",
                          isUserAnswer ? "text-white" : "text-slate-500"
                        )}>
                          {opt}
                          {isUserAnswer && <CheckCircle2 size={12} className="text-green-500" />}
                        </span>
                        <span className={cn(
                          "text-[12px] font-black",
                          isUserAnswer ? "text-accent" : "text-slate-600"
                        )}>{pct}%</span>
                      </div>
                      
                      <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          className={cn(
                            "h-full rounded-full",
                            isUserAnswer ? "bg-gradient-to-r from-accent to-fuchsia-500" : "bg-white/10"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                  <button 
                    onClick={() => setShowStats(false)}
                    className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Paneli Gizle
                  </button>
                  <div className="flex items-center gap-1.5 text-accent font-black text-[10px] tracking-widest animate-pulse">
                    <TrendingUp size={12} /> GLOBAL TREND
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
