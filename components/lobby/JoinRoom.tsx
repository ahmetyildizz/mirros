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
  const [loading,  setLoading] = useState(false);
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
          // Update local state and trigger a refresh or show success
          window.location.reload(); // Hard refresh to update everything (header etc)
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
      if (res.ok) {
        const data = await res.json();
        onJoined(data.id, data.code);
      } else if (res.status === 401) {
        window.location.href = "/login";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Odaya katılırken bir hata oluştu.");
        // Eğer oda bulunamadıysa veya kapandıysa koda geri dön
        if (res.status === 404 || res.status === 409) {
          setStep("code");
        }
      }
    } catch {
      setError("Bağlantı hatası. İnternetini kontrol et.");
    }
    setLoading(false);
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
          </motion.div>
        ) : (
          <motion.div
            key="profile-step"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col gap-6"
          >
            <button 
              onClick={() => setStep("code")} 
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold w-fit"
            >
              <ChevronLeft size={16} /> Kodu Değiştir
            </button>

            {/* İsim Girişi */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Senin İsmin</p>
                {username && !isEditingName && (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-[10px] font-bold text-accent hover:underline"
                  >
                    Değiştir
                  </button>
                )}
              </div>
              
              {username && !isEditingName ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">✨ {username}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Hoş geldin!</span>
                </div>
              ) : (
                <input
                  className={cn(
                    "input-glass w-full px-4 py-3 text-[14px] font-bold text-white placeholder:text-slate-600",
                    "focus:border-accent/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all"
                  )}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="İsim yazın..."
                  maxLength={20}
                  autoFocus={!username}
                />
              )}
            </div>

            {/* Avatar Seçimi */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Karakterini Seç</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    onClick={() => setAvatar(av)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all border",
                      avatar === av 
                        ? "bg-accent/20 border-accent/40 scale-110 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                    )}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Yaş Grubu Seçimi */}
            {!isCoupleNight && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Senin Yaş Grubun</p>
                <div className="grid grid-cols-3 gap-2">
                  {AGE_OPTIONS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setAge(g.value as AgeGroup)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border shrink-0",
                        ageGroup === g.value 
                          ? "bg-accent/15 border-accent/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                          : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
                      )}
                    >
                      <g.icon className={cn(ageGroup === g.value ? "text-accent" : "text-slate-400")} size={24} />
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-[12px] font-bold tracking-tight",
                          ageGroup === g.value ? "text-white" : "text-slate-400"
                        )}>
                          {g.label}
                        </span>
                        <span className="text-[8px] text-slate-500 font-medium whitespace-nowrap">{g.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={loading}
              className="btn-gradient w-full py-4 rounded-2xl text-[13px] tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(168,85,247,0.4)]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>ODAYA KATIL <ArrowRight size={16} /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
