"use client";

import type { MatchLevel } from "@/store/game.store";

const CONFIG: Record<MatchLevel, { label: string; color: string; points: number }> = {
  EXACT:  { label: "Tam Bildin!",  color: "var(--exact)", points: 10 },
  CLOSE:  { label: "Yakındı!",     color: "var(--close)", points: 5  },
  WRONG:  { label: "Yanlış",       color: "var(--wrong)", points: 0  },
};

interface Props {
  matchLevel: MatchLevel;
  answer: string;
  guess: string;
}

export function ScoreReveal({ matchLevel, answer, guess }: Props) {
  const cfg = CONFIG[matchLevel];
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: 16,
        padding: "1.5rem",
        textAlign: "center",
        border: `1px solid ${cfg.color}44`,
      }}
    >
      <p style={{ color: cfg.color, fontSize: "1.5rem", fontWeight: 700 }}>{cfg.label}</p>
      <p style={{ color: cfg.color, fontSize: "2rem", fontWeight: 800, fontFamily: "monospace" }}>
        +{cfg.points}
      </p>
      <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--fg-secondary)" }}>
        <p>Cevap: <span style={{ color: "var(--fg-primary)" }}>{answer}</span></p>
        <p>Tahmin: <span style={{ color: "var(--fg-primary)" }}>{guess}</span></p>
      </div>
    </div>
  );
}
