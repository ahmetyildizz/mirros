"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users2 } from "lucide-react";
import { useSocialStore } from "@/store/social.store";

interface Friend {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export function OnlineFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const onlineUsers = useSocialStore((s) => s.onlineUsers);

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFriends(data);
      })
      .catch(() => {});
  }, []);

  const onlineFriends = friends.filter((f) => onlineUsers.includes(f.id));
  const offlineFriends = friends.filter((f) => !onlineUsers.includes(f.id)).slice(0, 3);

  if (friends.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Users2 size={14} className="text-accent" />
          <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Arkadaşların</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">
            {onlineFriends.length} çevrimiçi
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {onlineFriends.length === 0 && (
          <div className="px-5 py-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[11px] text-slate-500 font-bold">Şu an çevrimiçi arkadaşın yok</p>
          </div>
        )}

        {onlineFriends.map((friend, i) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 px-4 py-3 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/15"
          >
            <div className="relative">
              <Avatar username={friend.username} avatarUrl={friend.avatarUrl} size="sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
            </div>
            <span className="text-[13px] font-black text-white tracking-tight">{friend.username}</span>
            <span className="ml-auto text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Çevrimiçi</span>
          </motion.div>
        ))}

        {offlineFriends.map((friend, i) => (
          <div
            key={friend.id}
            className="flex items-center gap-3 px-4 py-3 rounded-[1.5rem] bg-white/[0.02] border border-white/5 opacity-40"
          >
            <div className="relative">
              <Avatar username={friend.username} avatarUrl={friend.avatarUrl} size="sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-600 border-2 border-black" />
            </div>
            <span className="text-[13px] font-black text-slate-400 tracking-tight">{friend.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Avatar({ username, avatarUrl, size }: { username: string; avatarUrl: string | null; size: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-[13px]";
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} className={`${dim} rounded-full object-cover`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-accent/20 flex items-center justify-center font-black text-accent`}>
      {username.charAt(0).toUpperCase()}
    </div>
  );
}
