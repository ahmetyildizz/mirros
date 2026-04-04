"use client";

interface Props {
  text: string;
  category: string;
  roundNumber: number;
}

export function QuestionCard({ text, category, roundNumber }: Props) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--bg-elevated)",
        borderRadius: 16,
        padding: "1.5rem",
      }}
    >
      <p style={{ color: "var(--fg-muted)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
        Round {roundNumber} · {category}
      </p>
      <p style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--fg-primary)" }}>
        {text}
      </p>
    </div>
  );
}
