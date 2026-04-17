"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import {
  Download,
  MessageCircle,
  Check,
  X,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  familiarity:       number;
  gameId:            string;
  funniestQuestion?: string;
  funniestAnswer?:   string;
  aiTag?:            string;   // e.g. "Zombi Anında Çıkar"
  winner?:           string;   // top player username
}

export function ShareButton({
  familiarity,
  gameId,
  funniestQuestion,
  funniestAnswer,
  aiTag,
  winner,
}: Props) {
  const [copied,        setCopied]        = useState(false);
  const [showCard,      setShowCard]      = useState(false);
  const [isGenerating,  setIsGenerating]  = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const emoji = familiarity >= 90 ? "🔥" : familiarity >= 70 ? "💜" : familiarity >= 50 ? "✨" : familiarity >= 30 ? "🌱" : "🌙";
  const origin    = typeof window !== "undefined" ? window.location.origin : "https://mirros.vercel.app";
  const shareUrl  = `${origin}/results/${gameId}`;
  const tagLine   = aiTag ? `Mirros diyor ki: "${aiTag}" 👀` : "";
  const shareText = [
    `Mirros'ta ${familiarity}% tanışıklık puanı aldık! ${emoji}`,
    tagLine,
    `Sonuçlarımı gör: ${shareUrl}`,
  ].filter(Boolean).join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNative = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "mirros sonuçlarım", text: shareText, url: shareUrl }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#000000",
      });
      const image = canvas.toDataURL("image/png");
      const link  = document.createElement("a");
      link.href     = image;
      link.download = `mirros-${familiarity}pct.png`;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Trigger buttons */}
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
            <MessageCircle size={20} fill="currentColor" className="opacity-80" />
          </motion.button>
        </div>
      </div>

      {/* Share card modal */}
      <AnimatePresence>
        {showCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            {/* Backdrop */}
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
              className="relative w-full max-w-[340px] flex flex-col items-center gap-5"
            >
              <div className="text-center">
                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Hikaye Kartı</p>
                <p className="text-[10px] font-medium text-slate-600 leading-tight">İndir ve Instagram / TikTok hikayene ekle</p>
              </div>

              {/* ─── SHAREABLE CARD — 9:16 ─────────────────── */}
              <div
                ref={cardRef}
                className="relative w-full aspect-[9/16] rounded-[28px] overflow-hidden border border-white/10 shadow-2xl"
              >
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#120828] to-[#0a0a0f]" />
                <div className="absolute top-[-15%] left-[-15%] w-[70%] h-[70%] bg-accent/25 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-15%] right-[-15%] w-[70%] h-[70%] bg-fuchsia-600/15 blur-[100px] rounded-full" />

                <div className="relative z-10 h-full flex flex-col items-center justify-between p-8 text-center">

                  {/* Logo */}
                  <div className="flex flex-col items-center gap-1 pt-2">
                    <span className="text-3xl font-black text-white tracking-tighter">mirros</span>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.35em]">Beni Ne Kadar Tanıyorsun?</span>
                  </div>

                  {/* Score circle */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-36 h-36 rounded-full border-[3px] border-accent/60 shadow-[0_0_50px_rgba(168,85,247,0.35)] flex flex-col items-center justify-center bg-accent/5">
                      <span className="text-4xl mb-0.5">{emoji}</span>
                      <span className="text-4xl font-black text-white leading-none">{familiarity}%</span>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">UYUM</span>
                    </div>

                    {winner && (
                      <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-4 py-1.5 rounded-full">
                        <span className="text-yellow-400 text-[11px] font-black uppercase tracking-wider">🏆 {winner}</span>
                      </div>
                    )}
                  </div>

                  {/* AI Tag — the star of the card */}
                  {aiTag && (
                    <div className="w-full bg-white/[0.04] border border-accent/25 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
                      <div className="flex items-center gap-2 relative z-10">
                        <Zap size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                        <span className="text-[9px] font-black text-accent/60 uppercase tracking-[0.25em]">Mirros Yapay Zeka Yorumu</span>
                      </div>
                      <p className="text-[18px] font-black text-white leading-snug tracking-tight relative z-10">
                        "{aiTag}"
                      </p>
                    </div>
                  )}

                  {/* Funniest moment (only if no AI tag, or as secondary) */}
                  {!aiTag && funniestQuestion && funniestAnswer && (
                    <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
                      <span className="text-[9px] font-black text-yellow-400/70 uppercase tracking-[0.2em]">En Komik An</span>
                      <p className="text-[11px] font-medium text-white/60 leading-tight italic">"{funniestQuestion}"</p>
                      <p className="text-[15px] font-black text-white">{funniestAnswer}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div>
                    <span className="text-[10px] font-black text-white/15 uppercase tracking-[0.4em]">mirros.vercel.app</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full gap-3">
                <button
                  disabled={isGenerating}
                  onClick={handleDownloadImage}
                  className="flex-1 bg-accent hover:bg-accent/80 text-white font-black text-[12px] tracking-widest uppercase py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {isGenerating ? (
                    <Download size={16} className="animate-bounce" />
                  ) : (
                    <Download size={16} />
                  )}
                  {isGenerating ? "İNDİRİLİYOR..." : "KARTI İNDİR"}
                </button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCard(false)}
                  className="w-14 h-[52px] rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0"
                >
                  <X size={22} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
