"use client";

import { motion } from "framer-motion";
import { Users, BookOpen, UserSearch, Ghost, GhostIcon, Search, HelpCircle, Heart, Brain, MessageSquare } from "lucide-react";

const MODES = [
  {
    id: "SOCIAL",
    name: "Sosyal",
    tagline: "Beni Tanır mısın?",
    description: "Bir kişi cevaplar, diğerleri onu tahmin eder. En derin sosyal mod!",
    icon: <Heart size={20} className="text-pink-500" />,
    color: "from-pink-500/20 to-pink-500/5",
    border: "border-pink-500/20"
  },
  {
    id: "QUIZ",
    name: "Bilgi",
    tagline: "Genel Kültür",
    description: "Herkes aynı anda yarışır. Kim daha bilgili, kim daha hızlı?",
    icon: <Brain size={20} className="text-blue-500" />,
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/20"
  },
  {
    id: "EXPOSE",
    name: "Dedikodu",
    tagline: "Kimi Seçerdin?",
    description: "\"En çok kim...\" oylaması yapın ve kurbanı belirleyin! Cesaret ister.",
    icon: <Ghost size={20} className="text-purple-500" />,
    color: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/20"
  },
  {
    id: "BLUFF",
    name: "Blöf",
    tagline: "Yalan mı Gerçek mi?",
    description: "Gerçek cevabı sahtelerinden ayırt edebilecek misin? Herkes bir yalan söyler.",
    icon: <MessageSquare size={20} className="text-amber-500" />,
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/20"
  },
  {
    id: "SPY",
    name: "Casus",
    tagline: "Kim Casus?",
    description: "Ortak konuyu bilmeyen casusu bulun. Casussanız belli etmemeye çalışın!",
    icon: <UserSearch size={20} className="text-emerald-500" />,
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20"
  }
];

export function GameGuide() {
  return (
    <div className="w-full flex flex-col gap-5 py-6">
      <div className="flex items-center gap-3 px-1">
        <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
          <BookOpen size={16} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Nasıl Oynanır?</h2>
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Oyun Modlarını Keşfet</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {MODES.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group relative p-4 rounded-3xl bg-gradient-to-br ${mode.color} border ${mode.border} overflow-hidden transition-all hover:scale-[1.02]`}
          >
            <div className="flex gap-4 items-start relative z-10">
              <div className="mt-1 group-hover:rotate-12 transition-transform duration-500">
                {mode.icon}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-black text-white tracking-tight">{mode.name}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[10px] font-bold text-slate-400 italic">{mode.tagline}</span>
                </div>
                <p className="text-[12px] font-medium text-slate-300 leading-relaxed pr-8">
                  {mode.description}
                </p>
              </div>
            </div>
            
            <div className="absolute -bottom-2 -right-2 opacity-[0.03] rotate-[-12deg] group-hover:scale-125 transition-transform duration-700">
              {mode.icon}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
