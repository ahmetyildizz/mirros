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
  counts?: Record<string, number>;
}

interface DailyWidgetProps {
  onAnsweredStatus?: (answered: boolean) => void;
}

export function DailyWidget({ onAnsweredStatus }: DailyWidgetProps) {
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetch("/api/daily")
      .then(r => r.json())
      .then(d => {
        setData(d);
        if (onAnsweredStatus) onAnsweredStatus(d.answered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [onAnsweredStatus]);

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
        if (onAnsweredStatus) onAnsweredStatus(true);
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
      className="glass-card-elevated overflow-hidden relative group rounded-[2rem]"
    >
      <div className="p-7 relative z-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] bg-accent/10 flex items-center justify-center text-accent shadow-inner">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Günün Sorusu</h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                <Globe size={10} /> Global İstatistikler
              </p>
            </div>
          </div>
          {(!data.answered || showStats) && (
            <div className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/5 flex items-center gap-2 shadow-sm">
              <Users size={12} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-300 tracking-tighter">{data.totalParticipants} KİŞİ</span>
            </div>
          )}
        </header>

        <div className="space-y-7">
          {(!data.answered || showStats) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-md">{data.question.category}</span>
              </div>
              <h4 className="text-[18px] font-black text-white leading-tight pr-4 tracking-tight">
                &quot;{data.question.text}&quot;
              </h4>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!data.answered ? (
              <motion.div 
                key="options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 gap-3"
              >
                {data.question.options.map((opt, i) => (
                  <motion.button
                    key={opt}
                    whileHover={{ x: 6, backgroundColor: "rgba(255,255,255,0.06)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(opt)}
                    className="w-full text-left p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.06] hover:border-accent/40 transition-all duration-300 text-[14px] font-bold text-slate-200 flex items-center justify-between group/opt shadow-sm"
                  >
                    {opt}
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover/opt:opacity-100 transition-all">
                      <ArrowRight size={14} className="group-hover/opt:translate-x-0.5 transition-transform text-accent" />
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : !showStats ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between p-5 rounded-[1.5rem] bg-accent/5 border border-accent/10 shadow-inner"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Yanıtın Kaydedildi</span>
                </div>
                <button 
                  onClick={() => setShowStats(true)}
                  className="px-5 py-2.5 rounded-2xl bg-accent text-white text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_5px_15px_rgba(168,85,247,0.3)]"
                >
                  Sonuçlara Bak
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                {data.question.options.map((opt) => {
                  const pct = data.percentages[opt] || 0;
                  const isUserAnswer = data.userAnswer === opt;
                  
                  return (
                    <div key={opt} className="relative group/res">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className={cn(
                          "text-[12px] font-bold flex items-center gap-2",
                          isUserAnswer ? "text-white" : "text-slate-500"
                        )}>
                          {opt}
                          {isUserAnswer && <CheckCircle2 size={12} className="text-green-500" />}
                        </span>
                        <div className="flex items-end gap-1.5">
                          <span className={cn(
                            "text-[12px] font-black",
                            isUserAnswer ? "text-accent" : "text-slate-200"
                          )}>%{pct}</span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mb-[1px]">({data.counts?.[opt] || 0} Kişi)</span>
                        </div>
                      </div>
                      
                      <div className="h-2.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                          className={cn(
                            "h-full rounded-full relative z-10",
                            isUserAnswer ? "bg-gradient-to-r from-accent to-fuchsia-500" : "bg-white/10"
                          )}
                        />
                        {isUserAnswer && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className="absolute inset-0 bg-accent/20 blur-md"
                          />
                        )}
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
