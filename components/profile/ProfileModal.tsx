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
  Star,
  Diamond,
  Fingerprint,
  Cloud,
  Edit2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MIRROS_AVATARS } from "@/lib/constants/avatars";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username: string;
    email?: string;
    avatarUrl?: string;
    provider: string;
    providerId?: string;
  };
  onUpdate: (data: { username?: string, avatarUrl?: string }) => Promise<void>;
}

export function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl);

  const hasChanges = (newName.trim() !== user.username && newName.trim().length >= 3) || (selectedAvatar !== user.avatarUrl);

  const handleSave = async () => {
    if (!hasChanges) return;

    const data: any = {};
    if (newName.trim() !== user.username) data.username = newName;
    if (selectedAvatar !== user.avatarUrl) data.avatarUrl = selectedAvatar;

    setLoading(true);
    try {
      await onUpdate(data);
      setIsEditing(false);
      setIsSelectingAvatar(false);
    } catch (err: any) {
      setError(err.message || "Güncelleme başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (url: string) => {
    setSelectedAvatar(url);
    // Auto-save if name hasn't changed
    if (newName.trim() === user.username) {
      const data = { avatarUrl: url };
      onUpdate(data).catch(err => setError(err.message));
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-5 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-[420px] max-h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-[3rem] overflow-y-auto pointer-events-auto relative shadow-[0_30px_100px_rgba(0,0,0,0.8)] scrollbar-none"
            >
              {/* Animated Top Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-40 bg-gradient-to-b from-accent/20 to-transparent blur-[60px] opacity-50 -z-10" />
              
              {/* Decorative Lines */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-all group z-20"
                aria-label="Kapat"
              >
                <X size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </button>

              <div className="p-10 pt-16 flex flex-col items-center">
                
                {/* Avatar Section */}
                <div className="relative mb-10 group">
                  {/* Rotating Orbit Ring */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset--3 rounded-[3rem] border border-accent/20 border-dashed"
                  />
                  
                  <motion.div 
                    onClick={() => setIsSelectingAvatar(!isSelectingAvatar)}
                    className="relative w-28 h-28 rounded-[2.5rem] bg-black border-2 border-white/10 p-1 group-hover:border-accent/40 transition-colors duration-700 shadow-2xl cursor-pointer"
                  >
                    <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-b from-white/10 to-transparent flex items-center justify-center overflow-hidden">
                      {selectedAvatar ? (
                        <img src={selectedAvatar} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} className="text-slate-500" />
                      )}
                      
                      {/* Overlay Edit Icon */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Star size={24} className="text-white drop-shadow-lg" />
                      </div>
                    </div>
                    
                    {/* Provider/Level Overlay Badge */}
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-2xl">
                      {user.provider === "GOOGLE" ? (
                        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                      ) : (
                        <Star size={16} className="text-amber-500 fill-amber-500" />
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Persona Selection Tray */}
                <AnimatePresence>
                  {isSelectingAvatar && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="w-full mb-8 overflow-hidden"
                    >
                      <div className="flex flex-col gap-3">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center italic">Mirros Personanı Seç</p>
                         <div className="grid grid-cols-5 gap-3 py-2 px-1">
                            {MIRROS_AVATARS.map((avatar) => (
                               <motion.div
                                 key={avatar.id}
                                 whileHover={{ scale: 1.1, y: -5 }}
                                 whileTap={{ scale: 0.9 }}
                                 onClick={() => handleAvatarSelect(avatar.url)}
                                 className={`w-full aspect-square rounded-2xl bg-white/5 border-2 cursor-pointer transition-all overflow-hidden p-1 ${selectedAvatar === avatar.url ? 'border-accent shadow-[0_0_15px_var(--accent-glow)]' : 'border-white/5'}`}
                               >
                                  <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover rounded-xl" title={avatar.name} />
                               </motion.div>
                            ))}
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Info & Name Edit */}
                <div className="text-center w-full space-y-3 mb-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-full">
                      <input 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-black text-white outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        maxLength={20}
                        placeholder="İsim girin..."
                      />
                      <Edit2 size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    </div>
                    
                    <div className="flex items-center justify-center gap-3">
                       <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]">
                          <Diamond size={10} className="text-accent fill-accent" />
                          <span className="text-[10px] font-black text-accent uppercase tracking-widest italic">
                            {user.provider === "GUEST" ? "GUEST" : "ELİTE ÜYE"}
                          </span>
                       </div>
                    </div>
                  </div>
                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-[10px] font-black uppercase tracking-widest">
                       {error}
                    </motion.p>
                  )}
                </div>

                {/* Save Action Banner (ONLY SHOW IF MODIFIED) */}
                <AnimatePresence>
                   {hasChanges && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="w-full mb-8 pt-2"
                      >
                         <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full h-14 bg-accent text-black rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(var(--accent-rgb),0.4)]"
                         >
                            {loading ? <RefreshCcw className="animate-spin" size={16} /> : <Check size={20} strokeWidth={3} />} DEĞİŞİKLİKLERİ KAYDET
                         </button>
                      </motion.div>
                   )}
                </AnimatePresence>

                {/* Account Benefits Section */}
                <div className="w-full space-y-4 mb-10">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">Ayrıcalıkların</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <BenefitCard 
                      icon={<ShieldCheck size={20} />}
                      title="Kimlik Koruması"
                      desc="Kullanıcı adınız tüm ağda rezerve edildi."
                      accent="accent"
                    />
                    <BenefitCard 
                      icon={<Cloud size={20} />}
                      title="Bulut Senkronizasyon"
                      desc="Tüm Mirros verilerin bulutta güvende."
                      accent="blue-500"
                    />
                    <BenefitCard 
                      icon={<Fingerprint size={20} />}
                      title="Anonimlik Modu"
                      desc="Verilerin gelişmiş şifreleme ile korunur."
                      accent="purple-500"
                    />
                  </div>
                </div>

                {/* Action Footer */}
                <div className="w-full pt-8 flex flex-col gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleLogout}
                    className="w-full py-5 rounded-[1.75rem] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-3 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all font-black text-[11px] uppercase tracking-[0.25em] italic"
                  >
                    <LogOut size={16} /> OTURUMU KAPAT
                  </motion.button>
                  
                  <p className="text-[9px] font-bold text-slate-700 text-center uppercase tracking-widest pointer-events-none">
                    Mirros ID: {user.providerId || "Local-Auth"}
                  </p>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function BenefitCard({ icon, title, desc, accent }: { icon: any, title: string, desc: string, accent: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, x: 4 }}
      className="flex items-center gap-5 p-5 rounded-[1.75rem] border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent hover:border-white/10 transition-all"
    >
      <div className={`w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-${accent} shadow-xl shadow-black/40`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-black text-white italic tracking-tight">{title}</span>
        <span className="text-[10px] font-bold text-slate-500 leading-tight pr-4">{desc}</span>
      </div>
    </motion.div>
  );
}
