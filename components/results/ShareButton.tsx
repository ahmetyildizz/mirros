"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Share2, 
  Download, 
  MessageCircle, 
  Copy, 
  Check, 
  X, 
  Smartphone,
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  familiarity:       number;
  gameId:            string;
  funniestQuestion?: string;
  funniestAnswer?:   string;
}

export function ShareButton({ familiarity, gameId, funniestQuestion, funniestAnswer }: Props) {
  const [copied,      setCopied]      = useState(false);
  const [showCard,    setShowCard]    = useState(false);

  const emoji = familiarity >= 90 ? "🔥" : familiarity >= 70 ? "💜" : familiarity >= 50 ? "✨" : familiarity >= 30 ? "🌱" : "🌙";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/results/${gameId}` : "";
  const shareText = `mirros'ta ${familiarity}% tanışıklık puanı aldık! ${emoji}\nSen de oyna: ${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNative = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ 
        title: "mirros sonuçlarım", 
        text: shareText, 
        url: shareUrl 
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 w-full">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCard(true)} 
          className="btn-gradient py-4 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-black tracking-widest uppercase shadow-lg"
        >
          <Sparkles size={16} /> KART OLUŞTUR
        </motion.button>
        
        <div className="flex gap-2">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleNative} 
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center text-white"
          >
            {copied ? <Check size={20} className="text-green-500" /> : <Smartphone size={20} />}
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleWhatsApp} 
            className="flex-1 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl flex items-center justify-center text-[#25D366]"
          >
            <MessageCircle size={20} fill="currentColor" className="opacity-20" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCard(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[380px] flex flex-col items-center gap-6"
            >
              <div className="text-center">
                <p className="text-[13px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Paylaşılabilir Kart</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">Bu ekranın görüntüsünü alarak arkadaşlarınla paylaş!</p>
              </div>

              {/* SHAREABLE CARD */}
              <div className="relative w-full aspect-[9/16] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#1a0a2e] to-[#0d0d0d]" />
                
                {/* Aurora Blobs for card */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent/20 blur-[80px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-500/10 blur-[80px] rounded-full" />

                <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-4xl font-black text-accent tracking-tighter antialiased">mirros</span>
                    <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] mt-1 italic">Beni Ne Kadar Tanıyorsun?</span>
                  </div>

                  <div className="relative flex flex-col items-center">
                    <div className="w-40 h-40 rounded-full border-4 border-accent shadow-[0_0_40px_rgba(124,58,237,0.3)] flex flex-col items-center justify-center bg-accent/5">
                      <span className="text-4xl mb-1">{emoji}</span>
                      <span className="text-5xl font-black text-accent tracking-tighter">{familiarity}%</span>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Uyum</span>
                    </div>
                    
                    <div className="absolute -top-4 -right-4 bg-white text-black font-black text-[10px] py-1 px-3 rounded-full transform rotate-12 shadow-xl">
                      NEW RECORD!
                    </div>
                  </div>

                  {funniestQuestion && funniestAnswer && (
                    <div className="w-full bg-white/[0.03] border border-white/10 rounded-[24px] p-6 flex flex-col gap-2">
                       <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">En Komik An</span>
                       <p className="text-[13px] font-medium text-white/60 leading-tight italic">"{funniestQuestion}"</p>
                       <p className="text-[16px] font-black text-white tracking-tight mt-1">{funniestAnswer}</p>
                    </div>
                  )}

                  <div className="mt-auto">
                    <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">mirros.vercel.app</span>
                  </div>
                </div>
              </div>

              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCard(false)}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <X size={24} />
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
