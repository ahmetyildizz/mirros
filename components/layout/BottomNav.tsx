"use client";

import { motion } from "framer-motion";
import { Gamepad2, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomTab = "play" | "discover" | "profile";

const tabs = [
  { id: "play",     icon: Gamepad2, label: "Oyna"    },
  { id: "discover", icon: Compass,  label: "Keşfet"  },
  { id: "profile",  icon: User,     label: "Profil"  },
] as const;

interface Props {
  active: BottomTab;
  onChange: (tab: BottomTab) => void;
}

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="shrink-0 pb-safe bg-black/80 backdrop-blur-2xl border-t border-white/[0.06]">
      <div className="flex items-center justify-around max-w-[480px] mx-auto h-16 px-4">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-3 -top-px h-0.5 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              >
                <Icon
                  size={22}
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-accent" : "text-slate-600"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider transition-colors duration-200",
                isActive ? "text-accent" : "text-slate-600"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
