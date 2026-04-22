"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  total: number;
  current: number;
}

export function RoundIndicator({ total, current }: Props) {
  return (
    <div className="flex gap-2 items-center justify-center py-4 relative">
      {/* Connector Line */}
      <div className="absolute h-[1px] bg-white/5 left-1/2 -translate-x-1/2 w-full max-w-[120px] top-1/2 z-0" />
      
      {Array.from({ length: total }).map((_, i) => {
        const isPast = i < current - 1;
        const isCurrent = i === current - 1;
        
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{ 
              scale: isCurrent ? 1.2 : 1,
              backgroundColor: isCurrent ? "var(--accent)" : isPast ? "#ffffff20" : "#ffffff08"
            }}
            className={cn(
              "w-2 h-2 rounded-full relative z-10 transition-colors duration-500",
              isCurrent && "shadow-[0_0_12px_var(--accent-glow)] ring-2 ring-accent/20"
            )}
          >
            {isCurrent && (
               <motion.div 
                 layoutId="current-round-pulse"
                 className="absolute inset-[-4px] rounded-full border border-accent/40 animate-ping" 
               />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
