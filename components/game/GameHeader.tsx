"use client";

import { SoundToggle } from "./SoundToggle";

interface Props {
  roundNumber: number;
  totalRounds: number;
}

export function GameHeader({ roundNumber, totalRounds }: Props) {
  return (
    <div
      style={{
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        padding:        "0.75rem 0",
        borderBottom:   "1px solid var(--bg-elevated)",
      }}
    >
      <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: "1.1rem" }}>mirros</span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ color: "var(--fg-secondary)", fontSize: "0.875rem" }}>
          Round {roundNumber} / {totalRounds}
        </span>
        <SoundToggle />
      </div>
    </div>
  );
}
