"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  KeyRound, 
  ChevronLeft, 
  ArrowRight,
  Baby,
  User,
  Crown,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onJoined:     (roomId: string, roomCode: string) => void;
  initialCode?: string;
}

type AgeGroup = "CHILD" | "ADULT" | "WISE";

const AGE_OPTIONS = [
  { value: "CHILD", icon: Baby, label: "Çocuk",          desc: "13 yaş altı" },
  { value: "ADULT", icon: User, label: "Yetişkin",       desc: "13–60 yaş" },
  { value: "WISE",  icon: Crown, label: "Bilge",          desc: "60+ yaş" },
];

export function JoinRoom({ onJoined, initialCode = "" }: Props) {
  const [step,     setStep]    = useState<"code" | "age">("code");
  const [code,     setCode]    = useState(initialCode);
  const [ageGroup, setAge]     = useState<AgeGroup>("ADULT");
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");

  const handleCodeNext = () => {
    if (code.trim().length < 4) { 
      setError("Lütfen geçerli bir oda kodu gir."); 
      return; 
    }
    setError("");
    setStep("age");
  };

  const handleJoin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/rooms/join", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: code.trim(), ageGroup }),
      });
      if (res.ok) {
        const data = await res.json();
        onJoined(data.id, data.code);
      } else if (res.status === 401) {
        window.location.href = "/login";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Odaya katılırken bir hata oluştu.");
        setStep("code");
      }
    } catch {
      setError("Bağlantı hatası. İnternetini kontrol et.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === "code" ? (
          <motion.div
            key="code-step"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-4"
          >
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
              <input
                className={cn(
                  "input-glass w-full pl-12 pr-4 py-4 text-lg font-black tracking-[0.2em] uppercase placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-600",
                  "focus:border-accent/40 focus:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all"
                )}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleCodeNext()}
                placeholder="ODA KODU"
                maxLength={8}
                autoCapitalize="characters"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold"
              >
                <AlertCircle size={14} /> {error}
              </motion.div>
            )}

            <button
              onClick={handleCodeNext}
              disabled={!code.trim()}
              className="btn-ghost w-full py-4 rounded-2xl text-[13px] tracking-widest font-bold flex items-center justify-center gap-2"
            >
              DEVAM ET <ArrowRight size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="age-step"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col gap-6"
          >
            <button 
              onClick={() => setStep("code")} 
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold w-fit"
            >
              <ChevronLeft size={16} /> Kodu Değiştir
            </button>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Senin Yaş Grubun</p>
              <div className="grid grid-cols-3 gap-2">
                {AGE_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setAge(g.value as AgeGroup)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border shrink-0",
                      ageGroup === g.value 
                        ? "bg-accent/15 border-accent/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
                    )}
                  >
                    <g.icon className={cn(ageGroup === g.value ? "text-accent" : "text-slate-400")} size={24} />
                    <div className="flex flex-col items-center">
                      <span className={cn(
                        "text-[12px] font-bold tracking-tight",
                        ageGroup === g.value ? "text-white" : "text-slate-400"
                      )}>
                        {g.label}
                      </span>
                      <span className="text-[8px] text-slate-500 font-medium whitespace-nowrap">{g.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={loading}
              className="btn-gradient w-full py-4 rounded-2xl text-[13px] tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(168,85,247,0.4)]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>ODAYA KATIL <ArrowRight size={16} /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
