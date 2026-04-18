"use client";

import { motion } from "framer-motion";
import { ProfileSettings } from "@/components/lobby/ProfileSettings";
import { WelcomeDashboard } from "@/components/lobby/WelcomeDashboard";
import { CURRENT_VERSION } from "@/lib/version-config";

interface Props {
  user: any;
  onRefresh: () => void;
  onVersionClick: () => void;
}

export function TabProfile({ user, onRefresh, onVersionClick }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-5 pt-8 pb-4">
        <h2 className="text-2xl font-black text-white tracking-tight">Profil</h2>
        <p className="text-[12px] text-slate-500 font-bold mt-0.5">Hesabın ve istatistiklerin</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-6 flex flex-col gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <ProfileSettings user={user} onRefresh={onRefresh} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <WelcomeDashboard user={user} />
        </motion.div>

        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onVersionClick}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-accent/30 transition-all group"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse group-hover:bg-accent" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-accent transition-colors">
            {CURRENT_VERSION}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
