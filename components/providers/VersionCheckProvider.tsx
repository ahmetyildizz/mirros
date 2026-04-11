"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, AlertTriangle, ShieldCheck } from "lucide-react";

// MAĞAZADAKİ MEVCUT SÜRÜM - UYGULAMA GÜNCELLENDİKÇE YÜKSELTİLİR
const CURRENT_VERSION = "0.2.2";

function isNewerVersion(current: string, remote: string): boolean {
  const cParts = current.split(".").map(Number);
  const rParts = remote.split(".").map(Number);
  
  for (let i = 0; i < Math.max(cParts.length, rParts.length); i++) {
    const c = cParts[i] || 0;
    const r = rParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

export function VersionCheckProvider({ children }: { children: React.ReactNode }) {
  const [mustUpdate, setMustUpdate] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState("");

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version");
        if (!res.ok) return;

        const data = await res.json();
        
        // Sadece geçerli bir rakamsal versiyonsa kontrol et
        if (data.version && data.version.includes(".")) {
          if (isNewerVersion(CURRENT_VERSION, data.version)) {
            setRemoteVersion(data.version);
            setMustUpdate(true);
          }
        } else if (!isNaN(Number(data.version))) {
           // Eğer sadece "2", "3" gibi versiyon numaraları koyarlarsa diye yedek:
           if (Number(data.version) > Number(CURRENT_VERSION.replace(/\./g, ''))) {
              setRemoteVersion(data.version);
              setMustUpdate(true);
           }
        }
      } catch (err) {
        console.warn("Sürüm kontrolü yapılamadı (internet kapalı olabilir).", err);
      }
    };

    checkVersion();
  }, []);

  const handleStoreRedirect = () => {
    window.location.href = "https://play.google.com/store/apps/details?id=com.mirros.app";
  };

  return (
    <>
      <AnimatePresence>
        {mustUpdate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
                transition={{ duration: 4, repeat: Infinity }} 
                className="w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] bg-red-500/20 rounded-full blur-[100px]" 
              />
            </div>

            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative z-10 w-full max-w-sm glass-card-elevated border-red-500/30 p-8 flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)]">
                <ShieldCheck size={40} className="text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">Kritik Güncelleme</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[12px] font-bold text-slate-400">Mevcut: {CURRENT_VERSION}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span className="text-[12px] font-bold text-red-400">Yeni: {remoteVersion}</span>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl w-full">
                <p className="text-[13px] text-red-200/90 font-medium leading-relaxed">
                  Şu anda sistemdeki en stabil ve yeni özellikleri içeren Mirros sürümü mağazada yayınlandı! 
                  Devam etmek için oyunu güncellemeniz gerekiyor.
                </p>
              </div>

              <button
                onClick={handleStoreRedirect}
                className="w-full bg-white hover:bg-slate-200 active:scale-95 transition-all text-black py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 mt-2"
              >
                HEMEN GÜNCELLE
                <Download size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Güncelleme zorunlu ise arkadaki sayfanın çalışmasını (tıklanmasını) engellemek için engelli render */}
      {!mustUpdate && children}
    </>
  );
}
