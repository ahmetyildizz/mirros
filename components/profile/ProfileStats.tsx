"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Flame, Medal } from "lucide-react";

interface Props {
  user: any;
}

export function ProfileStats({ user }: Props) {
  if (!user) return null;

  const stats = [
    {
      label: "Toplam Puan",
      value: user.totalPoints || 0,
      suffix: "XP",
      icon: <Trophy size={18} />,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      delay: 0.1,
    },
    {
      label: "Oyun Sayısı",
      value: user.gamesPlayed || 0,
      suffix: "Maç",
      icon: <Target size={18} />,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      delay: 0.2,
    },
    {
      label: "Mevcut Seri",
      value: user.streak || 0,
      suffix: "Gün",
      icon: <Flame size={18} />,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      delay: 0.3,
    },
    {
      label: "En İyi Seri",
      value: user.longestStreak || 0,
      suffix: "Gün",
      icon: <Medal size={18} />,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      delay: 0.4,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-5">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: stat.delay }}
          whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.06)" }}
          className="p-4 rounded-[2rem] bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl transition-all relative overflow-hidden group"
        >
          <div className="flex flex-col gap-3 relative z-10">
            <div className={`w-10 h-10 rounded-[1.25rem] ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-500 group-hover:rotate-[360deg]`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white italic tracking-tighter leading-none">
                  {stat.value}
                </span>
                <span className="text-[10px] font-black text-slate-600 uppercase italic">
                  {stat.suffix}
                </span>
              </div>
            </div>
          </div>
          
          {/* Subtle Accent Glow */}
          <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} blur-[40px] opacity-20 -mr-10 -mt-10 group-hover:opacity-40 transition-opacity`} />
        </motion.div>
      ))}
    </div>
  );
}
