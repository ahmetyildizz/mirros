"use client";

import { motion } from "framer-motion";
import { Users, BookOpen, UserSearch, Ghost, GhostIcon, Search, HelpCircle, Heart, Brain, MessageSquare } from "lucide-react";

const MODES = [
  {
    id: "SOCIAL",
    name: "Sosyal",
    tagline: "Beni Tanır mısın?",
    description: "Bir kişi cevaplar, diğerleri onu tahmin eder. En derin sosyal mod! Sırlarını paylaşmaya hazır mısın?",
    badge: "SAMİMİYET",
    icon: <Heart size={20} className="text-pink-500" />,
    color: "from-pink-500/20 to-pink-500/5",
    border: "border-pink-500/20"
  },
  {
    id: "QUIZ",
    name: "Bilgi",
    tagline: "Genel Kültür",
    description: "Herkes aynı anda yarışır. Kim daha bilgili, kim daha hızlı? Şampiyonluk unvanı el değiştirebilir!",
    badge: "REKABET",
    icon: <Brain size={20} className="text-blue-500" />,
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/20"
  },
  {
    id: "EXPOSE",
    name: "Dedikodu",
    tagline: "Maskeler Düşüyor",
    description: "\"En çok kim...\" oylaması yapın ve kurbanı belirleyin! Arkadaşlığınızı test etmeye hazır olun.",
    badge: "KAOS",
    icon: <Ghost size={20} className="text-purple-500" />,
    color: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/20"
  },
  {
    id: "BLUFF",
    name: "Blöf",
    tagline: "Yalan mı Gerçek mi?",
    description: "Gerçek cevabı sahtelerinden ayırt edebilecek misin? Herkes bir yalan söyler, sadece en iyi yalancı kazanır.",
    badge: "YARATICILIK",
    icon: <MessageSquare size={20} className="text-amber-500" />,
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/20"
  },
  {
    id: "SPY",
    name: "Casus",
    tagline: "Kim Casus?",
    description: "Ortak konuyu bilmeyen casusu bulun! Bir casus gibi davran ya da casusu ilk sen deşifre et.",
    badge: "STRATEJİ",
    icon: <UserSearch size={20} className="text-emerald-500" />,
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20"
  }
];

export function GameGuide() {
  return (
    <div className="w-full flex flex-col gap-6 py-8">
      <div className="flex items-center gap-4 px-1">
        <div className="w-10 h-10 rounded-[1.25rem] bg-accent/20 flex items-center justify-center text-accent shadow-inner">
          <BookOpen size={18} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Nasıl Oynanır?</h2>
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase opacity-60">Oyun Modlarını Keşfet</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {MODES.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative p-5 rounded-[2rem] bg-gradient-to-br ${mode.color} border ${mode.border} overflow-hidden transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/20`}
          >
            <div className="flex gap-5 items-start relative z-10">
              <div className="mt-1.5 group-hover:rotate-12 transition-transform duration-500 bg-black/20 p-3 rounded-2xl backdrop-blur-sm">
                {mode.icon}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-[16px] font-black text-white tracking-tight leading-none">{mode.name}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700/50" />
                  <span className="text-[10px] font-bold text-slate-400 italic tracking-tighter">{mode.tagline}</span>
                </div>
                
                <p className="text-[12px] font-medium text-slate-300 leading-relaxed pr-6 opacity-80 group-hover:opacity-100 transition-opacity">
                  {mode.description}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-black text-white/40 bg-white/5 px-2 py-1 rounded-lg border border-white/5 tracking-widest uppercase">
                    {mode.badge}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 opacity-[0.04] rotate-[-15deg] group-hover:scale-150 transition-transform duration-1000">
               <div className="scale-[5]">
                {mode.icon}
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
