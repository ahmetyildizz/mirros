"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

export function AdMockProvider({ children }: { children: React.ReactNode }) {
  const [showMockAd, setShowMockAd] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const handleMockAd = () => {
      console.log("Mock Ad Triggered!");
      setShowMockAd(true);
      setTimeLeft(3);
      setCanClose(false);
    };

    window.addEventListener("mock-interstitial", handleMockAd);
    return () => window.removeEventListener("mock-interstitial", handleMockAd);
  }, []);

  useEffect(() => {
    if (showMockAd) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setCanClose(true);
      }
    }
  }, [showMockAd, timeLeft]);

  return (
    <>
      <AnimatePresence>
        {showMockAd && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Header / Close Button */}
            <div className="absolute top-0 right-0 w-full p-safe-top bg-gradient-to-b from-black/80 to-transparent flex justify-end z-20">
              <div className="p-4 flex items-center gap-4">
                {!canClose ? (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                    <Loader2 size={12} className="animate-spin text-white/60" />
                    <span className="text-[10px] font-bold text-white/80 tabular-nums uppercase tracking-widest">{timeLeft} sn</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMockAd(false)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors shadow-lg"
                  >
                    <X size={20} className="text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[100px]" />
               <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute -bottom-[20%] -right-[20%] w-[80%] h-[80%] rounded-full bg-purple-500/20 blur-[120px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-sm w-full gap-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_50px_rgba(139,92,246,0.5)] flex items-center justify-center border border-white/20 relative">
                <Sparkles size={40} className="text-white drop-shadow-lg" />
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg">AD</div>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                  AdMob Reklam Alanı
                </h2>
                <div className="flex bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 gap-3 text-left">
                  <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-medium text-amber-200/90 leading-relaxed">
                    Şu anda Vercel (Web Tarayıcı) üzerinden test yaptığınız için Native AdMob reklamları çalışmaz. Mobil cihaza döküldüğünde (APK/IPA) burada gerçek Google reklamı çıkacaktır.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => canClose && setShowMockAd(false)}
                className={cn(
                  "w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all duration-300",
                  canClose ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95" : "bg-white/5 text-white/30 border border-white/10 opacity-50 cursor-not-allowed"
                )}
              >
                {canClose ? "Reklamı Geç" : "Bekleniyor..."}
              </button>
            </div>
            
            <div className="absolute bottom-safe w-full p-4 text-center">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Sponsored by Mirros Dev</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}

// Utility classname function
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
