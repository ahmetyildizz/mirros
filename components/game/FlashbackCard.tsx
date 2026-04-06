"use client";

import { motion, AnimatePresence } from "framer-motion";
import { History, Sparkles, Clock, Quote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface PastAnswer {
  id:          string;
  content:     string;
  submittedAt: string;
  round: {
    game: {
      finishedAt: string | null;
    }
  }
}

interface Props {
  username:    string;
  pastAnswers: PastAnswer[];
}

export function FlashbackCard({ username, pastAnswers }: Props) {
  if (pastAnswers.length === 0) return null;

  const latest = pastAnswers[0];
  const timeAgo = formatDistanceToNow(new Date(latest.submittedAt), { addSuffix: true, locale: tr });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative mt-6 group select-none"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-accent-2/20 rounded-[2rem] blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
      
      <div className="relative glass-card-elevated p-6 rounded-[2rem] border-white/10 overflow-hidden">
        {/* Background Decorative Icon */}
        <div className="absolute -right-4 -top-4 opacity-5 rotate-12">
          <History size={120} />
        </div>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent ring-1 ring-accent/20">
            <History size={20} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-white tracking-tight flex items-center gap-2">
              Mirros Hafızası
              <Sparkles size={14} className="text-accent animate-pulse" />
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {username} bu soruya daha önce de cevap vermişti...
            </p>
          </div>
        </div>

        <div className="relative">
          <Quote className="absolute -left-2 -top-2 w-8 h-8 text-white/5" />
          <div className="pl-4 border-l-2 border-accent/30 py-1">
            <p className="text-lg font-medium text-slate-100 tracking-tight italic">
              "{latest.content}"
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {timeAgo}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/5">Arşivden</span>
        </div>
      </div>
    </motion.div>
  );
}
