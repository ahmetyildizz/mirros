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
  Flame,
  Fingerprint,
  Clock,
  Star,
  MessageSquare,
  Gamepad2,
  MoonStar,
  Utensils
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game.store";
import type { GameTheme } from "@/store/game.store";

interface Props {
  onCreated: (roomId: string, code: string) => void;
  onStepChange?: (step: "template" | "config") => void;
}

type GameMode = "SOCIAL" | "QUIZ" | "EXPOSE" | "BLUFF";
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
  { icon: Coffee,     label: "Buz Kıran",        desc: "Yeni tanışanlar için buzları eriten sorular", gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-sky-400 to-blue-500" },
  { icon: Flame,      label: "Dedikodu Masası",  desc: "Grupta en çok kim... (Yüzleşme)",    gameMode: "EXPOSE", ageGroup: "ADULT", maxPlayers: 10, color: "from-red-500 to-orange-600" },
  { icon: Users,      label: "Aile Toplantısı", desc: "Aile bağını güçlendirin, birlikte gülün",    gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 6,  color: "from-purple-500 to-indigo-600" },
  { icon: Cake,       label: "Doğum Günü",        desc: "Misafirler konuğu ne kadar tanıyor?",       gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-orange-400 to-red-500" },
  { icon: Briefcase,  label: "Takım Building",    desc: "Ekip arkadaşlarınızı keşfedin",             gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10, color: "from-cyan-500 to-blue-600" },
  { icon: Flame,      label: "Ofis Kaosu",        desc: "İş yerinde maskeleri düşürün!",             gameMode: "EXPOSE", ageGroup: "ADULT", maxPlayers: 8,  color: "from-blue-600 to-slate-800" },
  { icon: Flame,      label: "Kampüs Kaosu",      desc: "Kantin ve dersliklerdeki maskeler düşsün!", gameMode: "EXPOSE", ageGroup: "ADULT", maxPlayers: 10, color: "from-orange-500 to-red-600" },
  { icon: Clock,      label: "Nostalji 90'lar",   desc: "Kasetler, atariler ve unutulmaz anılar!",   gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-yellow-500 to-orange-600" },
  { icon: Star,       label: "Kız Gecesi",        desc: "Gıybet, moda ve dostluk dolu bir akşam!",   gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 12, color: "from-pink-400 to-rose-500" },
  { icon: Brain,      label: "Bilgi Yarışması",   desc: "Eğlenceli sorular, komik cezalar",          gameMode: "QUIZ",   ageGroup: "ADULT", maxPlayers: 6,  color: "from-emerald-400 to-teal-500" },
  { icon: Tv,         label: "Sinema & Dizi",     desc: "Kült filmler ve viral diziler hakkında her şey!", gameMode: "QUIZ", ageGroup: "ADULT", maxPlayers: 8, color: "from-blue-500 to-indigo-600" },
  { icon: Crown,      label: "Bilgelerin Meydanı", desc: "Tarih, felsefe ve derin genel kültür",     gameMode: "QUIZ",   ageGroup: "WISE",  maxPlayers: 6,  color: "from-indigo-600 to-purple-800" },
  { icon: Flame,      label: "Bluff Gecesi",      desc: "Yalan söyle, kandır, kazan! (Fibbage)",     gameMode: "BLUFF",  ageGroup: "ADULT", maxPlayers: 8,  color: "from-violet-500 to-fuchsia-600" },
  { icon: Fingerprint, label: "Casus Avı",        desc: "Aramızdaki casusu kim bulacak?",            gameMode: "SPY",    ageGroup: "ADULT", maxPlayers: 10, color: "from-slate-700 to-black" },
  { icon: Baby,       label: "Süper Çocuklar",    desc: "Küçükler için eğlenceli ve güvenli oyun",   gameMode: "SOCIAL", ageGroup: "CHILD", maxPlayers: 6,  color: "from-cyan-400 to-blue-400" },
  { icon: MessageSquare, label: "Ben Hiç...",    desc: "İtiraflar başlasın! Kimler ne yaptı?",      gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10, color: "from-purple-400 to-indigo-500" },
  { icon: Gamepad2,   label: "Z Kuşağı",         desc: "Trendler, meme'ler ve yeni nesil jargon!",  gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10, color: "from-yellow-300 to-green-400" },
  { icon: MoonStar,   label: "Astroloji",        desc: "Yıldızlar senin için ne diyor? (Spiritüel)", gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-indigo-400 to-purple-600" },
  { icon: Utensils,   label: "Gurme & Mutfak",   desc: "Yemek tutkunları için lezzetli sorular!",   gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-orange-400 to-amber-500" },
  { icon: Settings2,  label: "Özelleştir",        desc: "İstediğin gibi bir oda kur",                gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 4,  color: "from-slate-400 to-slate-600" },
];

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function CreateRoom({ onCreated, onStepChange }: Props) {
  const router = useRouter();
  const { setTheme, setCategoryName: setGlobalCategoryName } = useGameStore();
  const [step,     setStep]    = useState<"template" | "config">("template");
  const [mode,     setMode]   = useState<GameMode>("SOCIAL");
  const [ageGroup, setAge]    = useState<AgeGroup>("ADULT");
  const [maxPlayers, setMax]  = useState(4);
  const [category, setCategory] = useState<string | null>(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState<string | null>(null);
  const [spiceLevel, setSpiceLevel] = useState<"Normal" | "Hot" | "Nuclear">("Normal");
  const [activeTab,  setActiveTab]  = useState<"all" | "social" | "intense" | "quiz">("all");

  const TABS = [
    { id: "all",     label: "Hepsi",     count: TEMPLATES.length - 1 },
    { id: "social",  label: "Sosyal",    count: TEMPLATES.filter(t => t.gameMode === "SOCIAL" || t.gameMode === "BLUFF").length },
    { id: "intense", label: "Rekabet",   count: TEMPLATES.filter(t => t.gameMode === "EXPOSE" || t.gameMode === "SPY").length },
    { id: "quiz",    label: "Yarışma",   count: TEMPLATES.filter(t => t.gameMode === "QUIZ").length },
  ];

  const changeStep = (newStep: "template" | "config") => {
    setStep(newStep);
    onStepChange?.(newStep);
  };

  const isManagedTemplate = category && category !== "Özelleştir";
  const isCustom = !isManagedTemplate;

  const handleSelectTemplate = (tpl: Template) => {
    setError(null);
    setMode(tpl.gameMode);
    setAge(tpl.ageGroup);
    setMax(tpl.maxPlayers);
    setCategory(tpl.label);
    setGlobalCategoryName(tpl.label);

    // Apply theme
    let theme: GameTheme = "purple";
    if (tpl.gameMode === "QUIZ" || tpl.gameMode === "SPY") theme = "intel";
    else if (tpl.gameMode === "EXPOSE" || tpl.gameMode === "BLUFF") theme = "neon";
    else if (tpl.label === "Çift Gecesi") theme = "love";
    else if (tpl.label === "Ofis Kaosu" || tpl.label === "Takım Building") theme = "corporate";
    else if (tpl.label === "Aile Toplantısı" || tpl.label === "Doğum Günü" || tpl.label === "Buz Kıran" || tpl.label === "Süper Çocuklar" || tpl.label === "Nostalji 90'lar" || tpl.label === "Gurme & Mutfak") theme = "warm";
    else if (tpl.label === "Z Kuşağı") theme = "neon";
    else if (tpl.label === "Astroloji") theme = "intel";
    setTheme(theme);

    if (tpl.label === "Çift Gecesi") {
      setSpiceLevel("Normal"); // Başlangıçta normal
    }
    changeStep("config");
  };

  const handleCreate = async (
    finalMode = mode,
    finalAge  = ageGroup,
    finalMax  = maxPlayers,
    finalCategory = category || undefined,
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
          category: (finalCategory === "Özelleştir" || finalMode === "EXPOSE" || finalCategory === "Çift Gecesi") ? `${finalCategory}:${spiceLevel}` : finalCategory
        }),
      });
      if (res.ok) {
        const data = await res.json();
        
        onCreated(data.id, data.code);

        // Reklam mantığını ayır ve bloklamasını engelle
        try {
          const { Capacitor } = await import("@capacitor/core");
          if (Capacitor.isNativePlatform()) {
            const { AdMobService } = await import("@/lib/services/admob.service");
            AdMobService.showInterstitial();
          }
        } catch (adError) {
          console.error("Ad showing failed silently:", adError);
        }
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
    <div className="w-full pb-safe relative">
      <div className="absolute -top-10 right-0 text-[8px] font-black text-white/10 select-none pointer-events-none uppercase">
        Build: v0.4.0-Synced
      </div>
      <AnimatePresence mode="wait">
        {step === "template" ? (
          <motion.div
            key="template-step"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-6"
          >
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit overflow-x-auto no-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                    activeTab === tab.id 
                      ? "bg-accent text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-md text-[8px] font-bold",
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-white/5 text-slate-600"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
              {TEMPLATES.filter(t => {
                if (t.label === "Özelleştir") return true;
                if (activeTab === "all") return true;
                if (activeTab === "social") return t.gameMode === "SOCIAL" || t.gameMode === "BLUFF";
                if (activeTab === "intense") return t.gameMode === "EXPOSE" || t.gameMode === "SPY";
                if (activeTab === "quiz") return t.gameMode === "QUIZ";
                return true;
              }).map((tpl, i) => (
                <motion.button
                  key={tpl.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="group relative flex items-center gap-4 p-4 rounded-[2rem] bg-white/[0.03] border border-white/[0.06] hover:border-accent/40 hover:bg-white/[0.06] transition-all duration-500 text-left overflow-hidden"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-500",
                    tpl.color
                  )}>
                    <tpl.icon className="text-white" size={20} />
                  </div>
                  
                  <div className="flex flex-col gap-0.5 relative z-10">
                    <h3 className="text-[15px] font-black text-white tracking-tight uppercase italic">{tpl.label}</h3>
                    <p className="text-[10px] font-bold text-slate-500 leading-tight pr-4 line-clamp-1 group-hover:text-slate-400 transition-colors uppercase tracking-tighter">
                      {tpl.desc}
                    </p>
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
              onClick={() => {
                changeStep("template");
                setGlobalCategoryName(null);
                setCategory(null);
              }} 
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
 
            <div className="flex flex-col gap-6 fade-up">
              <div className="space-y-4 px-1 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)] animate-pulse" />
                  <p className="text-[11px] font-black text-accent uppercase tracking-[0.4em]">Seçilen Konsept</p>
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">
                    {category || "Özelleştirilmiş"}
                  </h2>
                  
                  <div className="flex gap-2">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-2",
                      mode === "EXPOSE" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                      mode === "QUIZ" ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                      "bg-accent/10 border-accent/20 text-accent"
                    )}>
                      {mode === "EXPOSE" ? <Flame size={12} /> : mode === "QUIZ" ? <Brain size={12} /> : <Users size={12} />}
                      {mode === "SOCIAL" ? "BİRBİRİNİ TANI" : mode === "QUIZ" ? "BİLGİ YARIŞMASI" : "YÜZLEŞME"}
                    </div>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={mode}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "text-[13px] font-bold italic tracking-tight leading-relaxed",
                        mode === "EXPOSE" ? "text-red-400/80" : mode === "QUIZ" ? "text-cyan-400/80" : "text-slate-400"
                      )}
                    >
                      {mode === "EXPOSE" ? "Hazırsan yargı dağıtmaya ve maskeleri düşürmeye başlayalım... 🎭🔥" :
                       mode === "QUIZ" ? "Akıl oyunları başlasın, en zeki olan kazansın! 🧠✨" :
                       "Samimiyet testi zamanı! Gerçekten birbirinizi tanıyor musunuz? 🤝💎"}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {isCustom && (
                <div className="flex flex-col gap-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Oyun Modu</p>
                  <div className="grid grid-cols-2 gap-3">
                  {(["SOCIAL", "QUIZ", "EXPOSE"] as GameMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        if (m === "EXPOSE") setTheme("neon");
                        else if (m === "QUIZ") setTheme("intel");
                        else setTheme("purple");
                      }}
                      className={cn(
                        "flex flex-col items-center gap-3 p-5 rounded-[2.5rem] transition-all duration-500 border relative overflow-hidden group",
                        mode === m 
                          ? m === "EXPOSE" 
                            ? "bg-red-500/15 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)] ring-1 ring-red-500/40"
                            : m === "QUIZ"
                              ? "bg-cyan-500/15 border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.3)] ring-1 ring-cyan-500/40"
                              : "bg-accent/15 border-accent/50 shadow-[0_0_40px_rgba(168,85,247,0.3)] ring-1 ring-accent/40" 
                          : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10"
                      )}
                    >
                      {mode === m && (
                        <motion.div 
                          layoutId="active-mode-glow"
                          className={cn(
                            "absolute inset-0 opacity-20 bg-gradient-to-br",
                            m === "EXPOSE" ? "from-red-600 via-transparent to-orange-600" :
                            m === "QUIZ" ? "from-cyan-600 via-transparent to-blue-600" :
                            "from-accent via-transparent to-fuchsia-600"
                          )}
                        />
                      )}
                      
                      <div className={cn(
                        "w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                        m === "SOCIAL" ? "bg-accent/20 text-accent" : 
                        m === "QUIZ" ? "bg-cyan-500/20 text-cyan-400" : 
                        "bg-red-500/20 text-red-500"
                      )}>
                        {m === "SOCIAL" ? <Users size={22} /> : m === "QUIZ" ? <Brain size={22} /> : <Flame size={22} />}
                      </div>
                      
                      <span className={cn(
                        "text-[11px] font-black tracking-widest uppercase",
                        mode === m ? "text-white" : "text-slate-500"
                      )}>
                        {m === "SOCIAL" ? "Birbirini Tanı" : m === "QUIZ" ? "Bilgi Yarışması" : "Yüzleşme"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              )}
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
              </div>

              {(isCustom || mode === "EXPOSE" || category === "Çift Gecesi") && (
                <div className="flex flex-col gap-4 fade-up [animation-delay:0.3s]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                    Eğlence Dozu <span className="text-[8px] px-1 bg-red-500/10 text-red-500 rounded border border-red-500/20 italic">Yeni</span>
                  </p>
                  <div className="flex gap-2">
                    {[
                      { id: "Normal", label: "Normal", color: "text-blue-400", bg: "bg-blue-400/10" },
                      { id: "Hot", label: "Alevli", color: "text-orange-400", bg: "bg-orange-400/10" },
                      { id: "Nuclear", label: "Nükleer", color: "text-red-500", bg: "bg-red-500/10" }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSpiceLevel(s.id as any)}
                        className={cn(
                          "flex-1 py-3 px-1 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 border flex flex-col items-center gap-1",
                          spiceLevel === s.id 
                            ? `${s.bg} border-current ${s.color} shadow-lg scale-105` 
                            : "bg-white/[0.02] border-white/[0.05] text-slate-500 hover:bg-white/5"
                        )}
                      >
                        <span className={s.color}>{s.label}</span>
                        {spiceLevel === s.id && <motion.div layoutId="spice-dot" className={cn("w-1 h-1 rounded-full", s.bg.replace('/10', ''))} />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-500/60 font-medium px-2 italic">
                    {spiceLevel === "Nuclear" ? "Dikkat: Arkadaşlıklar bitebilir! 🔥💀" : 
                     spiceLevel === "Hot" ? "Isı artıyor, samimiyet dozu yüksek. 🌶️" : 
                     "Sakin ve keyifli bir sosyal deneyim. ✨"}
                  </p>
                </div>
              )}
 
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
