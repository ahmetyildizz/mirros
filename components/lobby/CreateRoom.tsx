"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Cake, 
  Briefcase, 
  Brain, 
  Settings2, 
  ChevronLeft, 
  ArrowRight,
  Baby,
  User,
  Crown,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game.store";
import type { GameTheme } from "@/store/game.store";

interface Props {
  onCreated: (roomId: string, code: string) => void;
}

type GameMode = "SOCIAL" | "QUIZ" | "EXPOSE";
type AgeGroup = "CHILD" | "ADULT" | "WISE";

interface Template {
  icon:       any;
  label:      string;
  desc:       string;
  gameMode:   GameMode;
  ageGroup:   AgeGroup;
  maxPlayers: number;
  color:      string;
}

const TEMPLATES: Template[] = [
  { icon: Users,      label: "Çift Gecesi",      desc: "Birbirinizi ne kadar tanıyorsunuz?", gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 2,  color: "from-rose-500 to-pink-600" },
  { icon: Flame,      label: "Dedikodu Masası",  desc: "Grupta en çok kim... (Yüzleşme)",    gameMode: "EXPOSE", ageGroup: "ADULT", maxPlayers: 10, color: "from-red-500 to-orange-600" },
  { icon: Users,      label: "Aile Toplantısı", desc: "Aile bağını güçlendirin, birlikte gülün",    gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 6,  color: "from-purple-500 to-indigo-600" },
  { icon: Cake,       label: "Doğum Günü",        desc: "Misafirler konuğu ne kadar tanıyor?",       gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-orange-400 to-red-500" },
  { icon: Briefcase,  label: "Takım Building",    desc: "Ekip arkadaşlarınızı keşfedin",             gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10, color: "from-cyan-500 to-blue-600" },
  { icon: Brain,      label: "Bilgi Yarışması",   desc: "Eğlenceli sorular, komik cezalar",          gameMode: "QUIZ",   ageGroup: "ADULT", maxPlayers: 6,  color: "from-emerald-400 to-teal-500" },
  { icon: Settings2,  label: "Özelleştir",        desc: "İstediğin gibi bir oda kur",                gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 4,  color: "from-slate-400 to-slate-600" },
];

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function CreateRoom({ onCreated }: Props) {
  const router = useRouter();
  const { setTheme } = useGameStore();
  const [step,     setStep]    = useState<"template" | "config">("template");
  const [mode,     setMode]   = useState<GameMode>("SOCIAL");
  const [ageGroup, setAge]    = useState<AgeGroup>("ADULT");
  const [maxPlayers, setMax]  = useState(4);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState<string | null>(null);

  const handleSelectTemplate = (tpl: Template) => {
    setError(null);
    setMode(tpl.gameMode);
    setAge(tpl.ageGroup);
    setMax(tpl.maxPlayers);

    // Apply theme
    let theme: GameTheme = "purple";
    if (tpl.gameMode === "QUIZ") theme = "intel";
    else if (tpl.gameMode === "EXPOSE") theme = "neon";
    else if (tpl.label === "Çift Gecesi") theme = "love";
    else if (tpl.label === "Aile Toplantısı" || tpl.label === "Doğum Günü") theme = "warm";
    setTheme(theme);

    if (tpl.label === "Çift Gecesi") {
      handleCreate(tpl.gameMode, tpl.ageGroup, tpl.maxPlayers, tpl.label);
    } else {
      setStep("config");
    }
  };

  const handleCreate = async (
    finalMode = mode,
    finalAge  = ageGroup,
    finalMax  = maxPlayers,
    finalCategory?: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ 
          gameMode: finalMode, 
          ageGroup: finalAge, 
          maxPlayers: finalMax,
          category: finalCategory 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        
        // Mobil cihazda geçiş reklamı göster
        const { Capacitor } = await import("@capacitor/core");
        const { AdMobService } = await import("@/lib/services/admob.service");
        if (Capacitor.isNativePlatform()) {
          AdMobService.showInterstitial();
        }

        onCreated(data.id, data.code);
      } else if (res.status === 401) {
        window.location.href = "/login";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Oda oluşturulamadı. Tekrar dene.");
      }
    } catch {
      setError("Bağlantı hatası. İnternet bağlantını kontrol et.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full pb-safe">
      <AnimatePresence mode="wait">
        {step === "template" ? (
          <motion.div
            key="template-step"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-start px-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nasıl bir gece?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((tpl, i) => (
                <motion.button
                  key={tpl.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelectTemplate(tpl)}
                  disabled={loading}
                  className={cn(
                    "group relative flex flex-col items-center gap-4 p-5 rounded-[2rem] transition-all duration-500",
                    "bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 hover:-translate-y-1.5 active:scale-[0.98]",
                    "backdrop-blur-xl overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 bg-gradient-to-br shadow-lg",
                    tpl.color
                  )}>
                    <tpl.icon className="text-white w-7 h-7 drop-shadow-md" />
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-[14px] font-black text-slate-100 tracking-tight uppercase">{tpl.label}</span>
                    <span className="text-[10px] text-slate-500 font-bold leading-tight max-w-[120px] opacity-80 group-hover:opacity-100 transition-opacity">{tpl.desc}</span>
                  </div>
 
                  <div className={cn(
                    "absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br",
                    tpl.color
                  )} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="config-step"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col gap-6"
          >
            <button 
              onClick={() => setStep("template")} 
              className="flex items-center gap-3 text-slate-100/60 hover:text-white transition-all duration-300 w-fit mb-2 group px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-accent/20 group-hover:text-accent transition-all duration-500 shadow-inner">
                <ChevronLeft size={20} />
              </div>
              <div className="flex flex-col items-start leading-none gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Ayarları Değiştir</span>
                <span className="text-[13px] font-black uppercase tracking-widest">Geri Dön</span>
              </div>
            </button>
 
            <div className="flex flex-col gap-4 fade-up">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Oyun Modu</p>
              <div className="grid grid-cols-2 gap-3">
                {(["SOCIAL", "QUIZ"] as GameMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-300 border",
                      mode === m 
                        ? "bg-accent/10 border-accent/40 shadow-[0_0_25px_rgba(168,85,247,0.15)] ring-1 ring-accent/20" 
                        : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10"
                    )}
                  >
                    {m === "SOCIAL" ? (
                      <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center">
                        <Users className="text-accent" size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                        <Brain className="text-cyan-400" size={20} />
                      </div>
                    )}
                    <span className={cn(
                      "text-[12px] font-bold tracking-tight uppercase",
                      mode === m ? "text-white" : "text-slate-400"
                    )}>
                      {m === "SOCIAL" ? "Birbirini Tanı" : "Bilgi Yarışması"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
 
            <div className="flex flex-col gap-4 fade-up [animation-delay:0.1s]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Yaş Grubu</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "CHILD", icon: Baby, label: "Çocuk" },
                  { id: "ADULT", icon: User, label: "Yetişkin" },
                  { id: "WISE", icon: Crown, label: "Bilge" }
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setAge(g.id as AgeGroup)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-2xl font-bold text-[11px] transition-all duration-300 border",
                      ageGroup === g.id 
                        ? "bg-accent/15 border-accent/40 text-white shadow-[0_5px_15px_rgba(168,85,247,0.15)]" 
                        : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/5"
                    )}
                  >
                    <g.icon size={14} className={cn(ageGroup === g.id ? "text-accent" : "text-slate-500")} />
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
 
            <div className="flex flex-col gap-4 fade-up [animation-delay:0.2s]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Oyuncu Sayısı</p>
              <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2">
                {PLAYER_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setMax(n)}
                    className={cn(
                      "h-12 flex items-center justify-center rounded-2xl font-black transition-all duration-300 border",
                      maxPlayers === n 
                        ? "bg-accent/20 border-accent/60 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-105 z-10" 
                        : "bg-white/[0.02] border-white/[0.05] text-slate-500 hover:bg-white/5"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 text-center font-medium opacity-40 italic mt-1">
                Oda dolduğunda oyun otomatik başlar.
              </p>
            </div>
 
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold"
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}
 
            <button
              onClick={() => handleCreate()}
              disabled={loading}
              className={cn(
                "group relative w-full py-5 rounded-[2rem] text-[13px] tracking-[0.2em] font-black flex items-center justify-center gap-3 transition-all duration-500 overflow-hidden",
                loading 
                  ? "bg-white/5 text-slate-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-accent to-fuchsia-600 text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_15px_50px_-5px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-95"
              )}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                  HAZIRLANIYOR...
                </div>
              ) : (
                <>
                  <span>ODAYI KUR</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
