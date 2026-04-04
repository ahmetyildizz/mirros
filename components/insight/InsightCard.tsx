"use client";

interface Props {
  text: string;
  playerA: string;
  playerB: string;
}

export function InsightCard({ text, playerA, playerB }: Props) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--accent-dim), var(--bg-elevated))",
        borderRadius: 16,
        padding: "1.5rem",
        border: "1px solid var(--accent)",
      }}
    >
      <p style={{ color: "var(--fg-muted)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
        {playerA} & {playerB}
      </p>
      <p style={{ color: "var(--fg-primary)", fontSize: "1rem", fontStyle: "italic", lineHeight: 1.6 }}>
        "{text}"
      </p>
    </div>
  );
}
