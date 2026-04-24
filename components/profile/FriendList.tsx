"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, Check, X, Search, Send, User } from "lucide-react";
import { useSocialStore } from "@/store/social.store";
import { cn } from "@/lib/utils";

export function FriendList() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "idle">("idle");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const [fRes, rRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests")
      ]);
      if (fRes.ok) setFriends(await fRes.json());
      if (rRes.ok) setRequests(await rRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendRequest = async () => {
    if (!searchQuery.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        body: JSON.stringify({ friendUsername: searchQuery.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("İstek gönderildi!");
      setSearchQuery("");
      setTimeout(() => setMessage(""), 3000);
    } catch (e: any) {
      setMessage(e.message);
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setStatus("idle");
    }
  };

  const handleRequestResponse = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await fetch(`/api/friends/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const { onlineUsers } = useSocialStore();

  return (
    <div className="px-5 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-accent rounded-full" />
          <h3 className="text-[11px] font-black text-white uppercase tracking-widest italic">Arkadaşlar</h3>
        </div>
        {requests.length > 0 && (
          <span className="bg-accent text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
            {requests.length} YENİ
          </span>
        )}
      </div>

      <div className="relative group">
        <input 
          type="text"
          placeholder="Kullanıcı adı ile ara..."
          className="w-full h-14 rounded-2xl bg-white/[0.03] border border-white/5 pl-12 pr-14 text-sm font-bold text-white outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <button 
          onClick={handleSendRequest}
          disabled={status === "loading" || !searchQuery.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center hover:bg-accent/30 active:scale-90 transition-all disabled:opacity-30"
        >
          <UserPlus size={18} />
        </button>
      </div>
      
      {message && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-accent px-2">
          {message}
        </motion.p>
      )}

      <AnimatePresence>
        {requests.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider pl-1">Bekleyen İstekler</span>
            {requests.map(req => (
              <div key={req.id} className="h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-black text-white">{req.requester.username}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRequestResponse(req.id, "ACCEPTED")} className="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500/30 transition-all">
                    <Check size={16} />
                  </button>
                  <button onClick={() => handleRequestResponse(req.id, "REJECTED")} className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/30 transition-all">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        {friends.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center opacity-30">
            <Users size={32} className="mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Henüz arkadaşın yok</span>
          </div>
        ) : (
          friends.map(friend => {
            const isOnline = onlineUsers.includes(friend.id);
            return (
              <div key={friend.id} className="h-16 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] flex items-center justify-between px-5 hover:bg-white/[0.04] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center">
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-black text-white/20">{friend.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900",
                      isOnline ? "bg-green-500" : "bg-slate-700"
                    )} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-200 group-hover:text-white transition-colors">{friend.username}</span>
                    <span className={cn(
                       "text-[9px] font-black uppercase tracking-widest italic",
                       isOnline ? "text-green-500/60" : "text-slate-600"
                    )}>
                      {isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                    </span>
                  </div>
                </div>
                <button 
                  title="Odaya Davet Et"
                  className="w-10 h-10 rounded-xl bg-white/[0.05] text-slate-500 flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-all active:scale-90"
                >
                  <Send size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
