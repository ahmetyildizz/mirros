"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  CheckCircle2,
  Loader2,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

interface Props {
  placeholder?: string;
  onSubmit: (value: string) => void | Promise<void>;
  loading?: boolean;
}

export function AnswerInput({ placeholder = "Cevabını buraya yaz...", onSubmit, loading, gameId, username }: Props & { gameId?: string | null; username?: string | null }) {
  const [value, setValue]         = useState("");
  const [sending, setSending]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!value.trim() || sending || submitted) return;
    setSending(true);
    setError(null);
    sounds.pop();
    try {
      await onSubmit(value.trim());
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || "Gönderilemedi, tekrar dene");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex flex-col items-center gap-4 border-green-500/20 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
          <CheckCircle2 size={24} />
        </div>
        <p className="text-[13px] font-black text-green-400 uppercase tracking-widest">Cevabın Gönderildi</p>
        
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative group">
        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={placeholder}
          maxLength={120}
          disabled={sending || loading}
          className="input-glass w-full pl-12 pr-4 py-4 text-[15px] font-bold text-white placeholder:text-slate-600 focus:border-accent/40 transition-all outline-none"
        />
      </div>

      <div className="flex justify-end items-center px-1">
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{value.length}/120</span>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl"
        >
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span className="text-[12px] font-bold text-red-400">{error}</span>
        </motion.div>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!value.trim() || loading || sending}
        className={cn(
          "btn-gradient w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[13px] font-black tracking-[0.2em] uppercase transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          (!value.trim() || loading || sending) ? "opacity-30 grayscale pointer-events-none" : "hover:shadow-[0_8px_32px_rgba(168,85,247,0.3)]"
        )}
      >
        {sending ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>CEVABI GÖNDER <Send size={16} className="rotate-45" /></>
        )}
      </motion.button>
    </div>
  );
}
