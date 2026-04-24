"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  PenLine,
  MessageSquareText,
  Send,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn, hapticFeedback } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

interface Props {
  options:        string[];
  onSubmit:       (value: string, reason?: string) => void | Promise<void>;
  allowFreeText?: boolean;
  showReason?:    boolean;
  gameId?:        string | null;
  username?:      string | null;
  guessCount?:    number;
  totalGuessers?: number;
}

export function MultipleChoiceInput({
  options, onSubmit, allowFreeText = false, showReason = false, gameId, username, guessCount, totalGuessers
}: Props) {
  const [selected,   setSelected]   = useState<string | null>(null);
  const [freeText,   setFreeText]   = useState("");
  const [showFree,   setShowFree]   = useState(false);
  const [reason,     setReason]     = useState("");
  const [sending,    setSending]    = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleSubmit = async () => {
    const value = showFree ? freeText.trim() : selected;
    if (!value || sending || submitted) return;
    setSending(true);
    setError(null);
    sounds.pop();
    try {
      await onSubmit(value, reason.trim() || undefined);
      hapticFeedback("success");
      setSubmitted(true);
    } catch (e: any) {
      hapticFeedback("error");
      setError(e?.message || "Gönderilemedi, tekrar dene");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    const hasProgress = totalGuessers != null && totalGuessers > 0;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card-elevated p-8 flex flex-col items-center gap-6 border-green-500/20 text-center relative overflow-hidden"
      >
        {/* Success Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/10 blur-[40px] pointer-events-none" />
        
        <div className="relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="w-20 h-20 rounded-[2rem] bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]"
          >
            <CheckCircle2 size={40} strokeWidth={2.5} />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-[2rem] border-2 border-green-500/30"
          />
        </div>

        <div className="space-y-1">
          <p className="text-[15px] font-black text-white uppercase tracking-[0.2em] italic">Cevabın Alındı!</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Şimdi diğerlerinin hamlesini bekle...</p>
        </div>

        {hasProgress && (
          <div className="w-full space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center px-1">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-accent" />
                  BEKLENENLER
               </span>
               <span className="text-[11px] font-black text-accent italic">
                  {guessCount} / {totalGuessers}
               </span>
            </div>
            
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px] relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((guessCount ?? 0) / totalGuessers) * 100)}%` }}
                className="h-full bg-gradient-to-r from-accent/60 via-accent to-accent/60 rounded-full relative shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)]"
              >
                  <motion.div 
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"
                  />
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  const hasSelection = showFree ? freeText.trim().length > 0 : !!selected;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt) => (
          <motion.button
            key={opt}
            disabled={sending}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { 
               hapticFeedback("light");
               setSelected(opt); 
               setShowFree(false); 
            }}
            className={cn(
              "group w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
              selected === opt && !showFree 
                ? "bg-accent/15 border-accent text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                : "bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/[0.06] hover:border-white/10"
            )}
          >
            <span className={cn(
              "text-[14px] font-bold tracking-tight",
              selected === opt && !showFree ? "text-white" : "group-hover:text-slate-200"
            )}>
              {opt}
            </span>
            {selected === opt && !showFree ? (
              <CheckCircle2 size={18} className="text-accent" />
            ) : (
              <ChevronRight size={18} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            )}
          </motion.button>
        ))}

        {allowFreeText && (
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowFree(true); setSelected(null); }}
            className={cn(
              "group w-full flex items-center justify-between p-4 rounded-2xl border-2 border-dashed transition-all duration-300",
              showFree 
                ? "bg-accent/15 border-accent text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                : "bg-white/[0.01] border-white/10 text-slate-500 hover:bg-white/[0.03] hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-2">
              <PenLine size={16} className={showFree ? "text-accent" : "opacity-40"} />
              <span className={cn("text-[13px] font-bold italic", showFree && "text-white")}>Diğer (Kendin Yaz)</span>
            </div>
            {showFree && <CheckCircle2 size={18} className="text-accent" />}
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showFree && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <input
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Cevabını buraya karala..."
              maxLength={120}
              autoFocus
              className="input-glass w-full py-4 px-5 text-[15px] font-bold text-white focus:border-accent/40 mb-2"
            />
          </motion.div>
        )}

        {showReason && hasSelection && (
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
              placeholder="Neden böyle düşündün? Arkadaşlarını ikna et... (isteğe bağlı)"
              className="input-glass w-full pl-12 pr-5 py-4 min-h-[80px] text-[13px] font-medium text-slate-300 resize-none outline-none focus:border-slate-500 transition-all border-dashed"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end items-center px-1 py-1">
        {showFree && <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{freeText.length}/120</span>}
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
        disabled={!hasSelection || sending}
        className={cn(
          "btn-gradient w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[13px] font-black tracking-[0.2em] uppercase transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          (!hasSelection || sending) ? "opacity-30 grayscale pointer-events-none" : "hover:shadow-[0_8px_32px_rgba(168,85,247,0.3)]"
        )}
      >
        {sending ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>GÖNDER <Send size={16} className="rotate-45" /></>
        )}
      </motion.button>
    </div>
  );
}
