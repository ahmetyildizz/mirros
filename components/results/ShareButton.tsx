"use client";

import { useState } from "react";

interface Props {
  familiarity: number;
  gameId:      string;
}

export function ShareButton({ familiarity, gameId }: Props) {
  const [copied, setCopied] = useState(false);

  const text = `Mirros'ta ${familiarity}% tanışıklık puanı aldık! 🎯\nSen de oyna: ${window?.location?.origin ?? "https://mirros.vercel.app"}/results/${gameId}`;

  const handleNative = () => {
    if (navigator.share) {
      navigator.share({ title: "mirros sonuçlarım", text, url: `${window.location.origin}/results/${gameId}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button onClick={handleNative} style={btnStyle("#6C63FF")}>
        {copied ? "✓ Kopyalandı" : "Paylaş"}
      </button>
      <button onClick={handleWhatsApp} style={btnStyle("#25D366")}>
        WhatsApp
      </button>
    </div>
  );
}

function btnStyle(bg: string) {
  return {
    flex: 1,
    padding: "0.85rem",
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
  } as const;
}
