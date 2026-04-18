"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy, Target, Calendar } from "lucide-react";

interface WelcomeDashboardProps {
  user: any;
}

export function WelcomeDashboard({ user }: WelcomeDashboardProps) {
  if (!user) return null;

  const isNewPlayer = user.gamesPlayed === 0;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          {isNewPlayer ? "Hoş Geldin! 👋" : `Selam, ${user.username}! ✨`}
        </h2>
        <p className="text-[13px] font-bold text-slate-500">
          {isNewPlayer 
            ? "Mirros'a hoş geldin. İlk oyununu başlatmaya hazır mısın?" 
            : "Bugün kimleri şaşırtmaya hazırsın?"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <QuickStat 
          icon={<Trophy size={14} className="text-amber-400" />}
          label="TOPLAM PUAN"
          value={user.totalPoints || 0}
          subLabel="XP"
        />
        <QuickStat 
          icon={<Target size={14} className="text-emerald-400" />}
          label="OYUN SAYISI"
          value={user.gamesPlayed || 0}
          subLabel="Maç"
        />
      </div>

      {isNewPlayer && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-accent/10 border border-accent/20 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-accent">
            <Sparkles size={16} />
            <span className="text-[11px] font-black uppercase tracking-widest">Nasıl Başlarım?</span>
          </div>
          <p className="text-[12px] font-bold text-slate-300 leading-relaxed">
            Hemen bir oda kurup arkadaşlarına kodunu göndererek eğlenceye başlayabilirsin!
          </p>
        </motion.div>
      )}
    </div>
  );
}

function QuickStat({ icon, label, value, subLabel }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
      <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-white">{value}</span>
          <span className="text-[8px] font-black text-slate-500 uppercase">{subLabel}</span>
        </div>
      </div>
    </div>
  );
}
