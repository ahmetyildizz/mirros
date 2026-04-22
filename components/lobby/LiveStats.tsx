"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Users, Layout, Hash, MessageCircle } from "lucide-react";

function CountingNumber({ value }: { value: number }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export function LiveStats() {
  const [stats, setStats] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStats = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/stats/live");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats error", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 2000);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 30 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="w-full flex flex-col gap-5">
      <header className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-emerald-500 ${isSyncing ? "animate-ping" : "animate-pulse"}`} />
          <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">Live Network Stats</span>
        </div>
        <AnimatePresence>
          {isSyncing && (
            <motion.span
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-[8px] font-black text-slate-500 uppercase tracking-widest"
            >
              Syncing...
            </motion.span>
          )}
        </AnimatePresence>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icon={<Layout size={16} />} 
          label="Aktif Oda" 
          value={stats.activeRooms} 
          color="bg-purple-500/20 text-purple-400" 
        />
        <StatCard 
          icon={<Users size={16} />} 
          label="Oyuncular" 
          value={stats.activePlayers} 
          color="bg-blue-500/20 text-blue-400" 
        />
        <StatCard 
          icon={<MessageCircle size={16} />} 
          label="Topl. Yanıt" 
          value={stats.totalAnswers} 
          color="bg-pink-500/20 text-pink-400" 
          fullWidth
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-1 px-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
          <Hash size={10} className="text-amber-500" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kategoriler</span>
          <span className="text-[10px] font-black text-white">{stats.totalCategories}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, fullWidth }: any) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={`flex flex-col gap-2 p-5 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] group transition-all hover:bg-white/[0.06] hover:border-white/[0.15] ${fullWidth ? "col-span-2" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
          {icon}
        </div>
        <span className="text-2xl font-black text-white tracking-tighter italic">
          <CountingNumber value={value} />
        </span>
      </div>
      <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1 pr-2">{label}</span>
      
      {/* Decorative Line */}
      <div className={`h-1 w-8 rounded-full ${color.split(' ')[1]} opacity-20 group-hover:w-16 transition-all duration-700`} />
    </motion.div>
  );
}
