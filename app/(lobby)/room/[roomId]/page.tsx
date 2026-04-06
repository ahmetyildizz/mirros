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
  const { roomId }      = use(params);
  const router          = useRouter();
  const roomCode        = useGameStore((s) => s.roomCode);
  const storedPlayers   = useGameStore((s) => s.players);
  const isHost          = useGameStore((s) => s.isHostPlayer);

  const [players,     setPlayers]     = useState<Player[]>(storedPlayers);
  const [hostName,    setHostName]    = useState<string | null>(null);
  const [maxPlayers,  setMaxPlayers]  = useState<number>(4);
  const [gameMode,    setGameMode]    = useState<"SOCIAL" | "QUIZ">("SOCIAL");
  const [starting,    setStarting]    = useState(false);
  const [startError,  setStartError]  = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  const {
    setGameId, setGameState, setQuestion, setCurrentRound, setTotalRounds,
    setActiveRoundId, setMyRole, setAnswererId, setPlayers: storePlayers,
    setGameMode: storeGameMode, setRoomCode, setRoomId,
  } = useGameStore();

  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.players)    { setPlayers(data.players); storePlayers(data.players); }
        if (data.hostName)   setHostName(data.hostName);
        if (data.maxPlayers) setMaxPlayers(data.maxPlayers);
        if (data.gameMode)   setGameMode(data.gameMode);
        // Oda kodu ve roomId store'da yoksa (katılan oyuncu için fallback)
        if (data.code)       setRoomCode(data.code);
        if (data.id)         setRoomId(data.id);
      })
      .catch(() => {});
  }, [roomId, storePlayers, setRoomCode, setRoomId]);

  const handleCopy = useCallback(() => {
    if (!roomCode) return;
    const joinUrl = `${window.location.origin}/?code=${roomCode}`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [roomCode]);

  const handleWhatsApp = useCallback(() => {
    if (!roomCode) return;
    const joinUrl  = `${window.location.origin}/?code=${roomCode}`;
    const label    = gameMode === "QUIZ" ? "Bilgi yarışması" : "Mirros";
    const text     = encodeURIComponent(`${label} oynayalım! Oda kodu: ${roomCode}\n${joinUrl}`);
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
      setStarting(false); // spinner'ı kapat
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

  const canStart   = players.length >= 2;
  const isFull     = players.length >= maxPlayers;
  const modeEmoji  = gameMode === "QUIZ" ? "🧠" : "💜";
  const modeLabel  = gameMode === "QUIZ" ? "Bilgi Yarışması" : "Birbirini Tanı";
  const fillPct    = Math.round((players.length / maxPlayers) * 100);

  return (
    <main style={s.page}>
      {/* Aurora */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
      </div>

      <div style={s.outer}>
        {/* Üst başlık */}
        <div style={s.header} className="fade-up">
          <span className="gradient-text" style={s.logo}>mirros</span>
          <span style={s.modeBadge}>
            {modeEmoji} {modeLabel}
          </span>
        </div>

        {/* Oda kodu kartı */}
        <div style={s.codeCard} className="glass-card fade-up fade-up-1">
          <p style={s.codeLabel}>Oda Kodu</p>
          <p style={s.code}>{roomCode ?? "—"}</p>
          <div style={s.shareRow}>
            <button
              onClick={handleCopy}
              className="btn-ghost"
              style={s.shareBtn}
            >
              {copied ? "✓ Kopyalandı!" : "📋 Linki Kopyala"}
            </button>
            <button
              onClick={handleWhatsApp}
              style={{ ...s.shareBtn, background: "#25D366", color: "#fff", border: "none", borderRadius: 14, fontWeight: 600, cursor: "pointer" }}
            >
              WhatsApp
            </button>
          </div>
        </div>

        {/* Oyuncu listesi */}
        <div style={s.playerCard} className="glass-card fade-up fade-up-2">
          {/* Doluluk çubuğu */}
          <div style={s.progressWrap}>
            <div style={s.progressHeader}>
              <span style={s.progressLabel}>
                {isFull ? "🎉 Oda doldu!" : `${players.length} / ${maxPlayers} oyuncu`}
              </span>
              {players.length < 2 && (
                <span style={s.progressHint}>en az 2 kişi gerekli</span>
              )}
            </div>
            <div style={s.progressTrack}>
              <div style={{ ...s.progressFill, width: `${fillPct}%` }} />
            </div>
          </div>

          {/* Oyuncular */}
          <div style={s.playerList}>
            {players.map((p, i) => (
              <div key={p.id} style={s.playerRow} className="fade-up" >
                <div style={{ ...s.avatar, animationDelay: `${i * 60}ms` }}>
                  {(p.username ?? "?")[0].toUpperCase()}
                </div>
                <span style={s.playerName}>{p.username}</span>
                {p.username === hostName && (
                  <span style={s.hostBadge}>Host</span>
                )}
                <span style={s.checkmark}>✓</span>
              </div>
            ))}

            {/* Beklenen slotlar */}
            {Array.from({ length: Math.max(0, Math.min(3, maxPlayers - players.length)) }).map((_, i) => (
              <div key={`wait-${i}`} style={s.waitRow}>
                <div style={s.avatarEmpty}>?</div>
                <span style={s.waitText}>Bekleniyor</span>
                <div style={s.dots}>
                  {[0, 180, 360].map((d) => (
                    <span key={d} style={{ ...s.dot, animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Başlat / Bekle */}
        <div style={s.actionWrap} className="fade-up fade-up-3">
          {isHost ? (
            <>
              <button
                onClick={handleStartGame}
                disabled={starting || !canStart}
                className="btn-gradient"
                style={{ ...s.startBtn, opacity: canStart ? 1 : 0.45 }}
              >
                {starting ? (
                  <span style={s.startInner}>
                    <span style={s.spinner} />
                    Başlatılıyor...
                  </span>
                ) : (
                  `Oyunu Başlat →`
                )}
              </button>
              {startError && <p style={s.errText}>{startError}</p>}
            </>
          ) : (
            <div style={s.waitingHost}>
              <div style={s.waitingOrb} />
              <p style={s.waitingText}>
                <strong style={{ color: "var(--fg-primary)" }}>{hostName ?? "Host"}</strong>
                {" "}oyunu başlatıyor...
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const s = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem 1.25rem",
    position: "relative" as const,
    zIndex: 1,
  },
  outer: {
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },

  /* Başlık */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.25rem",
  },
  logo:      { fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.04em" },
  modeBadge: {
    background: "var(--bg-glass)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "0.25rem 0.75rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "var(--fg-secondary)",
    backdropFilter: "blur(8px)",
  },

  /* Kod kartı */
  codeCard: {
    padding: "1.25rem 1.25rem 1rem",
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  codeLabel: { color: "var(--fg-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em" },
  code:      {
    fontSize: "2.8rem",
    fontWeight: 800,
    letterSpacing: "0.22em",
    background: "var(--grad-text)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "shimmer 4s linear infinite",
    lineHeight: 1.1,
  },
  shareRow: { display: "flex", gap: "0.5rem" },
  shareBtn: { flex: 1, padding: "0.6rem 0.5rem", fontSize: "0.8rem", fontFamily: "inherit" },

  /* Oyuncu kartı */
  playerCard: { padding: "1rem 1.25rem", display: "flex", flexDirection: "column" as const, gap: "0.875rem" },

  progressWrap:   { display: "flex", flexDirection: "column" as const, gap: "0.4rem" },
  progressHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  progressLabel:  { color: "var(--fg-primary)", fontSize: "0.82rem", fontWeight: 700 },
  progressHint:   { color: "var(--fg-muted)", fontSize: "0.72rem" },
  progressTrack:  { height: 4, borderRadius: 4, background: "var(--fg-muted)", overflow: "hidden" as const },
  progressFill:   {
    height: "100%",
    borderRadius: 4,
    background: "var(--grad)",
    transition: "width 0.4s ease",
  },

  playerList: { display: "flex", flexDirection: "column" as const, gap: "0.45rem" },
  playerRow:  { display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.35rem 0" },
  waitRow:    { display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.35rem 0", opacity: 0.5 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "var(--grad)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.85rem",
    flexShrink: 0,
    boxShadow: "0 2px 8px var(--accent-glow)",
  },
  avatarEmpty: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "var(--bg-elevated)",
    border: "1px dashed var(--fg-muted)",
    color: "var(--fg-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.85rem",
    flexShrink: 0,
  },
  playerName: { color: "var(--fg-primary)", fontSize: "0.95rem", fontWeight: 600, flex: 1 },
  waitText:   { color: "var(--fg-muted)", fontSize: "0.88rem", flex: 1 },
  hostBadge: {
    background: "var(--accent-dim)",
    color: "var(--accent)",
    border: "1px solid rgba(168,85,247,0.3)",
    borderRadius: 6,
    padding: "0.1rem 0.45rem",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  checkmark: { color: "var(--exact)", fontSize: "0.9rem" },
  dots: { display: "flex", gap: "0.25rem" },
  dot:  {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--fg-muted)",
    display: "inline-block",
    animation: "pulse-dot 1.2s ease-in-out infinite",
  },

  /* Aksiyon */
  actionWrap: { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  startBtn:   { width: "100%", padding: "0.95rem", fontSize: "1rem", fontFamily: "inherit" },
  startInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    display: "inline-block",
    animation: "spin-slow 0.8s linear infinite",
  },
  errText: { color: "var(--wrong)", fontSize: "0.8rem", textAlign: "center" as const },

  waitingHost: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    padding: "0.875rem",
    background: "var(--bg-glass)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  waitingOrb: {
    position: "absolute" as const,
    inset: 0,
    background: "radial-gradient(ellipse at center, rgba(168,85,247,0.06) 0%, transparent 70%)",
  },
  waitingText: {
    color: "var(--fg-secondary)",
    fontSize: "0.88rem",
    textAlign: "center" as const,
    position: "relative" as const,
    zIndex: 1,
  },
};
