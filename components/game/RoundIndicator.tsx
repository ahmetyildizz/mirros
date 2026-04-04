"use client";

interface Props {
  total: number;
  current: number;
}

export function RoundIndicator({ total, current }: Props) {
  return (
    <div className="flex gap-2 items-center justify-center py-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: i < current ? "var(--accent)" : "var(--fg-muted)",
            display: "inline-block",
            transition: "background-color 0.3s",
          }}
        />
      ))}
    </div>
  );
}
