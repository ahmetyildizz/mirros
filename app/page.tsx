"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/game.store";
import { BottomNav, type BottomTab } from "@/components/layout/BottomNav";
import { TabPlay }     from "@/components/layout/TabPlay";
import { TabDiscover } from "@/components/layout/TabDiscover";
import { TabProfile }  from "@/components/layout/TabProfile";
import { VersionHistoryModal } from "@/components/lobby/VersionHistoryModal";

function LobbyContent() {
  const router   = useRouter();
  const params   = useSearchParams();
  const joinCode = params.get("code") ?? "";

  const { setRoomId, setRoomCode, setIsHostPlayer } = useGameStore();

  const [activeTab, setActiveTab]         = useState<BottomTab>("play");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [user, setUser]                   = useState<any>(null);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) { setUser(null); return; }
      setUser(await res.json());
    } catch { setUser(null); }
  };

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    if (!joinCode) useGameStore.getState().reset();
    // Deep link ile gelen davet kodu varsa direkt Oyna sekmesine aç
    if (joinCode) setActiveTab("play");
  }, [joinCode]);

  const handleCreated = (roomId: string, roomCode: string) => {
    setRoomId(roomId); setRoomCode(roomCode); setIsHostPlayer(true);
    router.push(`/room/${roomId}`);
  };

  const handleJoined = (roomId: string, roomCode: string) => {
    setRoomId(roomId); setRoomCode(roomCode); setIsHostPlayer(false);
    router.push(`/room/${roomId}`);
  };

  // Oda kurulumu sırasında sekme değişimini engelle
  const handleTabChange = (tab: BottomTab) => {
    if (isConfiguring) return;
    setActiveTab(tab);
  };

  return (
    <main className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Aurora Background */}
      <div className="aurora-bg pointer-events-none" aria-hidden>
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

      {/* Tab Content — fills between safe-area-top and bottom nav */}
      <div className="relative z-10 flex-1 overflow-hidden pt-safe w-full max-w-[480px] mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "play" && (
            <motion.div
              key="play"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <TabPlay
                joinCode={joinCode}
                isConfiguring={isConfiguring}
                onCreated={handleCreated}
                onJoined={handleJoined}
                onStepChange={(step) => setIsConfiguring(step === "config")}
              />
            </motion.div>
          )}

          {activeTab === "discover" && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <TabDiscover user={user} onDailyAnswered={() => {}} />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <TabProfile
                user={user}
                onRefresh={fetchUser}
                onVersionClick={() => setIsHistoryOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active={activeTab} onChange={handleTabChange} />

      <VersionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
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
