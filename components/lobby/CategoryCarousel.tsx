"use client";

import { motion } from "framer-motion";
import { TEMPLATES, type Template } from "@/lib/constants/templates";
import { cn } from "@/lib/utils";
import { ArrowRight, Flame } from "lucide-react";

interface Props {
  onSelect: (tpl: Template) => void;
}

export function CategoryCarousel({ onSelect }: Props) {
  // Show a subset for the carousel or all of them
  const featured = TEMPLATES.filter(t => 
    ["Astroloji", "Z Kuşağı", "Nostalji 90'lar", "Sinema & Dizi", "Gurme & Mutfak", "Casus Avı"].includes(t.label)
  );

  return (
    <div className="w-full flex flex-col gap-4 py-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-500 animate-pulse" />
          <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Popüler Kategoriler</h3>
        </div>
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Tümünü Gör</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar snap-x snap-mandatory">
        {featured.map((tpl, i) => (
          <motion.button
            key={tpl.label}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(tpl)}
            className="flex-shrink-0 w-[240px] h-[140px] rounded-[2rem] p-5 relative overflow-hidden group snap-center border border-white/5"
          >
            {/* Background Gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-20 group-hover:opacity-30",
              tpl.color
            )} />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500",
                )}>
                  <tpl.icon className="text-white" size={18} />
                </div>
                <div className="px-2 py-1 rounded-lg bg-black/20 backdrop-blur-md border border-white/5 text-[8px] font-black text-white/60 tracking-widest uppercase">
                  {tpl.gameMode}
                </div>
              </div>

              <div className="flex flex-col">
                <h4 className="text-[16px] font-black text-white tracking-tight leading-tight group-hover:text-accent transition-colors">
                  {tpl.label}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 line-clamp-1 mt-1 group-hover:text-slate-300 transition-colors">
                  {tpl.desc}
                </p>
              </div>
            </div>

            {/* Hover Action Indicator */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
               <ArrowRight size={14} className="text-white" />
            </div>
            
            {/* Ambient Glow */}
            <div className={cn(
               "absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br",
               tpl.color
            )} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
