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
            initial={{ y: "95vh", opacity: 0, scale: 0.6 }}
            animate={{ y: "5vh",  opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            style={{ left: `${r.x}%`, position: "absolute" }}
            className="flex flex-col items-center gap-1"
          >
            <div className="text-4xl drop-shadow-lg">{r.emoji}</div>
            <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] text-white whitespace-nowrap font-bold">
              {r.username}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
