"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";
import { useGameStore } from "@/store/game.store";
import type { Player } from "@/store/game.store";

interface GameStartedPayload {
  gameId:           string;
  gameMode:         "SOCIAL" | "QUIZ";
  roundId:          string;
  roundNumber:      number;
  totalRounds:      number;
  questionId:       string;
  questionText:     string;
  questionCategory: string;
  questionOptions:  string[] | null;
  answererId:       string | null;
  players:          Player[];
}

interface PlayerJoinedPayload {
  userId:   string;
  username: string;
  players:  Player[];
}

export default function WaitingRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId }  = use(params);
  const router      = useRouter();
  const roomCode    = useGameStore((s) => s.roomCode);
  const storedPlayers = useGameStore((s) => s.players);
  const isHost      = useGameStore((s) => s.isHostPlayer);

  const [players, setPlayers]         = useState<Player[]>(storedPlayers);
  const [hostName, setHostName]       = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers]   = useState<number>(4);
  const [gameMode, setGameMode]       = useState<"SOCIAL" | "QUIZ">("SOCIAL");
  const [starting, setStarting]       = useState(false);
  const [startError, setStartError]   = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  const { setGameId, setGameState, setQuestion, setCurrentRound, setTotalRounds,
          setActiveRoundId, setMyRole, setAnswererId, setPlayers: storePlayers,
          setGameMode: storeGameMode } = useGameStore();

  // İlk yüklemede oda bilgilerini çek
  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.players) {
          setPlayers(data.players);
          storePlayers(data.players);
        }
        if (data.hostName)   setHostName(data.hostName);
        if (data.maxPlayers) setMaxPlayers(data.maxPlayers);
        if (data.gameMode)   setGameMode(data.gameMode);
      })
      .catch(() => {});
  }, [roomId, storePlayers]);

  const handleCopy = useCallback(() => {
    if (!roomCode) return;
    const joinUrl = `${window.location.origin}/?code=${roomCode}`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomCode]);

  const handleWhatsApp = useCallback(() => {
    if (!roomCode) return;
    const joinUrl = `${window.location.origin}/?code=${roomCode}`;
    const label   = gameMode === "QUIZ" ? "Bilgi yarışması" : "Mirros";
    const text    = encodeURIComponent(`${label} oynayalım! Oda kodu: ${roomCode}\n${joinUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [roomCode, gameMode]);

  useEffect(() => {
    const pusher  = getPusherClient();
    const channel = pusher.subscribe(`room-${roomId}`);

    channel.bind("player-joined", (data: PlayerJoinedPayload) => {
      setPlayers(data.players);
      storePlayers(data.players);
    });

    channel.bind("game-started", (data: GameStartedPayload) => {
      setGameId(data.gameId);
      storeGameMode(data.gameMode);
      setActiveRoundId(data.roundId);
      setCurrentRound(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setQuestion({ id: data.questionId, text: data.questionText, category: data.questionCategory, options: data.questionOptions });
      setAnswererId(data.answererId ?? null);
      storePlayers(data.players);
      setMyRole(null);
      setGameState("ANSWERING");
      router.push(`/game/${roomId}`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, router, setGameId, setGameState, setQuestion, setCurrentRound, setTotalRounds,
      setActiveRoundId, setMyRole, setAnswererId, storePlayers, storeGameMode]);

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

  const canStart  = players.length >= 2;
  const isFull    = players.length >= maxPlayers;
  const modeLabel = gameMode === "QUIZ" ? "🧠 Bilgi Yarışması" : "💜 Birbirini Tanı";

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>mirros</h1>
        <span style={styles.modeBadge}>{modeLabel}</span>

        {/* Oda kodu + paylaş */}
        <div style={styles.codeBox}>
          <p style={styles.label}>Oda kodu</p>
          <p style={styles.code}>{roomCode ?? "—"}</p>
          <div style={styles.shareRow}>
            <button onClick={handleCopy} style={styles.shareBtn}>
              {copied ? "✓ Kopyalandı" : "📋 Linki Kopyala"}
            </button>
            <button onClick={handleWhatsApp} style={{ ...styles.shareBtn, background: "#25D366", color: "#fff", borderColor: "#25D366" }}>
              WhatsApp
            </button>
          </div>
        </div>

        {/* Oyuncu listesi */}
        <div style={styles.playerList}>
          <p style={styles.playerCount}>
            {players.length}/{maxPlayers} oyuncu
            {isFull ? " · Oda doldu, başlıyor!" : players.length < 2 ? " · en az 2 kişi gerekli" : ""}
          </p>
          {players.map((p) => (
            <div key={p.id} style={styles.playerRow}>
              <div style={styles.avatar}>{(p.username ?? "?")[0].toUpperCase()}</div>
              <span style={styles.playerName}>{p.username}</span>
              {p.username === hostName && <span style={styles.hostBadge}>{hostName}</span>}
              <span style={styles.checkmark}>✓</span>
            </div>
          ))}
          {players.length < maxPlayers && (
            <div style={styles.waitingRow}>
              <div style={{ ...styles.avatar, background: "var(--bg-elevated)", color: "var(--fg-muted)" }}>?</div>
              <span style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>Bekleniyor...</span>
              <div style={styles.dots}>
                {[0, 200, 400].map((d) => (
                  <span key={d} style={{ ...styles.dot, animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Başlat (sadece host) */}
        {isHost && (
          <div style={{ width: "100%", marginTop: "0.5rem" }}>
            <button
              onClick={handleStartGame}
              disabled={starting || !canStart}
              style={{
                ...styles.startBtn,
                opacity: canStart ? 1 : 0.4,
                cursor: canStart ? "pointer" : "not-allowed",
              }}
            >
              {starting ? "Başlatılıyor..." : `Oyunu Başlat (${players.length} oyuncu)`}
            </button>
            {startError && <p style={{ color: "var(--wrong)", fontSize: "0.8rem", marginTop: "0.5rem", textAlign: "center" }}>{startError}</p>}
          </div>
        )}
        {!isHost && (
          <p style={styles.hint}>
            <strong>{hostName ?? "Host"}</strong> oyunu başlatıyor...
          </p>
        )}
      </div>
    </main>
  );
}

const styles = {
  page:        { minHeight: "100dvh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" },
  card:        { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "1rem", width: "100%", maxWidth: 360 },
  logo:        { color: "var(--accent)", fontWeight: 800, fontSize: "1.5rem" },
  modeBadge:   { background: "var(--bg-elevated)", color: "var(--fg-secondary)", borderRadius: 8, padding: "0.2rem 0.6rem", fontSize: "0.78rem", fontWeight: 600 },
  codeBox:     { textAlign: "center" as const, width: "100%" },
  label:       { color: "var(--fg-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" },
  code:        { color: "var(--fg-primary)", fontWeight: 800, fontSize: "2.5rem", letterSpacing: "0.2em", fontVariantNumeric: "tabular-nums" },
  hint:        { color: "var(--fg-secondary)", fontSize: "0.8rem", textAlign: "center" as const },
  shareRow:    { display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "0.5rem" },
  shareBtn:    { flex: 1, padding: "0.5rem 0.75rem", background: "var(--bg-elevated)", color: "var(--fg-primary)", border: "1px solid var(--fg-muted)", borderRadius: 8, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" },
  playerList:  { width: "100%", background: "var(--bg-elevated)", borderRadius: 12, padding: "0.75rem", display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  playerCount: { color: "var(--fg-secondary)", fontSize: "0.75rem", marginBottom: "0.25rem" },
  playerRow:   { display: "flex", alignItems: "center", gap: "0.6rem" },
  waitingRow:  { display: "flex", alignItems: "center", gap: "0.6rem" },
  avatar:      { width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 },
  playerName:  { color: "var(--fg-primary)", fontSize: "0.95rem", fontWeight: 500, flex: 1 },
  hostBadge:   { background: "var(--accent)", color: "#fff", borderRadius: 4, padding: "0.1rem 0.4rem", fontSize: "0.7rem", fontWeight: 600 },
  checkmark:   { color: "var(--exact)", fontSize: "1rem" },
  dots:        { display: "flex", gap: "0.3rem" },
  dot:         { width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 1.2s ease-in-out infinite" },
  startBtn:    { width: "100%", padding: "0.875rem", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "1rem" },
};
