"use client";

import { useState } from "react";
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
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onCreated: (roomId: string, code: string) => void;
}

type GameMode = "SOCIAL" | "QUIZ";
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
  { icon: Users,      label: "Aile Toplantısı", desc: "Aile bağını güçlendirin, birlikte gülün",    gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 6,  color: "from-purple-500 to-indigo-600" },
  { icon: Cake,       label: "Doğum Günü",        desc: "Misafirler konuğu ne kadar tanıyor?",       gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-orange-400 to-red-500" },
  { icon: Briefcase,  label: "Takım Building",    desc: "Ekip arkadaşlarınızı keşfedin",             gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10, color: "from-cyan-500 to-blue-600" },
  { icon: Brain,      label: "Bilgi Yarışması",   desc: "Eğlenceli sorular, komik cezalar",          gameMode: "QUIZ",   ageGroup: "ADULT", maxPlayers: 6,  color: "from-emerald-400 to-teal-500" },
  { icon: Settings2,  label: "Özelleştir",        desc: "İstediğin gibi bir oda kur",                gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 4,  color: "from-slate-400 to-slate-600" },
];

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 8, 10];

export function CreateRoom({ onCreated }: Props) {
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
    if (tpl.label === "Özelleştir") {
      setStep("config");
    } else {
      handleCreate(tpl.gameMode, tpl.ageGroup, tpl.maxPlayers);
    }
  };

  const handleCreate = async (
    finalMode = mode,
    finalAge  = ageGroup,
    finalMax  = maxPlayers,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ gameMode: finalMode, ageGroup: finalAge, maxPlayers: finalMax }),
      });
      if (res.ok) {
        const data = await res.json();
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
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === "template" ? (
          <motion.div
            key="template-step"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-4"
          >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Nasıl bir gece?</p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((tpl, i) => (
                <motion.button
                  key={tpl.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleSelectTemplate(tpl)}
                  disabled={loading}
                  className={cn(
                    "group relative flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-300",
                    "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] hover:-translate-y-1 active:scale-[0.98]",
                    "backdrop-blur-md overflow-hidden"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 bg-gradient-to-br opacity-90",
                    tpl.color
                  )}>
                    <tpl.icon className="text-white w-6 h-6" />
                  </div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[13px] font-bold text-slate-100 tracking-tight">{tpl.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-tight max-w-[120px]">{tpl.desc}</span>
                  </div>

                  <div className={cn(
                    "absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br",
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
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold w-fit"
            >
              <ChevronLeft size={16} /> Geri Dön
            </button>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Oyun Modu</p>
              <div className="grid grid-cols-2 gap-3">
                {(["SOCIAL", "QUIZ"] as GameMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border",
                      mode === m 
                        ? "bg-accent/15 border-accent/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
                    )}
                  >
                    {m === "SOCIAL" ? <Users className="text-accent" /> : <Brain className="text-cyan-400" />}
                    <span className={cn(
                      "text-[12px] font-bold tracking-tight",
                      mode === m ? "text-white" : "text-slate-400"
                    )}>
                      {m === "SOCIAL" ? "Birbirini Tanı" : "Bilgi Yarışması"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Yaş Grubu</p>
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
                      "flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-bold text-[11px] transition-all border",
                      ageGroup === g.id 
                        ? "bg-accent/15 border-accent/40 text-white" 
                        : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/5"
                    )}
                  >
                    <g.icon size={14} />
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Oyuncu Sayısı</p>
              <div className="flex flex-wrap justify-between gap-2">
                {PLAYER_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setMax(n)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all border",
                      maxPlayers === n 
                        ? "bg-accent/15 border-accent/40 text-white" 
                        : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/5"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 text-center font-medium opacity-40 italic">
                Oda dolduğunda oyun otomatik başlar.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={() => handleCreate()}
              disabled={loading}
              className="btn-gradient w-full py-4 rounded-2xl text-[13px] tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(168,85,247,0.4)]"
            >
              {loading ? "HAZIRLANIYOR..." : (
                <>ODAYI KUR <ArrowRight size={16} /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
