"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";
import { SignInWithApple } from "@capacitor-community/apple-sign-in";


export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"OPTIONS" | "GUEST_NAME">("OPTIONS");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Sadece native (iOS/Android) üzerinde aktif edelim. Safari veya masaüstü web tarayıcılarında sahte tetiklenmeyi engelleriz.
    const isMobileNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() !== 'web';
    setIsNative(isMobileNative);

    // Google Sign-In initialization (Always for Google support)
    GoogleSignIn.initialize({
      clientId: "43704745497-foo9egeveuq8fk3uifma6tn1p0ou38jk.apps.googleusercontent.com",
      webClientId: "43704745497-foo9egeveuq8fk3uifma6tn1p0ou38jk.apps.googleusercontent.com",
      redirectUrl: "https://mirros.vercel.app/login",
      redirectUri: "https://mirros.vercel.app/login",
    }).catch(console.error);

    // Web Redirect Callback (Handle returning from Google login on web)
    if (!Capacitor.isNativePlatform()) {
      const url = window.location.href;
      // Sadece URL'de OAuth parametreleri varsa callback'i tetikle (Çökmeyi önlemek için)
      if (url.includes("code=") || url.includes("id_token=") || url.includes("state=")) {
        GoogleSignIn.handleRedirectCallback()
          .then((result) => {
            if (result && result.idToken) {
              handleLogin("GOOGLE", undefined, result.idToken);
            }
          })
          .catch((err) => {
            console.error("Redirect callback error handled:", err);
            // Hata sessizce yakalanır, uygulama çökmez
          });
      }
    }

    // Cihaz kimliği yoksa oluştur ve sakla
    let id = localStorage.getItem("mirros_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("mirros_device_id", id);
    }
    setDeviceId(id);

    // Eğer zaten bir kullanıcı adı varsa otomatik doldur
    const lastUsername = localStorage.getItem("mirros_last_username");
    if (lastUsername) setUsername(lastUsername);
  }, []);

  const handleLogin = async (provider: "GUEST" | "GOOGLE" | "APPLE", customName?: string, existingToken?: string) => {
    setError(null);
    setLoading(true);

    try {
      // Early Init for Google on Web
      if (provider === "GOOGLE") {
        await GoogleSignIn.initialize({
          clientId: "43704745497-foo9egeveuq8fk3uifma6tn1p0ou38jk.apps.googleusercontent.com",
          webClientId: "43704745497-foo9egeveuq8fk3uifma6tn1p0ou38jk.apps.googleusercontent.com",
          redirectUrl: "https://mirros.vercel.app/login",
          redirectUri: "https://mirros.vercel.app/login",
        }).catch(console.error);
      }

      let token: string | undefined = existingToken;
      let loginName = customName;

      // 1. Auth Akışı (Native & Web)
      if (provider !== "GUEST" && !token) {
        if (provider === "GOOGLE") {
          const result = await GoogleSignIn.signIn({
            clientId: "43704745497-foo9egeveuq8fk3uifma6tn1p0ou38jk.apps.googleusercontent.com",
            webClientId: "43704745497-foo9egeveuq8fk3uifma6tn1p0ou38jk.apps.googleusercontent.com",
            serverClientId: "43704745497-foo9egeveuq8fk3uifma6tn1p0ou38jk.apps.googleusercontent.com",
            // Shotgun redirect params
            redirectUrl: "https://mirros.vercel.app/login",
            redirectUri: "https://mirros.vercel.app/login",
          });
          token = result.idToken;
          loginName = result.authentication.accessToken; // Geçici
        } else if (provider === "APPLE") {
          // Apple sadece native'de kalsın (Web kurulumu farklı)
          if (Capacitor.isNativePlatform()) {
            const result = await SignInWithApple.authorize({
              clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "com.mirros.app",
              redirectURI: "https://mirros.vercel.app/api/auth/callback/apple",
              scopes: "email name",
            });
            token = result.response.identityToken;
          } else {
            throw new Error("Apple Girişi şu an sadece mobil uygulamada destekleniyor.");
          }
        }
      }

      // 2. Backend Api Çağrısı
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: loginName?.trim(),
          provider,
          deviceId,
          token
        }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("mirros_last_username", data.username);
        router.push("/");
      } else {
        setError(data.error ?? "Giriş başarısız");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Kullanıcı iptal ettiyse loading'i kapa ama hata basma
      if (err.message?.includes("cancel") || err.code === "CANCELLED") {
        setLoading(false);
        return;
      }
      setError("Giriş hatası: " + (err.message || "Bağlantı hatası veya İptal edildi"));
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Aurora bg */}
      <div className="aurora-bg fixed inset-0 pointer-events-none opacity-40" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-card-elevated p-8 flex flex-col items-center gap-8 relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-accent/30 blur-2xl rounded-full" />
            <h1 className="text-4xl font-black gradient-text tracking-tighter relative z-10">mirros</h1>
          </div>
          <p className="text-slate-400 font-medium text-sm tracking-wide">Beni ne kadar tanıyorsun?</p>
        </div>

        <AnimatePresence mode="wait">
          {view === "OPTIONS" ? (
            <motion.div 
              key="options"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full space-y-4"
            >
              <SocialButtons 
                provider="GOOGLE" 
                onClick={() => handleLogin("GOOGLE")} 
                isLoading={loading}
              />
              {isNative && (
                <SocialButtons 
                  provider="APPLE" 
                  onClick={() => handleLogin("APPLE")} 
                  isLoading={loading}
                />
              )}
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[.3em] text-slate-500">
                  <span className="bg-[#050505] px-4">VEYA</span>
                </div>
              </div>

              <SocialButtons 
                provider="GUEST" 
                onClick={() => setView("GUEST_NAME")} 
                isLoading={loading}
              />

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="guest-name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-6"
            >
              <button 
                onClick={() => setView("OPTIONS")}
                className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold transition-colors"
              >
                <ChevronLeft size={16} /> GERİ DÖN
              </button>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">👤</span>
                  <input
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 pl-10 text-white placeholder:text-slate-600 focus:border-accent/50 outline-none transition-all"
                    type="text"
                    placeholder="Ekranda görünecek adın"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    maxLength={20}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={() => handleLogin("GUEST", username)}
                  disabled={loading || username.trim().length < 2}
                  className="w-full py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "OYUNA BAŞLA 👉"}
                </button>
              </div>

              <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest leading-relaxed">
                İsim seçtiğinde bu cihaza kilitlenir,<br />başkası aynı ismi kullanamaz.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter opacity-40">
          Powered by Mirros Engine v2.0
        </p>
      </motion.div>
    </main>
  );
}
