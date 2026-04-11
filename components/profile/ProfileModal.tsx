"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User, 
  Check, 
  ShieldCheck, 
  RefreshCcw, 
  LogOut, 
  Smartphone,
  Star
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username: string;
    email?: string;
    avatarUrl?: string;
    provider: string;
  };
  onUpdate: (newName: string) => Promise<void>;
}

export function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!newName.trim() || newName === user.username) {
      setIsEditing(false);
      return;
    }
    setLoading(true);
    try {
      await onUpdate(newName);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "İsim değiştirilemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-6 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-[440px] glass-card-elevated rounded-[2.5rem] overflow-hidden pointer-events-auto relative"
            >
              {/* Top Banner Background */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-accent/20 to-transparent -z-10" />
              
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Kapat"
              >
                <X size={20} className="text-slate-400" />
              </button>

              <div className="p-8 pt-12 flex flex-col items-center">
                
                {/* Avatar Section */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full scale-110" />
                  <div className="relative w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white/10 bg-slate-900 flex items-center justify-center shadow-2xl">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-slate-500" />
                    )}
                    
                    {/* Provider Badge */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-lg border border-black/5 scale-90">
                      {user.provider === "GOOGLE" ? (
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                      ) : user.provider === "APPLE" ? (
                        <img src="https://apple.com/favicon.ico" className="w-4 h-4" alt="Apple" />
                      ) : (
                        <Smartphone size={14} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Info & Name Edit */}
                <div className="text-center w-full space-y-2 mb-8">
                  {isEditing ? (
                    <div className="flex flex-col items-center gap-3">
                      <input 
                        className="w-full bg-white/5 border-2 border-accent/30 rounded-2xl px-5 py-3 text-center text-lg font-black text-white outline-none focus:border-accent"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                        maxLength={20}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSave}
                          disabled={loading}
                          className="px-6 py-2 bg-accent text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          {loading ? <RefreshCcw className="animate-spin" size={16} /> : <Check size={18} />} KAYDET
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-2 bg-white/5 text-slate-400 rounded-xl font-bold text-sm"
                        >
                          İPTAL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-3">
                        {user.username}
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <Star size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                        </button>
                      </h2>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                        <Smartphone size={12} /> {user.provider === "GUEST" ? "GUEST HESABI" : "ELİTE SENKRONİZASYON"}
                      </p>
                    </>
                  )}
                  {error && <p className="text-red-400 text-[10px] font-bold uppercase">{error}</p>}
                </div>

                {/* Account Benefits Section */}
                <div className="w-full space-y-3 mb-8">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">Hesap Avantajların</h3>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <BenefitCard 
                      icon={<ShieldCheck size={18} />}
                      title="Kimlik Koruması"
                      desc="İsminiz size rezerve edildi."
                    />
                    <BenefitCard 
                      icon={<RefreshCcw size={18} />}
                      title="Bulut Senkronizasyon"
                      desc="Tüm cihazlarda aynı profil."
                    />
                  </div>
                </div>

                {/* Action Footer */}
                <div className="w-full pt-6 border-t border-white/5">
                  <button 
                    onClick={handleLogout}
                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    <LogOut size={16} /> OTURUMU KAPAT
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function BenefitCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/[0.05] group hover:bg-white/[0.04] transition-colors">
      <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-500 shadow-inner">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-black text-white tracking-tight">{title}</span>
        <span className="text-[10px] font-bold text-slate-500 leading-none">{desc}</span>
      </div>
    </div>
  );
}
