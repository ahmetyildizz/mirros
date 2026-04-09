"use client";

import { motion } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  category: string;
  roundNumber: number;
  answererName?: string;
  answererAvatar?: string | null;
}

export function QuestionCard({ text, category, roundNumber, answererName, answererAvatar }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-elevated p-8 relative overflow-hidden group"
    >
      {/* Background Decorative Shimmer */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] -mr-10 -mt-10 group-hover:bg-accent/10 transition-colors duration-700" />
      
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Sparkles size={10} className="text-accent" />
              ROUND {roundNumber}
            </span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/10">
              {category}
            </span>
          </div>
          <Quote size={20} className="text-white/5 group-hover:text-white/10 transition-colors" />
        </div>

        {answererName && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[13px] font-bold text-accent tracking-tight flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
            {answererAvatar && <span className="text-lg">{answererAvatar}</span>}
            {answererName}&apos;a şu soru soruldu:
          </motion.p>
        )}

        <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight drop-shadow-sm">
          {text}
        </h3>
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </motion.div>
  );
}
