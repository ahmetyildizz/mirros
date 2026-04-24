"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, Loader2, Search } from "lucide-react";
import { useSocialStore } from "@/store/social.store";
import { cn } from "@/lib/utils";

interface Props {
  roomId: string;
  onClose: () => void;
}

export function InviteFriendsModal({ roomId, onClose }: Props) {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/friends")
      .then(r => r.json())
      .then(data => {
        setFriends(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleInvite = async (friendId: string) => {
    setInviting(friendId);
    try {
      const res = await fetch(`/api/rooms/${roomId}/invite`, {
        method: "POST",
        body: JSON.stringify({ receiverId: friendId })
      });
      if (res.ok) {
        // Başarılı toast eklenebilir
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setInviting(null), 1000);
    }
  };

  const { onlineUsers } = useSocialStore();

  const filteredFriends = friends.filter(f => 
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
    >
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-[400px] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 pb-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-xl font-black text-white italic tracking-tight">Arkadaşlarını Davet Et</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Odanın davetini gönder</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <input 
              type="text"
              placeholder="Arkadaşlarını ara..."
              className="w-full h-12 rounded-xl bg-white/[0.03] border border-white/5 pl-10 pr-4 text-sm font-bold text-white outline-none focus:border-accent/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
          </div>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto scrollbar-none">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
            ) : filteredFriends.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center opacity-20">
                <User size={32} className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Hiç arkadaşın yok :(</span>
              </div>
            ) : (
              filteredFriends.map(friend => {
                const isOnline = onlineUsers.includes(friend.id);
                return (
                  <div key={friend.id} className="h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between px-4 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent overflow-hidden">
                          {friend.avatarUrl ? (
                             <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                             <User size={18} />
                          )}
                        </div>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black",
                          isOnline ? "bg-green-500" : "bg-slate-600"
                        )} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white">{friend.username}</span>
                        <span className={cn(
                           "text-[9px] font-black uppercase tracking-tighter",
                           isOnline ? "text-green-500/60" : "text-slate-600"
                        )}>
                          {isOnline ? "ÇEVRİMİÇİ" : "ÇEVRİMDAŞI"}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleInvite(friend.id)}
                      disabled={inviting === friend.id}
                      className={cn(
                        "h-9 px-4 rounded-xl text-[11px] font-black uppercase transition-all disabled:opacity-50",
                        isOnline ? "bg-accent/20 text-accent hover:bg-accent hover:text-white" : "bg-white/5 text-slate-500 opacity-50"
                      )}
                    >
                      {inviting === friend.id ? <Loader2 size={14} className="animate-spin" /> : "DAVET ET"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
