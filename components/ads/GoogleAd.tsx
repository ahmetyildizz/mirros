"use client";

import React, { useEffect, useRef } from "react";
import Script from "next/script";
import { motion } from "framer-motion";

interface GoogleAdProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function GoogleAd({ 
  slot, 
  format = "auto", 
  responsive = true, 
  className = "",
  style = {} 
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  // Prod ortamı dışında veya ad-unit-id yoksa placeholder göster
  const isProd = process.env.NODE_ENV === "production";
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-6502220803487051"; // Örnek ID

  useEffect(() => {
    // Sayfa geçişlerinde veya state değişimlerinde reklamı tekrar yükle
    if (typeof window !== "undefined" && (window as any).adsbygoogle && !initialized.current) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        initialized.current = true;
      } catch (e) {
        console.error("Adsbygoogle error:", e);
      }
    }
  }, []);

  return (
    <div className={`relative w-full overflow-hidden flex flex-col items-center justify-center my-4 ${className}`}>
      {/* Script sadece bir kez ana sayfada yüklenecektir (Layout'ta olması idealdir ama burada lazy-load yapıyoruz) */}
      <Script
        id="adsbygoogle-init"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full min-h-[100px] bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center relative group"
      >
        {/* Placeholder Backing (AdMob gelene kadar şık durması için) */}
        {!initialized.current && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-white/10 mb-2" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sponsored</span>
          </div>
        )}

        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            ...style
          }}
          data-ad-client={adClient}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </motion.div>
      
      {/* Debug Info (Opsiyonel) */}
      {!isProd && (
        <span className="text-[8px] text-slate-700 mt-1 uppercase tracking-tighter">
          Ad Slot: {slot} (Demo Mode)
        </span>
      )}
    </div>
  );
}
