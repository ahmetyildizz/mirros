"use client";

import { useRouter } from "next/navigation";
import { CreateRoom } from "@/components/lobby/CreateRoom";
import { JoinRoom } from "@/components/lobby/JoinRoom";
import { useGameStore } from "@/store/game.store";

export default function LobbyPage() {
  const router = useRouter();
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
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: "var(--accent)",
              letterSpacing: "-0.04em",
            }}
          >
            mirros
          </h1>
          <p style={{ color: "var(--fg-secondary)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Beni ne kadar tanıyorsun?
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <CreateRoom onCreated={handleCreated} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--fg-muted)" }} />
          <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>veya</span>
          <div style={{ flex: 1, height: 1, background: "var(--fg-muted)" }} />
        </div>

        <JoinRoom onJoined={handleJoined} />
      </div>
    </main>
  );
}
