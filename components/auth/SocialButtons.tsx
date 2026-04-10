"use client";

import { motion } from "framer-motion";
import { Globe, Smartphone, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialButtonProps {
  provider: "GOOGLE" | "APPLE" | "GUEST";
  onClick: () => void;
  isLoading?: boolean;
}

export function SocialButtons({ provider, onClick, isLoading }: SocialButtonProps) {
  const configs = {
    GOOGLE: {
      label: "Google ile Devam Et",
      icon: <Globe className="w-5 h-5 text-[#4285F4]" />,
      className: "bg-white text-slate-700 hover:bg-slate-50 border-white/20 shadow-lg",
    },
    APPLE: {
      label: "Apple ile Devam Et",
      icon: <Smartphone className="w-5 h-5 text-white fill-white" />,
      className: "bg-black text-white hover:bg-zinc-900 border-white/10 shadow-lg",
    },
    GUEST: {
      label: "Misafir Olarak Giriş Yap",
      icon: <UserCircle2 className="w-5 h-5 text-white" />,
      className: "bg-gradient-to-br from-slate-600 to-slate-800 text-white hover:from-slate-700 hover:to-slate-900 border-white/5",
    },
  };

  const config = configs[provider];

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-wider transition-all border",
        config.className,
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {config.icon}
          {config.label}
        </>
      )}
    </motion.button>
  );
}
