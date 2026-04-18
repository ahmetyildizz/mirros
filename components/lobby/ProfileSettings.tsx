"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Edit2, Flame } from "lucide-react";
import { ProfileModal } from "@/components/profile/ProfileModal";

export function ProfileSettings({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpdate = async (newName: string) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newName }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Güncelleme başarısız");
    }

    onRefresh();
  };

  if (!user) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div 
        key="display"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 px-5 py-3 rounded-3xl bg-white/[0.03] border border-white/[0.08] group cursor-pointer hover:bg-white/[0.08] transition-all duration-300 hover:border-accent/40 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center overflow-hidden text-accent shadow-inner group-hover:scale-110 transition-transform duration-500">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <User size={20} />
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-60">
            {user.provider === "GUEST" ? "GUEST HESABI" : "ELİTE ÜYE"}
          </span>
          <span className="text-sm font-black text-white tracking-tight flex items-center gap-2">
            {user.username}
            <Edit2 size={12} className="text-slate-500 group-hover:text-accent transition-colors translate-y-[1px]" />
          </span>
        </div>
        {(user.streak ?? 0) >= 2 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Flame size={12} className="text-orange-500 fill-orange-500" />
            </motion.div>
            <span className="text-[10px] font-black text-orange-400">{user.streak} gün</span>
          </motion.div>
        )}
      </motion.div>

      <ProfileModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
