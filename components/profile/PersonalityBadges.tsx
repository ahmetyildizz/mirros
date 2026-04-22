"use client";

import { motion } from "framer-motion";
import { Sparkles, Ghost, Heart, Zap, Coffee } from "lucide-react";

export function PersonalityBadges() {
  const badges = [
    { name: "Kaos Elçisi", icon: <Zap size={14} />, color: "bg-purple-500", label: "Tahmin Ustası" },
    { name: "Gözlemci", icon: <Ghost size={14} />, color: "bg-blue-500", label: "Sessiz Atak" },
    { name: "Samimi", icon: <Heart size={14} />, color: "bg-rose-500", label: "Yüksek Uyum" },
    { name: "Chill", icon: <Coffee size={14} />, color: "bg-emerald-500", label: "Sabırlı" },
  ];

  return (
    <div className="flex flex-col gap-4 px-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <h3 className="text-[12px] font-black text-white uppercase tracking-widest italic">Karakter Kartları</h3>
        </div>
        <span className="text-[9px] font-black text-slate-600 uppercase">Tümünü Gör</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
        {badges.map((badge, idx) => (
          <motion.div
            key={badge.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0 w-32 p-4 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] flex flex-col items-center gap-3 relative overflow-hidden group"
          >
            <div className={`w-12 h-12 rounded-full ${badge.color} flex items-center justify-center text-white shadow-lg shadow-black/40 group-hover:scale-110 transition-transform`}>
              {badge.icon}
            </div>
            <div className="text-center">
              <p className="text-[11px] font-black text-white uppercase tracking-tight italic">{badge.name}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{badge.label}</p>
            </div>
            
            {/* Background Glow */}
            <div className={`absolute inset-0 ${badge.color} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
