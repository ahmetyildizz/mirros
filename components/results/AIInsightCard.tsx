"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Cpu, Zap, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  intro: string;
  tag: string;
  story: string;
}

export function AIInsightCard({ intro, tag, story }: Props) {
  const [analyzing, setAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate high-tech analysis
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setAnalyzing(false), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card-elevated overflow-hidden relative min-h-[320px] border-accent/20"
    >
      {/* Moving Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-24 -right-24 w-64 h-64 bg-accent/20 blur-[80px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-fuchsia-600/10 blur-[100px] rounded-full"
        />
      </div>

      <AnimatePresence mode="wait">
        {analyzing ? (
          <motion.div 
            key="analyzing"
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-md z-20"
          >
            <div className="relative mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full border-2 border-dashed border-accent/40"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="text-accent animate-pulse" size={32} />
              </div>
            </div>
            
            <h3 className="text-[15px] font-black text-accent uppercase tracking-[0.4em] mb-4 drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] italic">SİSTEM ANALİZ EDİYOR</h3>
            
            <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
              <motion.div 
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-accent to-fuchsia-500"
              />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{progress}% tamamlandı</p>
          </motion.div>
        ) : (
          <motion.div 
            key="report"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 flex flex-col gap-6 relative z-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Cpu size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{intro}</p>
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[14px] font-black text-white uppercase tracking-tighter">{tag}</span>
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <Sparkles size={24} className="text-accent/40" />
              </motion.div>
            </div>

            <div className="relative">
              <Quote className="absolute -top-4 -left-4 text-accent/10" size={64} />
              <p className="text-lg md:text-xl font-black text-white leading-tight italic relative z-10 antialiased pt-4 tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                "{story}"
              </p>
              <div className="absolute -bottom-2 right-0 w-32 h-px bg-gradient-to-l from-accent/50 to-transparent" />
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Kişilik Analizi v1.0</span>
              <div className="flex gap-1">
                {[1,2,3].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full bg-accent/30" />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
