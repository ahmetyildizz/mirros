"use client";

import { motion } from "framer-motion";
import { User, Edit2, ShieldCheck, Star } from "lucide-react";

interface Props {
  user: any;
  onEdit: () => void;
}

export function ProfileHeader({ user, onEdit }: Props) {
  if (!user) return null;

  const xp = user.totalPoints || 0;
  const level = Math.floor(xp / 100) + 1;
  const progress = (xp % 100);
  
  const getLevelName = (lvl: number) => {
    if (lvl < 5) return "Çaylak Mirros";
    if (lvl < 10) return "Gözlemci";
    if (lvl < 20) return "Usta";
    return "Efsane";
  };

  return (
    <div className="relative pt-6 pb-8 px-5 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Avatar Section */}
        <motion.div 
          onClick={onEdit}
          className="relative group cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-24 h-24 rounded-[2.5rem] bg-black border-2 border-white/10 p-1 relative z-10 group-hover:border-accent transition-colors duration-500 overflow-hidden">
            <div className="w-full h-full rounded-[2rem] bg-white/5 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-slate-600" />
              )}
            </div>
          </div>
          
          {/* Badge */}
          <div className="absolute -bottom-1 -right-1 z-20 w-8 h-8 rounded-full bg-accent flex items-center justify-center border-4 border-black text-black">
            <ShieldCheck size={14} strokeWidth={3} />
          </div>

          {/* Edit Pulse */}
          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>

        {/* User Info */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] italic">
              Level {level}
            </span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              {getLevelName(level)}
            </span>
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
            {user.username}
            <motion.button 
              onClick={onEdit}
              whileHover={{ rotate: 15 }}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <Edit2 size={16} />
            </motion.button>
          </h2>
        </div>

        {/* Progress Bar Container */}
        <div className="mt-8 w-full max-w-[280px]">
          <div className="flex justify-between items-end mb-2 px-1">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sonraki Seviye</span>
              <span className="text-[12px] font-black text-white uppercase italic">
                {level + 1}. Seviye Yolcusu
              </span>
            </div>
            <span className="text-[10px] font-black text-accent italic">
              {progress}%
            </span>
          </div>
          
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-accent/40 via-accent to-accent/40 rounded-full relative shadow-[0_0_10px_var(--accent-glow)]"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            </motion.div>
          </div>
          
          <div className="flex justify-between mt-2 px-1">
            <div className="flex items-center gap-1">
              <Star size={8} className="text-accent fill-accent" />
              <span className="text-[8px] font-black text-slate-500 uppercase">{xp} Toplam XP</span>
            </div>
            <span className="text-[8px] font-black text-slate-600 uppercase">
              {100 - progress} XP KALDI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
