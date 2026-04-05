"use client";

import { useState } from "react";

interface Props {
  familiarity:       number;
  gameId:            string;
  funniestQuestion?: string;
  funniestAnswer?:   string;
}

export function ShareButton({ familiarity, gameId, funniestQuestion, funniestAnswer }: Props) {
  const [copied,      setCopied]      = useState(false);
  const [showCard,    setShowCard]    = useState(false);

  const emoji = familiarity >= 90 ? "🔥" : familiarity >= 70 ? "💜" : familiarity >= 50 ? "✨" : familiarity >= 30 ? "🌱" : "🌙";
  const shareText = `mirros'ta ${familiarity}% tanışıklık puanı aldık! ${emoji}\nSen de oyna: ${typeof window !== "undefined" ? window.location.origin : "https://mirros.vercel.app"}/results/${gameId}`;

  const handleNative = () => {
    if (typeof navigator === "undefined") return;
    if (navigator.share) {
      navigator.share({ title: "mirros sonuçlarım", text: shareText, url: `${window.location.origin}/results/${gameId}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={() => setShowCard(true)} style={btnStyle("var(--accent)")}>
          🖼️ Kart Oluştur
        </button>
        <button onClick={handleNative} style={btnStyle("var(--bg-elevated)", "var(--fg-primary)", "1px solid var(--fg-muted)")}>
          {copied ? "✓ Kopyalandı" : "Paylaş"}
        </button>
        <button onClick={handleWhatsApp} style={btnStyle("#25D366")}>
          WhatsApp
        </button>
      </div>

      {/* Paylaşılabilir kart modal */}
      {showCard && (
        <div
          style={modal.overlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCard(false); }}
        >
          <div style={modal.sheet}>
            <p style={modal.hint}>📸 Bu ekranı kaydet ve paylaş!</p>

            {/* KART — screenshot alınacak alan */}
            <div style={modal.card}>
              <div style={modal.cardBg} />
              <div style={modal.cardInner}>
                <span style={modal.logo}>mirros</span>
                <span style={modal.tagline}>beni ne kadar tanıyorsun?</span>

                <div style={modal.scoreCircle}>
                  <span style={modal.scoreEmoji}>{emoji}</span>
                  <span style={modal.scoreNum}>{familiarity}%</span>
                  <span style={modal.scoreLabel}>tanışıklık</span>
                </div>

                {funniestQuestion && funniestAnswer && (
                  <div style={modal.funniest}>
                    <span style={modal.funnyTag}>En komik an</span>
                    <p style={modal.funnyQ}>{funniestQuestion}</p>
                    <p style={modal.funnyA}>"{funniestAnswer}"</p>
                  </div>
                )}

                <span style={modal.cta}>mirros.vercel.app</span>
              </div>
            </div>

            <button onClick={() => setShowCard(false)} style={modal.closeBtn}>Kapat</button>
          </div>
        </div>
      )}
    </>
  );
}

function btnStyle(bg: string, color = "#fff", border?: string) {
  return {
    flex: 1,
    padding: "0.85rem 0.5rem",
    background: bg,
    color,
    border: border ?? "none",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
  } as const;
}

const ACCENT  = "#7C3AED";
const DARK_BG = "#0d0d0d";

const modal = {
  overlay:     { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" },
  sheet:       { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.75rem", width: "100%", maxWidth: 360 },
  hint:        { color: "#fff", fontSize: "0.85rem", fontWeight: 600, textAlign: "center" as const },

  // Kart tasarımı
  card:        { width: "100%", borderRadius: 20, overflow: "hidden" as const, position: "relative" as const, aspectRatio: "9/16" as unknown as number, maxHeight: 500 },
  cardBg:      { position: "absolute" as const, inset: 0, background: `linear-gradient(160deg, ${DARK_BG} 0%, #1a0a2e 50%, ${DARK_BG} 100%)` },
  cardInner:   { position: "relative" as const, zIndex: 1, height: "100%", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "1rem", padding: "2rem 1.5rem" },

  logo:        { color: ACCENT, fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.04em" },
  tagline:     { color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", marginTop: "-0.75rem" },

  scoreCircle: { width: 140, height: 140, borderRadius: "50%", border: `3px solid ${ACCENT}`, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", background: "rgba(124,58,237,0.12)" },
  scoreEmoji:  { fontSize: "1.8rem", lineHeight: 1 },
  scoreNum:    { color: ACCENT, fontWeight: 900, fontSize: "2.4rem", lineHeight: 1 },
  scoreLabel:  { color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", letterSpacing: "0.08em" },

  funniest:    { background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "0.75rem 1rem", width: "100%", display: "flex", flexDirection: "column" as const, gap: "0.3rem", textAlign: "center" as const },
  funnyTag:    { color: ACCENT, fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
  funnyQ:      { color: "rgba(255,255,255,0.65)", fontSize: "0.8rem" },
  funnyA:      { color: "#fff", fontWeight: 700, fontSize: "0.95rem" },

  cta:         { color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", marginTop: "0.5rem" },

  closeBtn:    { background: "var(--bg-elevated)", color: "var(--fg-primary)", border: "1px solid var(--fg-muted)", borderRadius: 12, padding: "0.75rem 2rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" },
};
