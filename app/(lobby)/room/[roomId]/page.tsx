"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";
import { useGameStore } from "@/store/game.store";

interface GameStartedPayload {
  gameId:           string;
  roundId:          string;
  roundNumber:      number;
  questionId:       string;
  questionText:     string;
  questionCategory: string;
  answererId:       string;
  guesserId:        string;
}

export default function WaitingRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router     = useRouter();
  const roomCode   = useGameStore((s) => s.roomCode);
  const isHost     = roomCode !== null;
  const [ready, setReady]           = useState(false);
  const [starting, setStarting]     = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const { setGameId, setGameState, setQuestion, setCurrentRound, setActiveRoundId, setMyRole } =
    useGameStore();

  useEffect(() => {
    const pusher  = getPusherClient();
    const channel = pusher.subscribe(`room-${roomId}`);

    channel.bind("player-joined", () => {
      setReady(true);
    });

    channel.bind("game-started", (data: GameStartedPayload) => {
      setGameId(data.gameId);
      setActiveRoundId(data.roundId);
      setCurrentRound(data.roundNumber);
      setQuestion({ id: data.questionId, text: data.questionText, category: data.questionCategory });
      // Round 1: host=answerer, guest=guesser (server resolveRoles logic)
      const hostTab = useGameStore.getState().isHostPlayer;
      setMyRole(hostTab ? "answerer" : "guesser");
      setGameState("ANSWERING");
      router.push(`/game/${roomId}`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, router, setGameId, setGameState, setQuestion, setCurrentRound, setActiveRoundId, setMyRole, setUser]);

  const handleStartGame = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStartError(data.error ?? "Oyun başlatılamadı");
        setStarting(false);
      }
    } catch {
      setStartError("Bağlantı hatası");
      setStarting(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>mirros</h1>

        {!ready ? (
          <>
            <p style={styles.label}>Oda kodu</p>
            <p style={styles.code}>{roomCode ?? "—"}</p>
            <p style={styles.hint}>Arkadaşın bu kodu girerek katılabilir</p>
            <div style={styles.dots}>
              {[0, 200, 400].map((d) => (
                <span key={d} style={{ ...styles.dot, animationDelay: `${d}ms` }} />
              ))}
            </div>
            <p style={styles.waiting}>Bekleniyor...</p>
          </>
        ) : (
          <>
            <p style={{ color: "var(--exact)", fontSize: "2rem" }}>✓</p>
            <p style={{ color: "var(--fg-primary)", fontWeight: 600, marginTop: "0.5rem" }}>
              Arkadaşın katıldı!
            </p>
            {isHost ? (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={starting}
                  style={styles.startBtn}
                >
                  {starting ? "Başlatılıyor..." : "Oyunu Başlat"}
                </button>
                {startError && <p style={{ color: "var(--wrong)", fontSize: "0.8rem" }}>{startError}</p>}
              </>
            ) : (
              <p style={styles.hint}>Host oyunu başlatıyor...</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

const styles = {
  page:     { minHeight: "100dvh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" },
  card:     { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.75rem", width: "100%", maxWidth: 340 },
  logo:     { color: "var(--accent)", fontWeight: 800, fontSize: "1.5rem", marginBottom: "1rem" },
  label:    { color: "var(--fg-secondary)", fontSize: "0.875rem" },
  code:     { color: "var(--fg-primary)", fontWeight: 800, fontSize: "2.5rem", letterSpacing: "0.15em" },
  hint:     { color: "var(--fg-secondary)", fontSize: "0.875rem", textAlign: "center" as const },
  dots:     { display: "flex", gap: "0.5rem", marginTop: "1.5rem" },
  dot:      { width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", display: "inline-block" },
  waiting:  { color: "var(--fg-secondary)", fontSize: "0.875rem" },
  startBtn: {
    marginTop: "1rem",
    padding: "0.75rem 2rem",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
  },
};
