"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  type?: "lobby" | "results";
  className?: string;
}

export function AdBanner({ type = "lobby", className }: AdBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative w-full overflow-hidden transition-all duration-500",
        type === "lobby" 
          ? "max-w-[420px] mx-auto mt-4" 
          : "max-w-full my-6",
        className
      )}
    >
      {/* Premium Glass Container */}
      <div className={cn(
        "relative rounded-[1.5rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-md px-4 py-8 flex flex-col items-center justify-center min-h-[100px] group",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 group-hover:before:opacity-100 before:transition-opacity"
      )}>
        {/* Placeholder Content (To be replaced by real AdSense/AdMob script) */}
        <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
          <div className="w-8 h-8 rounded-full border border-dashed border-white/40 flex items-center justify-center">
            <span className="text-[10px] font-black tracking-tighter">AD</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Reklam Alanı</span>
        </div>

        {/* Info Icon */}
        <div className="absolute top-2 right-2 opacity-10 hover:opacity-50 transition-opacity cursor-help">
          <Info size={10} className="text-white" />
        </div>

        {/* Glow Effect */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      </div>
      
      <p className="text-center text-[8px] font-black text-slate-700 mt-1.5 uppercase tracking-[0.2em] opacity-40">
        Destekçi Sponsor
      </p>
    </motion.div>
  );
}
