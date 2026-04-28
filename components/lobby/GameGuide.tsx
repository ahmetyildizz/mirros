"use client";

import { motion } from "framer-motion";
import { Users, UserSearch, Ghost, Heart, Brain, MessageSquare, ChevronRight, Layers } from "lucide-react";

type ModeId = "SOCIAL" | "QUIZ" | "EXPOSE" | "BLUFF" | "SPY";

const MODES: {
  id: ModeId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  meta: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  accentColor: string;
}[] = [
  {
    id: "SOCIAL",
    name: "Sosyal",
    tagline: "Beni Tanır mısın?",
    description: "Bir kişi cevaplar, diğerleri onu tahmin eder. En derin sosyal mod! Sırlarını paylaşmaya hazır mısın?",
    badge: "SAMİMİYET",
    meta: "2-12 kişi · 20-40 dk",
    icon: <Heart size={20} className="text-pink-500" />,
    color: "from-pink-500/20 to-pink-500/5",
    border: "border-pink-500/20",
    accentColor: "text-pink-400",
  },
  {
    id: "QUIZ",
    name: "Bilgi",
    tagline: "Genel Kültür",
    description: "Herkes aynı anda yarışır. Kim daha bilgili, kim daha hızlı? Şampiyonluk unvanı el değiştirebilir!",
    badge: "REKABET",
    meta: "2-12 kişi · 15-30 dk",
    icon: <Brain size={20} className="text-blue-500" />,
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/20",
    accentColor: "text-blue-400",
  },
  {
    id: "EXPOSE",
    name: "Dedikodu",
    tagline: "Maskeler Düşüyor",
    description: "\"En çok kim...\" oylaması yapın ve sonucu açıklayın! Arkadaşlığınızı test etmeye hazır olun.",
    badge: "KAOS",
    meta: "3-12 kişi · 20-30 dk",
    icon: <Ghost size={20} className="text-purple-500" />,
    color: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/20",
    accentColor: "text-purple-400",
  },
  {
    id: "BLUFF",
    name: "Blöf",
    tagline: "Yalan mı Gerçek mi?",
    description: "Gerçek cevabı sahtelerinden ayırt edebilecek misin? Herkes bir yalan söyler, en iyi yalancı kazanır.",
    badge: "YARATICILIK",
    meta: "3-12 kişi · 20-30 dk",
    icon: <MessageSquare size={20} className="text-amber-500" />,
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/20",
    accentColor: "text-amber-400",
  },
  {
    id: "SPY",
    name: "Casus",
    tagline: "Kim Casus?",
    description: "Ortak konuyu bilmeyen casusu bulun! Bir casus gibi davran ya da casusu ilk sen deşifre et.",
    badge: "STRATEJİ",
    meta: "3-12 kişi · 15-25 dk",
    icon: <UserSearch size={20} className="text-emerald-500" />,
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20",
    accentColor: "text-emerald-400",
  },
];

interface Props {
  onModeSelect: (modeId: ModeId) => void;
}

export function GameGuide({ onModeSelect }: Props) {
  return (
    <div className="w-full flex flex-col gap-6 py-8">
      <div className="flex items-center gap-4 px-1">
        <div className="w-10 h-10 rounded-[1.25rem] bg-accent/20 flex items-center justify-center text-accent shadow-inner">
          <Layers size={18} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Oyun Modları</h2>
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase opacity-60">Bir mod seç, hemen oyna</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {MODES.map((mode, index) => (
          <motion.button
            key={mode.id}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onModeSelect(mode.id)}
            className={`group relative w-full text-left p-5 rounded-[2rem] bg-gradient-to-br ${mode.color} border ${mode.border} overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20 active:scale-[0.98]`}
          >
            <div className="flex gap-4 items-start relative z-10">
              <div className="mt-1 shrink-0 group-hover:rotate-12 transition-transform duration-500 bg-black/20 p-3 rounded-2xl backdrop-blur-sm">
                {mode.icon}
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[16px] font-black text-white tracking-tight leading-none">{mode.name}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700/50 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 italic tracking-tighter">{mode.tagline}</span>
                </div>

                <p className="text-[12px] font-medium text-slate-300 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity pr-6">
                  {mode.description}
                </p>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[8px] font-black text-white/40 bg-white/5 px-2 py-1 rounded-lg border border-white/5 tracking-widest uppercase">
                    {mode.badge}
                  </span>
                  <span className={`text-[9px] font-bold ${mode.accentColor} opacity-60`}>
                    {mode.meta}
                  </span>
                </div>
              </div>

              {/* Affordance arrow */}
              <div className="shrink-0 self-center opacity-30 group-hover:opacity-80 group-hover:translate-x-1 transition-all duration-300">
                <ChevronRight size={18} className="text-white" />
              </div>
            </div>

            {/* Background icon decoration */}
            <div className="absolute -bottom-4 -right-4 opacity-[0.04] rotate-[-15deg] group-hover:scale-150 transition-transform duration-1000">
              <div className="scale-[5]">{mode.icon}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
