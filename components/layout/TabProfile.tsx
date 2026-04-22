"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { LogOut, ChevronRight } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { PersonalityBadges } from "@/components/profile/PersonalityBadges";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { CURRENT_VERSION } from "@/lib/version-config";

interface Props {
  user: any;
  onRefresh: () => void;
  onVersionClick: () => void;
}

export function TabProfile({ user, onRefresh, onVersionClick }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpdateProfile = async (data: { username?: string, avatarUrl?: string }) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Güncelleme başarısız");
    }

    onRefresh();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl">
      {/* Top Section */}
      <ProfileHeader user={user} onEdit={() => setIsModalOpen(true)} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto scrollbar-none flex flex-col gap-8 pb-32"
      >
        <motion.div variants={itemVariants}>
          <ProfileStats user={user} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <PersonalityBadges />
        </motion.div>

        {/* Account Actions Section */}
        <motion.div variants={itemVariants} className="px-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 bg-accent rounded-full" />
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest italic">Hesap Ayarları</h3>
          </div>
          
          <button 
            type="button"
            className="w-full h-16 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.05] flex items-center justify-between px-6 group active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                <LogOut size={18} />
              </div>
              <span className="text-sm font-black text-slate-300 group-hover:text-white transition-colors">Oturumu Kapat</span>
            </div>
            <ChevronRight size={18} className="text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            type="button"
            onClick={onVersionClick}
            className="flex items-center justify-center gap-2 py-4 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.03] hover:border-accent/10 transition-all opacity-60 hover:opacity-100"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic pointer-events-none">
              Mirros {CURRENT_VERSION}
            </span>
          </button>
        </motion.div>
      </motion.div>

      <ProfileModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onUpdate={handleUpdateProfile}
      />
    </div>
  );
}
