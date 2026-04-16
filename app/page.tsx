"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { CreateRoom } from "@/components/lobby/CreateRoom";
import { JoinRoom } from "@/components/lobby/JoinRoom";
import { useGameStore } from "@/store/game.store";
import { Sparkles } from "lucide-react";
import { DailyWidget } from "@/components/lobby/DailyWidget";
import { ProfileSettings } from "@/components/lobby/ProfileSettings";
import { AdBanner } from "@/components/shared/AdBanner";

function LobbyContent() {
  const router   = useRouter();
  const params   = useSearchParams();
  const joinCode = params.get("code") ?? "";
  const { setRoomId, setRoomCode, setIsHostPlayer, categoryName } = useGameStore();
  const [isDailyAnswered, setIsDailyAnswered] = useState(false);

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

  useEffect(() => {
    // Eğer yeni bir odaya katılmıyorsak (QR veya Link değilse) 
    // eski oyun verilerini (Kategori adı, tema vb.) temizle.
    if (!isJoining) {
      useGameStore.getState().reset();
    }
  }, [isJoining]);

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center pt-safe pb-safe px-6 overflow-hidden bg-black/20">
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
        {/* Profile/User Settings - Hide if joining */}
        {!isJoining && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProfileSettings />
          </motion.div>
        )}

        {/* Hero Section - Simplified if joining */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-7xl font-black tracking-[-0.05em] gradient-text leading-tight drop-shadow-2xl">
              mirros
            </h1>
          </div>
          
          {!isJoining && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.p 
                key={categoryName || "default"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-slate-400 font-bold tracking-tight flex items-center gap-2.5 text-[15px]"
              >
                <Sparkles size={16} className="text-accent animate-pulse" />
                {categoryName ? (
                  <span className="text-white font-black tracking-widest uppercase italic bg-accent/10 px-3 py-0.5 rounded-full border border-accent/20">
                    {categoryName}
                  </span>
                ) : (
                  "Beni ne kadar tanıyorsun?"
                )}
              </motion.p>
              <div className="w-16 h-1 rounded-full bg-gradient-to-r from-accent to-accent-2 opacity-20" />
            </motion.div>
          )}
        </motion.div>

        {/* Daily Question Section - Hide if joining */}
        {!isJoining && !isDailyAnswered && (
          <motion.div layout>
            <DailyWidget onAnsweredStatus={setIsDailyAnswered} />
          </motion.div>
        )}

        {/* Action Sections - Hide CreateRoom if joining */}
        {!isJoining && (
          <>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              layout
              transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card-elevated rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(168,85,247,0.3)]"
            >
              <div className="p-2">
                <CreateRoom onCreated={handleCreated} />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-5 px-4"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-[12px] font-black text-slate-600 uppercase tracking-[0.4em]">veya</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
            </motion.div>
          </>
        )}

        {/* JOIN FLOW (Highest Priority) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          layout
          transition={{ delay: isJoining ? 0 : 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "rounded-[2rem] p-4 shadow-xl transition-all duration-700",
            isJoining ? "glass-card-elevated ring-2 ring-accent/20" : "glass-card"
          )}
        >
          <JoinRoom onJoined={handleJoined} initialCode={joinCode} />
        </motion.div>

        {/* Hide bottom bits if joining */}
        {!isJoining && isDailyAnswered && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
          >
            <DailyWidget onAnsweredStatus={setIsDailyAnswered} />
          </motion.div>
        )}

        {/* Advert Section */}
        <AdBanner type="lobby" />

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-3 uppercase pb-4"
        >
          arkadaşlarını tanı · kendini keşfet · v0.4.0
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
