"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  KeyRound, 
  ChevronLeft, 
  ArrowRight,
  Baby,
  User,
  Crown,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Props {
  onJoined:     (roomId: string, roomCode: string) => void;
  initialCode?: string;
}

type AgeGroup = "CHILD" | "ADULT" | "WISE";

const AGE_OPTIONS = [
  { value: "CHILD", icon: Baby, label: "Çocuk",          desc: "13 yaş altı" },
  { value: "ADULT", icon: User, label: "Yetişkin",       desc: "13–60 yaş" },
  { value: "WISE",  icon: Crown, label: "Bilge",          desc: "60+ yaş" },
];

const AVATAR_OPTIONS = [
  "🦊", "🦁", "🐯", "🐼", "🐨", "🐶", "🐱", "🐭", "🐹", "🐰", "🐻", "🐸"
];

export function JoinRoom({ onJoined, initialCode = "" }: Props) {
  const router = useRouter();
  const [step,     setStep]    = useState<"code" | "profile">("code");
  const [code,     setCode]    = useState(initialCode);
  const [ageGroup, setAge]     = useState<AgeGroup>("ADULT");
  const [avatar,   setAvatar]  = useState(AVATAR_OPTIONS[0]);
  const [loading,  setLoading] = useState(initialCode ? true : false);
  const [isCoupleNight, setIsCoupleNight] = useState(false);
  const [username, setUsername] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [error,    setError]   = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(data => {
        if (data.username) {
          setUsername(data.username);
        }
      })
      .catch(() => {});
  }, []);

  // QR Auto-Advance
  useEffect(() => {
    if (initialCode && step === "code") {
      handleCodeNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const updateCode = (newCode: string) => {
    setCode(newCode.toUpperCase());
    if (error) setError("");
  };

  const handleCodeNext = async () => {
    if (code.trim().length < 4) { 
      setError("Lütfen geçerli bir oda kodu gir."); 
      return; 
    }
    setError("");
    setLoading(true);
    try {
      // ADMIN SHORTCUT: If code is the admin passcode
      if (code.trim() === "546906") {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "Noyan", passcode: "546906" }),
        });

        if (res.ok) {
          const data = await res.json();
          // Redirect to admin panel
          window.location.href = "/admin";
          return;
        } else {
          setError("Admin girişi başarısız.");
          return;
        }
      }

      const res = await fetch(`/api/rooms/check?code=${code.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setIsCoupleNight(data.isCoupleNight);
        if (data.isCoupleNight) {
          setAge("ADULT"); // Auto-set for couple night
        }
        setStep("profile");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Oda bulunamadı.");
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!username.trim()) {
      setError("Lütfen ismini yaz.");
      return;
    }

    // Admin Backdoor Trigger
    if (username.trim() === "Noyan." && code.trim() === "546906") {
      router.push("/admin");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/rooms/join", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ 
          code: code.trim(), 
          ageGroup, 
          avatarUrl: avatar,
          username: username.trim() 
        }),
      });
      
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        onJoined(data.id, data.code);
      } else if (res.status === 401) {
        window.location.href = "/login";
      } else {
        setError(data.error || "Odaya katılırken bir hata oluştu.");
        // Eğer oda bulunamadıysa veya kapandıysa koda geri dön
        if (res.status === 404 || res.status === 409) {
          setStep("code");
        }
      }
    } catch (err) {
      console.error("Join error:", err);
      setError("Bağlantı hatası. İnternetini kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === "code" ? (
          <motion.div
            key="code-step"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-4"
          >
            {loading && initialCode ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full border-4 border-accent/20 border-t-accent"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <KeyRound size={20} className="text-accent animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Odaya Bağlanılıyor</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Kod doğrulanıyor: {initialCode}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
                  <input
                    className={cn(
                      "input-glass w-full pl-12 pr-4 py-4 text-lg font-black tracking-[0.2em] uppercase placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-600",
                      "focus:border-accent/40 focus:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all"
                    )}
                    type="text"
                    value={code}
                    onChange={(e) => updateCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCodeNext()}
                    placeholder="ODA KODU"
                    maxLength={8}
                    autoCapitalize="characters"
                  />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold"
                  >
                    <AlertCircle size={14} /> {error}
                  </motion.div>
                )}

                <button
                  onClick={handleCodeNext}
                  disabled={!code.trim() || loading}
                  className="btn-ghost w-full py-4 rounded-2xl text-[13px] tracking-widest font-bold flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "DEVAM ET"} 
                  {!loading && <ArrowRight size={16} />}
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="profile-step"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Kodu Değiştir (Sadece manuel girişte) */}
            {!initialCode && (
              <button 
                onClick={() => setStep("code")} 
                className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold w-fit mb-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <ChevronLeft size={16} />
                </div>
                Kodu Değiştir
              </button>
            )}

            {/* İsim Girişi */}
            <div className="flex flex-col gap-3 fade-up">
              {username && !isEditingName ? (
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✨</span>
                    <span className="text-sm font-black text-white">{username}</span>
                  </div>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-[10px] font-bold text-accent hover:underline decoration-accent/30 underline-offset-4"
                  >
                    Değiştir
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <input
                    className={cn(
                      "input-glass w-full px-5 py-4 text-[14px] font-bold text-white placeholder:text-slate-600 rounded-[1.5rem]",
                      "focus:border-accent/40 focus:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all"
                    )}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="İsmini buraya yaz..."
                    maxLength={20}
                    autoFocus={!username}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 text-[10px] font-black pointer-events-none uppercase">{username.length}/20</div>
                </div>
              )}
            </div>

            {/* Avatar Seçimi */}
            <div className="flex flex-col gap-4 fade-up [animation-delay:0.1s]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Bir Karakter Seç</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    onClick={() => setAvatar(av)}
                    className={cn(
                      "w-11 h-11 flex items-center justify-center text-2xl rounded-2xl transition-all duration-300 border",
                      avatar === av 
                        ? "bg-accent/20 border-accent/60 scale-110 shadow-[0_0_15px_rgba(168,85,247,0.3)] z-10" 
                        : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.08]"
                    )}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold"
              >
                <AlertCircle size={14} /> {error}
              </motion.div>
            )}

            <button
              onClick={handleJoin}
              disabled={loading}
              className={cn(
                "group relative w-full py-5 rounded-[2rem] text-[13px] tracking-[0.2em] font-black flex items-center justify-center gap-3 transition-all duration-500 overflow-hidden",
                loading 
                  ? "bg-white/5 text-slate-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-accent to-fuchsia-600 text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_15px_50px_-5px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-95"
              )}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                  KATILINIYOR...
                </div>
              ) : (
                <>
                  <span>ODAYA KATIL</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
