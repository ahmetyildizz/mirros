"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CreateRoom } from "@/components/lobby/CreateRoom";
import { JoinRoom } from "@/components/lobby/JoinRoom";
import { useGameStore } from "@/store/game.store";

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

  const handleJoined = (roomId: string) => {
    setIsHostPlayer(false);
    router.push(`/room/${roomId}`);
  };

  return (
    <main style={s.page}>
      {/* Aurora arkaplan */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
        <div className="aurora-blob-3" />
      </div>

      <div style={s.inner}>
        {/* Hero */}
        <div style={s.hero} className="fade-up">
          <div style={s.logoWrap}>
            <span style={s.logoDot} />
            <h1 className="gradient-text" style={s.logo}>mirros</h1>
            <span style={s.logoDot} />
          </div>
          <p style={s.tagline}>Beni ne kadar tanıyorsun?</p>
          <div style={s.taglineLine} />
        </div>

        {/* Oda oluştur */}
        <div style={s.section} className="fade-up fade-up-1">
          <CreateRoom onCreated={handleCreated} />
        </div>

        {/* Ayırıcı */}
        <div style={s.divider} className="fade-up fade-up-2">
          <div style={s.divLine} />
          <span style={s.divText}>veya</span>
          <div style={s.divLine} />
        </div>

        {/* Odaya katıl */}
        <div style={s.section} className="fade-up fade-up-3">
          <JoinRoom onJoined={handleJoined} initialCode={joinCode} />
        </div>

        {/* Footer */}
        <p style={s.footer} className="fade-up fade-up-4">
          arkadaşlarını tanı · kendini keşfet
        </p>
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

const s = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem 1.25rem",
    position: "relative" as const,
    zIndex: 1,
  },
  inner: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
  },
  hero: {
    textAlign: "center" as const,
    marginBottom: "0.25rem",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    marginBottom: "0.5rem",
  },
  logo: {
    fontSize: "3rem",
    fontWeight: 800,
    letterSpacing: "-0.05em",
    lineHeight: 1,
    margin: 0,
  },
  logoDot: {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--grad)",
    opacity: 0.6,
  },
  tagline: {
    color: "var(--fg-secondary)",
    fontSize: "0.95rem",
    fontWeight: 500,
    margin: "0 0 0.75rem",
  },
  taglineLine: {
    width: 40,
    height: 2,
    borderRadius: 2,
    background: "var(--grad)",
    margin: "0 auto",
    opacity: 0.6,
  },
  section: {
    position: "relative" as const,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  divLine: {
    flex: 1,
    height: 1,
    background: "var(--border)",
  },
  divText: {
    color: "var(--fg-muted)",
    fontSize: "0.78rem",
    fontWeight: 500,
    letterSpacing: "0.05em",
  },
  footer: {
    textAlign: "center" as const,
    color: "var(--fg-muted)",
    fontSize: "0.72rem",
    letterSpacing: "0.06em",
    marginTop: "0.25rem",
  },
};
