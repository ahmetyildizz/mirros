"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Reaction {
  id:     number;
  username: string;
  emoji:  string;
  x:      number;
  delay:  number;
}

const SFX_MAP: Record<string, string> = {
  "😂": "/sfx/laugh.mp3",
  "😱": "/sfx/gasp.mp3",
  "💩": "/sfx/fart.mp3",
  "🔥": "/sfx/fire.mp3",
  "🤡": "/sfx/honk.mp3",
  "💔": "/sfx/sad.mp3",
};

// 6 kolon — her yeni tepki bir sonraki kolona yerleşir
const COLUMNS = [12, 26, 40, 54, 68, 82];

export function ReactionOverlay() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const colIndexRef = useRef(0);

  const playSound = useCallback((emoji: string) => {
    import("@/lib/sounds").then(({ sounds }) => {
      const src = SFX_MAP[emoji];
      if (!src) { sounds.reaction(); return; }
      const audio = new Audio(src);
      audio.volume = 0.7;
      audio.play().catch(() => sounds.reaction());
    });
  }, []);

  useEffect(() => {
    const handleReaction = (e: any) => {
      const data = e.detail;
      // Kolonları sırayla kullan — yatayda üst üste binmeyi önler
      const col = COLUMNS[colIndexRef.current % COLUMNS.length];
      colIndexRef.current++;

      const newReaction: Reaction = {
        id:       Date.now() + Math.random(),
        username: data.username,
        emoji:    data.emoji,
        x:        col,
        delay:    0,
      };

      setReactions(prev => [...prev.slice(-5), newReaction]); // max 6 eş zamanlı
      playSound(data.emoji);

      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== newReaction.id));
      }, 3000);
    };

    window.addEventListener("mirros-reaction", handleReaction);
    return () => window.removeEventListener("mirros-reaction", handleReaction);
  }, [playSound]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: "98vh", x: `${r.x}%`, opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ 
              y: "-15vh", 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1, 0.8],
              rotate: [r.id % 2 === 0 ? -10 : 10, r.id % 2 === 0 ? 10 : -10],
              x: [`${r.x}%`, `${r.x + (r.id % 3 === 0 ? 5 : -5)}%`, `${r.x}%`]
            }}
            transition={{ 
              y: { duration: 3.5, ease: "linear" },
              opacity: { times: [0, 0.1, 0.8, 1], duration: 3.5 },
              scale: { times: [0, 0.15, 0.5, 1], duration: 3.5 },
              rotate: { duration: 3.5, ease: "easeInOut" },
              x: { duration: 3.5, ease: "easeInOut" }
            }}
            className="fixed pointer-events-none flex flex-col items-center gap-1.5"
            style={{ left: 0, top: 0 }}
          >
            <div className="text-5xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] filter saturate-[1.2]">
              {r.emoji}
            </div>
            <motion.div 
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/90 whitespace-nowrap font-black uppercase tracking-widest border border-white/10 shadow-xl"
            >
              {r.username}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
