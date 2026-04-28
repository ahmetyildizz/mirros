"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Package, Sparkles } from "lucide-react";
import { DailyWidget } from "@/components/lobby/DailyWidget";
import { GameGuide } from "@/components/lobby/GameGuide";
import { AdBanner } from "@/components/shared/AdBanner";
import { ExploreHeader } from "@/components/lobby/ExploreHeader";
import { CategoryCarousel } from "@/components/lobby/CategoryCarousel";
import { OnlineFriends } from "@/components/lobby/OnlineFriends";
import type { Template } from "@/lib/constants/templates";

type ModeId = "SOCIAL" | "QUIZ" | "EXPOSE" | "BLUFF" | "SPY";

interface Props {
  user: any;
  onDailyAnswered: (v: boolean) => void;
  onModeSelect: (modeId: ModeId) => void;
  onTemplateSelect: (tpl: Template) => void;
  onRandomPlay: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function TabDiscover({ user, onDailyAnswered, onModeSelect, onTemplateSelect, onRandomPlay }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl">
      <ExploreHeader user={user} onRandomPlay={onRandomPlay} />

      <motion.div
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto scrollbar-none px-5 pb-24 flex flex-col gap-6"
      >
        {/* 1. Günün sorusu — ilk kanca */}
        <motion.div variants={itemVariants}>
          <DailyWidget onAnsweredStatus={onDailyAnswered} />
        </motion.div>

        {/* 2. Oyun modları — aksiyona yönlendir */}
        <motion.div variants={itemVariants}>
          <GameGuide onModeSelect={onModeSelect} />
        </motion.div>

        {/* 3. Popüler kategoriler — şimdi fonksiyonel */}
        <motion.div variants={itemVariants}>
          <CategoryCarousel onSelect={onTemplateSelect} />
        </motion.div>

        {/* 4. Tüm paketler */}
        <motion.div variants={itemVariants}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/packs")}
            className="w-full flex items-center justify-between px-6 py-5 rounded-[2rem] glass-card border border-white/5 hover:border-accent/30 hover:bg-accent/5 transition-all group overflow-hidden relative"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-[1.25rem] bg-accent/10 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-500">
                <Package size={22} className="text-accent" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-black text-white uppercase tracking-tight">Tüm Soru Paketleri</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Premium içerikleri keşfet</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center relative z-10">
              <Sparkles size={16} className="text-slate-600 group-hover:text-accent transition-colors" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </motion.button>
        </motion.div>

        {/* 5. Çevrimiçi arkadaşlar */}
        <motion.div variants={itemVariants}>
          <OnlineFriends />
        </motion.div>

        {/* 6. Reklam */}
        <motion.div variants={itemVariants} className="pt-2">
          <AdBanner type="lobby" />
        </motion.div>
      </motion.div>
    </div>
  );
}
