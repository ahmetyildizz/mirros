"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MessageSquareText, 
  Send, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  opponentName: string;
  onSubmit:     (value: string, reason?: string) => void | Promise<void>;
  loading?:     boolean;
}

export function GuessInput({ opponentName, onSubmit, loading, gameId, username }: Props & { gameId?: string | null; username?: string | null }) {
  const [value,     setValue]     = useState("");
  const [reason,    setReason]    = useState("");
  const [sending,   setSending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const EMOJIS = ["🔥", "😂", "🤔", "❤️", "👏"];

  const sendReaction = async (emoji: string) => {
    if (!gameId) return;
    try {
      await fetch(`/api/games/${gameId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, username }),
      });
    } catch {}
  };

  const handleSubmit = async () => {
    if (!value.trim() || sending || submitted) return;
    setSending(true);
    try {
      await onSubmit(value.trim(), reason.trim() || undefined);
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 flex flex-col items-center gap-3 border-green-500/20 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
          <CheckCircle2 size={24} />
        </div>
        <p className="text-[13px] font-black text-green-400 uppercase tracking-widest">Tahminin Gönderildi</p>
        
        <div className="flex flex-col gap-2 w-full pt-2 border-t border-white/5">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Reaksiyon Gönder</p>
          <div className="flex justify-center gap-2">
            {EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.9 }}
                onClick={() => sendReaction(emoji)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-lg hover:bg-white/10 transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <p className="text-[12px] font-bold text-slate-400 tracking-tight">
          <span className="text-white font-black">{opponentName}</span> ne demiş olabilir?
        </p>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Tahminini buraya yaz..."
          maxLength={120}
          disabled={sending || loading}
          className="input-glass w-full pl-12 pr-4 py-4 text-[15px] font-bold text-white placeholder:text-slate-600 focus:border-accent/40 outline-none transition-all"
        />
      </div>

      <AnimatePresence>
        {value.trim().length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative overflow-hidden group"
          >
            <MessageSquareText className="absolute left-4 top-4 text-slate-600 group-hover:text-slate-400 transition-colors" size={16} />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Neden böyle düşündün? (isteğe bağlı)"
              className="input-glass w-full pl-12 pr-5 py-4 min-h-[80px] text-[13px] font-medium text-slate-300 resize-none outline-none focus:border-slate-500 transition-all border-dashed"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center px-1 py-1">
        <div className="flex gap-2">
          {EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sendReaction(emoji)}
              className="text-xl hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{value.length}/120</span>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!value.trim() || sending || loading}
        className={cn(
          "btn-gradient w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[13px] font-black tracking-[0.2em] uppercase transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          (!value.trim() || sending || loading) ? "opacity-30 grayscale pointer-events-none" : "hover:shadow-[0_8px_32px_rgba(168,85,247,0.3)]"
        )}
      >
        {sending || loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>TAHMİN ET <Send size={16} className="rotate-45" /></>
        )}
      </motion.button>
    </div>
  );
}
