"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Edit2, Check, X, Loader2 } from "lucide-react";

export function ProfileSettings() {
  const [username, setUsername] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(data => {
        setUsername(data.username);
        setNewName(data.username);
      });
  }, []);

  const handleUpdate = async () => {
    if (!newName || newName === username) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newName }),
      });

      const data = await res.json();

      if (res.ok) {
        setUsername(data.username);
        setIsEditing(false);
      } else {
        setError(data.error || "Güncelleme başarısız");
      }
    } catch (e) {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div 
            key="display"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-4 px-5 py-3 rounded-3xl bg-white/[0.03] border border-white/[0.08] group cursor-pointer hover:bg-white/[0.08] transition-all duration-300 hover:border-accent/40 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]"
            onClick={() => setIsEditing(true)}
          >
            <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-inner group-hover:scale-110 transition-transform duration-500">
              <User size={20} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-60">Seni Tanıyoruz</span>
              <span className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                {username || "Misafir"}
                <Edit2 size={12} className="text-slate-500 group-hover:text-accent transition-colors translate-y-[1px]" />
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-2 w-full max-w-[240px]"
          >
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                onKeyDownCapture={(e) => e.key === "Escape" && setIsEditing(false)}
                className="w-full bg-white/5 border border-accent/30 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 ring-accent/20 transition-all"
                placeholder="Yeni kullanıcı adı..."
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {loading ? (
                  <Loader2 size={14} className="animate-spin text-accent" />
                ) : (
                  <>
                    <button onClick={handleUpdate} className="p-1 hover:bg-white/10 rounded-lg text-green-400 transition-colors">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-white/10 rounded-lg text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-bold text-red-400 px-2"
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
