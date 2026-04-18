"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJIS = ["😂", "😱", "💩", "🔥", "🤡", "💔"];

export function ReactionToolbar({ roomId }: { roomId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const sendReaction = async (emoji: string) => {
    try {
      await fetch(`/api/rooms/${roomId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to send reaction", err);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            className="absolute bottom-16 right-0 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 grid grid-cols-2 gap-2 shadow-2xl"
          >
            {EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => sendReaction(emoji)}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-white/10 rounded-xl transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg border",
          isOpen 
            ? "bg-accent text-white border-accent" 
            : "bg-white/5 text-slate-400 border-white/10 backdrop-blur-md"
        )}
      >
        <SmilePlus size={24} />
      </motion.button>
    </div>
  );
}
