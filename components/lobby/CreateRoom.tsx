"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onCreated: (roomId: string, code: string) => void;
}

type GameMode = "SOCIAL" | "QUIZ";
type AgeGroup = "CHILD" | "ADULT" | "WISE";

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 8, 10];

export function CreateRoom({ onCreated }: Props) {
  const [step, setStep]         = useState<"mode" | "config">("mode");
  const [mode, setMode]         = useState<GameMode | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("ADULT");
  const [maxPlayers, setMax]    = useState(4);
  const [loading, setLoading]   = useState(false);

  const handleCreate = async () => {
    if (!mode) return;
    setLoading(true);
    const res = await fetch("/api/rooms", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ gameMode: mode, ageGroup: mode === "QUIZ" ? ageGroup : undefined, maxPlayers }),
    });
    if (res.ok) {
      const data = await res.json();
      onCreated(data.id, data.code);
    } else if (res.status === 401) {
      window.location.href = "/login";
    }
    setLoading(false);
  };

  if (step === "mode") {
    return (
      <div style={s.container}>
        <p style={s.label}>Oyun türü seç</p>
        <div style={s.modeRow}>
          <button style={{ ...s.modeCard, ...(mode === "SOCIAL" ? s.modeCardActive : {}) }} onClick={() => setMode("SOCIAL")}>
            <span style={s.modeEmoji}>💜</span>
            <span style={s.modeTitle}>Birbirini Tanı</span>
            <span style={s.modeDesc}>Birbirinizi ne kadar tanıyorsunuz?</span>
          </button>
          <button style={{ ...s.modeCard, ...(mode === "QUIZ" ? s.modeCardActive : {}) }} onClick={() => setMode("QUIZ")}>
            <span style={s.modeEmoji}>🧠</span>
            <span style={s.modeTitle}>Bilgi Yarışması</span>
            <span style={s.modeDesc}>Genel kültür soruları</span>
          </button>
        </div>

        {mode === "QUIZ" && (
          <div style={s.ageRow}>
            <p style={s.subLabel}>Yaş grubu</p>
            <div style={s.chips}>
              {(["CHILD","ADULT","WISE"] as AgeGroup[]).map((g) => (
                <button key={g} style={{ ...s.chip, ...(ageGroup === g ? s.chipActive : {}) }} onClick={() => setAgeGroup(g)}>
                  {g === "CHILD" ? "👶 Çocuk" : g === "ADULT" ? "🧑 Genç/Yetişkin" : "🦉 Bilge"}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode && (
          <Button onClick={() => setStep("config")} style={s.nextBtn}>
            Devam →
          </Button>
        )}
      </div>
    );
  }

  return (
    <div style={s.container}>
      <button onClick={() => setStep("mode")} style={s.backBtn}>← Geri</button>
      <p style={s.label}>Kaç kişi oynayacak?</p>
      <div style={s.playerGrid}>
        {PLAYER_OPTIONS.map((n) => (
          <button key={n} style={{ ...s.playerChip, ...(maxPlayers === n ? s.chipActive : {}) }} onClick={() => setMax(n)}>
            {n}
          </button>
        ))}
      </div>
      <p style={s.hint}>
        {maxPlayers} kişi dolunca oyun otomatik başlar.
        Odayı kuran daha erken de başlatabilir.
      </p>
      <Button onClick={handleCreate} disabled={loading} style={s.startBtn}>
        {loading ? "Oluşturuluyor..." : "Odayı Kur"}
      </Button>
    </div>
  );
}

const s = {
  container: { display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
  label:     { color: "var(--fg-secondary)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  subLabel:  { color: "var(--fg-secondary)", fontSize: "0.75rem", marginBottom: "0.35rem" },
  hint:      { color: "var(--fg-muted)", fontSize: "0.78rem", textAlign: "center" as const },
  modeRow:   { display: "flex", gap: "0.6rem" },
  modeCard:  { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.3rem", padding: "1rem 0.5rem", background: "var(--bg-elevated)", border: "2px solid transparent", borderRadius: 12, cursor: "pointer" },
  modeCardActive: { borderColor: "var(--accent)", background: "var(--bg-elevated)" },
  modeEmoji: { fontSize: "1.8rem" },
  modeTitle: { color: "var(--fg-primary)", fontWeight: 700, fontSize: "0.9rem" },
  modeDesc:  { color: "var(--fg-secondary)", fontSize: "0.72rem", textAlign: "center" as const },
  ageRow:    { padding: "0.6rem", background: "var(--bg-elevated)", borderRadius: 10 },
  chips:     { display: "flex", gap: "0.4rem", flexWrap: "wrap" as const },
  chip:      { flex: 1, padding: "0.45rem 0.5rem", background: "var(--bg-base)", color: "var(--fg-secondary)", border: "1px solid var(--fg-muted)", borderRadius: 8, fontWeight: 500, fontSize: "0.78rem", cursor: "pointer", textAlign: "center" as const, minWidth: 90 },
  chipActive:{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" },
  playerGrid:{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const },
  playerChip:{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", color: "var(--fg-secondary)", border: "2px solid transparent", borderRadius: 10, fontWeight: 700, fontSize: "1rem", cursor: "pointer" },
  backBtn:   { background: "none", border: "none", color: "var(--fg-secondary)", cursor: "pointer", fontSize: "0.85rem", textAlign: "left" as const, padding: 0 },
  nextBtn:   { background: "var(--accent)", color: "#fff", borderRadius: 12, fontWeight: 600, padding: "0.875rem", fontSize: "1rem", width: "100%" },
  startBtn:  { background: "var(--accent)", color: "#fff", borderRadius: 12, fontWeight: 700, padding: "0.875rem", fontSize: "1rem", width: "100%" },
};
