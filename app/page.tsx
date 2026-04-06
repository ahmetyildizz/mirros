"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { CreateRoom } from "@/components/lobby/CreateRoom";
import { JoinRoom } from "@/components/lobby/JoinRoom";
import { useGameStore } from "@/store/game.store";
import { Sparkles } from "lucide-react";

function LobbyContent() {
  const router   = useRouter();
  const params   = useSearchParams();
  const joinCode = params.get("code") ?? "";
  const { setRoomId, setRoomCode, setIsHostPlayer } = useGameStore();

  const handleCreated = (roomId: string, roomCode: string) => {
    setRoomId(roomId);
    setRoomCode(roomCode);
    setIsHostPlayer(true);
    router.push(`/room/${roomId}`);
  };

  const handleJoined = (roomId: string, roomCode: string) => {
    setRoomId(roomId);
    setRoomCode(roomCode);
    setIsHostPlayer(false);
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center p-6 overflow-hidden bg-black/20">
      {/* Aurora Background 2.0 */}
      <div className="aurora-bg" aria-hidden>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="aurora-blob-1" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -8, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="aurora-blob-2" 
        />
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="aurora-blob-3" 
        />
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col gap-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-2 h-2 rounded-full bg-accent opacity-60 shadow-[0_0_12px_var(--accent)]"
            />
            <h1 className="text-6xl font-extrabold tracking-tighter gradient-text leading-tight drop-shadow-2xl">
              mirros
            </h1>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-2 h-2 rounded-full bg-accent-2 opacity-60 shadow-[0_0_12px_var(--accent-2)]"
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-slate-400 font-medium tracking-tight flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              Beni ne kadar tanıyorsun?
            </p>
            <div className="w-12 h-1 rounded-full bg-gradient-to-r from-accent to-accent-2 opacity-30" />
          </motion.div>
        </motion.div>

        {/* Action Sections with Staggered Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card-elevated"
        >
          <div className="p-5">
            <CreateRoom onCreated={handleCreated} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-4 px-2"
        >
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em]">veya</span>
          <div className="flex-1 h-px bg-white/5" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card p-6"
        >
          <JoinRoom onJoined={handleJoined} initialCode={joinCode} />
        </motion.div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-2 uppercase"
        >
          arkadaşlarını tanı · kendini keşfet
        </motion.p>
      </div>
    </main>
  );
}

export default function LobbyPage() {
  return (
    <Suspense>
      <LobbyContent />
    </Suspense>
  );
}
