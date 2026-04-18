"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { CreateRoom } from "@/components/lobby/CreateRoom";
import { JoinRoom } from "@/components/lobby/JoinRoom";
import { useGameStore } from "@/store/game.store";
import { cn } from "@/lib/utils";

interface Props {
  joinCode:      string;
  isConfiguring: boolean;
  onCreated:     (roomId: string, roomCode: string) => void;
  onJoined:      (roomId: string, roomCode: string) => void;
  onStepChange:  (step: string) => void;
}

export function TabPlay({ joinCode, isConfiguring, onCreated, onJoined, onStepChange }: Props) {
  const { categoryName } = useGameStore();
  const isJoining = !!joinCode;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex flex-col items-center pt-10 pb-6 shrink-0">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-black tracking-[-0.05em] gradient-text leading-none"
        >
          mirros
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-slate-500 font-bold text-[13px] flex items-center gap-2"
        >
          <Sparkles size={13} className="text-accent animate-pulse" />
          {categoryName ? (
            <span className="text-white font-black tracking-widest uppercase text-[11px] bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
              {categoryName}
            </span>
          ) : "Arkadaşlarını ne kadar tanıyorsun?"}
        </motion.p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-6 flex flex-col gap-4">
        {!isJoining && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={cn(
              "rounded-[2rem] shadow-[0_20px_50px_-20px_rgba(168,85,247,0.3)]",
              isConfiguring ? "glass-card-elevated ring-2 ring-accent/20" : "glass-card-elevated"
            )}
          >
            <div className="p-2">
              <CreateRoom
                onCreated={onCreated}
                onStepChange={(step) => onStepChange(step)}
              />
            </div>
          </motion.div>
        )}

        {!isConfiguring && (
          <>
            {!isJoining && (
              <div className="flex items-center gap-4 px-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">veya</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "rounded-[2rem] p-4 shadow-xl",
                isJoining ? "glass-card-elevated ring-2 ring-accent/20" : "glass-card"
              )}
            >
              <JoinRoom onJoined={onJoined} initialCode={joinCode} />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
