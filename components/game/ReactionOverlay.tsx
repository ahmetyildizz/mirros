"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Reaction {
  id:       number;
  username: string;
  emoji:    string;
  x:        number;
}

const SFX_MAP: Record<string, string> = {
  "😂": "/sfx/laugh.mp3",
  "😱": "/sfx/gasp.mp3",
  "💩": "/sfx/fart.mp3",
  "🔥": "/sfx/fire.mp3",
  "🤡": "/sfx/honk.mp3",
  "💔": "/sfx/sad.mp3",
};

export function ReactionOverlay() {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const playSound = useCallback((emoji: string) => {
    const src = SFX_MAP[emoji] || "/sfx/pop.mp3";
    const audio = new Audio(src);
    audio.volume = 0.4;
    audio.play().catch(() => {}); // Autoplay policies might block
  }, []);

  useEffect(() => {
    const handleReaction = (e: any) => {
      const data = e.detail;
      const newReaction = {
        id:       Date.now() + Math.random(),
        username: data.username,
        emoji:    data.emoji,
        x:        Math.random() * 80 + 10, // 10% to 90% width
      };

      setReactions((prev) => [...prev, newReaction]);
      playSound(data.emoji);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 3000);
    };

    window.addEventListener("mirros-reaction", handleReaction);
    return () => window.removeEventListener("mirros-reaction", handleReaction);
  }, [playSound]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: "100vh", opacity: 0, scale: 0.5 }}
            animate={{ y: "-10vh", opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            style={{ left: `${r.x}%` }}
            className="absolute flex flex-col items-center gap-1"
          >
            <div className="text-4xl text-shadow-lg">{r.emoji}</div>
            <div className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white whitespace-nowrap">
              {r.username}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
