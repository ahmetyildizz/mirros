"use client";

import { useState } from "react";

interface Props {
  onJoined:     (roomId: string, roomCode: string) => void;
  initialCode?: string;
}

type AgeGroup = "CHILD" | "ADULT" | "WISE";

const AGE_OPTIONS: { value: AgeGroup; emoji: string; label: string; desc: string }[] = [
  { value: "CHILD", emoji: "👶", label: "Çocuk",          desc: "13 yaş altı" },
  { value: "ADULT", emoji: "🧑", label: "Genç/Yetişkin",  desc: "13–60 yaş" },
  { value: "WISE",  emoji: "🦉", label: "Bilge",           desc: "60+ yaş" },
];

export function JoinRoom({ onJoined, initialCode = "" }: Props) {
  const [step,     setStep]    = useState<"code" | "age">("code");
  const [code,     setCode]    = useState(initialCode);
  const [ageGroup, setAge]     = useState<AgeGroup>("ADULT");
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");

  const handleCodeNext = () => {
    if (code.trim().length < 4) { setError("Geçerli bir kod gir."); return; }
    setError("");
    setStep("age");
  };

  const handleJoin = async () => {
    setError("");
    setLoading(true);
    const res = await fetch("/api/rooms/join", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ code: code.trim(), ageGroup }),
    });
    if (res.ok) {
      const data = await res.json();
      onJoined(data.id, data.code);
    } else if (res.status === 401) {
      window.location.href = "/login";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Bir hata oluştu.");
      setStep("code");
    }
    setLoading(false);
  };

  /* ── YAŞ GRUBU ADIMI ──────────────────────────────────── */
  if (step === "age") {
    return (
      <div style={s.wrap}>
        <button onClick={() => setStep("code")} style={s.backBtn}>← Geri</button>
        <p style={s.label}>Senin yaş grubun</p>

        <div style={s.ageGrid}>
          {AGE_OPTIONS.map(({ value, emoji, label, desc }) => (
            <button
              key={value}
              onClick={() => setAge(value)}
              style={{
                ...s.ageCard,
                ...(ageGroup === value ? s.ageCardActive : {}),
              }}
            >
              <span style={s.ageEmoji}>{emoji}</span>
              <span style={s.ageLabel}>{label}</span>
              <span style={s.ageDesc}>{desc}</span>
            </button>
          ))}
        </div>

        {error && <div style={s.errorBox}><span>⚠️</span><span>{error}</span></div>}

        <button
          onClick={handleJoin}
          disabled={loading}
          className="btn-gradient"
          style={s.btn}
        >
          {loading ? "Katılınıyor..." : "Odaya Katıl →"}
        </button>
      </div>
    );
  }

  /* ── KOD ADIMI ────────────────────────────────────────── */
  return (
    <div style={s.wrap}>
      <div style={s.inputWrap}>
        <span style={s.inputIcon}>🔑</span>
        <input
          className="input-glass"
          style={s.codeInput}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleCodeNext()}
          placeholder="Oda kodu  (örn. ABC123)"
          maxLength={8}
          autoCapitalize="characters"
        />
      </div>
      {error && <div style={s.errorBox}><span>⚠️</span><span>{error}</span></div>}
      <button
        onClick={handleCodeNext}
        disabled={!code.trim()}
        className="btn-ghost"
        style={s.btn}
      >
        Devam →
      </button>
    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column" as const, gap: "0.75rem" },

  label: {
    color: "var(--fg-muted)",
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "var(--fg-secondary)",
    cursor: "pointer",
    fontSize: "0.85rem",
    textAlign: "left" as const,
    padding: 0,
    fontFamily: "inherit",
    fontWeight: 600,
  },
  btn: {
    width: "100%",
    padding: "0.875rem",
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: 10,
    padding: "0.55rem 0.875rem",
    color: "#FC8181",
    fontSize: "0.82rem",
    fontWeight: 500,
  },

  /* Kod input */
  inputWrap: { position: "relative" as const },
  inputIcon: {
    position: "absolute" as const,
    left: "0.875rem",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "1rem",
    lineHeight: 1,
    pointerEvents: "none" as const,
  },
  codeInput: {
    width: "100%",
    padding: "0.875rem 1rem 0.875rem 2.75rem",
    fontSize: "1.05rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontFamily: "inherit",
    fontWeight: 700,
  },

  /* Yaş seçimi */
  ageGrid: { display: "flex", gap: "0.5rem" },
  ageCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.2rem",
    padding: "0.875rem 0.4rem",
    background: "var(--bg-glass)",
    border: "1.5px solid var(--border)",
    borderRadius: 14,
    cursor: "pointer",
    textAlign: "center" as const,
    backdropFilter: "blur(8px)",
    transition: "border-color 0.15s, background 0.15s",
    fontFamily: "inherit",
  },
  ageCardActive: {
    borderColor: "rgba(168,85,247,0.5)",
    background: "var(--accent-dim)",
    boxShadow: "0 0 16px rgba(168,85,247,0.15)",
  },
  ageEmoji: { fontSize: "1.75rem", lineHeight: 1 },
  ageLabel: { color: "var(--fg-primary)", fontWeight: 700, fontSize: "0.8rem" },
  ageDesc:  { color: "var(--fg-muted)", fontSize: "0.68rem" },
};
