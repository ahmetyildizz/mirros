"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Layout, Hash } from "lucide-react";

export function LiveStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats/live")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Stats error", err));
  }, []);

  if (!stats) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">Canlı İstatistikler</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          icon={<Layout size={14} />} 
          label="ODALAR" 
          value={stats.activeRooms} 
          color="bg-purple-500/20 text-purple-400" 
        />
        <StatCard 
          icon={<Users size={14} />} 
          label="OYUNCULAR" 
          value={stats.activePlayers} 
          color="bg-blue-500/20 text-blue-400" 
        />
        <StatCard 
          icon={<Hash size={14} />} 
          label="KATEGORİLER" 
          value={stats.totalCategories} 
          color="bg-amber-500/20 text-amber-400" 
        />
      </div>

      {stats.categoryDistribution?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1 px-1">
          {stats.categoryDistribution.slice(0, 3).map((c: any) => (
            <div 
              key={c.name}
              className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center gap-2"
            >
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.name}</span>
              <span className="text-[9px] font-black text-accent">{c.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] items-center text-center group transition-all hover:bg-white/[0.06] hover:border-white/[0.15]"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[18px] font-black text-white leading-none">{value}</span>
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">{label}</span>
      </div>
    </motion.div>
  );
}
