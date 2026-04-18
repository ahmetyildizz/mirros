"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { DailyWidget } from "@/components/lobby/DailyWidget";
import { LiveStats } from "@/components/lobby/LiveStats";
import { GameGuide } from "@/components/lobby/GameGuide";
import { AdBanner } from "@/components/shared/AdBanner";

interface Props {
  onDailyAnswered: (v: boolean) => void;
}

export function TabDiscover({ onDailyAnswered }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-5 pt-8 pb-4">
        <h2 className="text-2xl font-black text-white tracking-tight">Keşfet</h2>
        <p className="text-[12px] text-slate-500 font-bold mt-0.5">Günlük sorular, istatistikler ve rehber</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-6 flex flex-col gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <DailyWidget onAnsweredStatus={onDailyAnswered} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <LiveStats />
        </motion.div>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => router.push("/packs")}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl glass-card border border-white/8 hover:border-accent/30 hover:bg-accent/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Package size={20} className="text-accent" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-black text-white">Soru Paketleri</p>
              <p className="text-[11px] text-slate-500 font-bold">Farklı kategorileri keşfet</p>
            </div>
          </div>
          <span className="text-slate-600 group-hover:text-accent transition-colors text-lg">›</span>
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GameGuide />
        </motion.div>

        <AdBanner type="lobby" />
      </div>
    </div>
  );
}
