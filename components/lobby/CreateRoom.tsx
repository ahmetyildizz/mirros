"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onCreated: (roomId: string, code: string) => void;
}

type GameMode = "SOCIAL" | "QUIZ";
type AgeGroup = "CHILD" | "ADULT" | "WISE";

interface Template {
  emoji:      string;
  label:      string;
  desc:       string;
  gameMode:   GameMode;
  ageGroup:   AgeGroup;
  maxPlayers: number;
}

const TEMPLATES: Template[] = [
  { emoji: "💑", label: "Çift Gecesi",      desc: "İkiniz birbirinizi ne kadar tanıyorsunuz?", gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 2  },
  { emoji: "👨‍👩‍👧‍👦", label: "Aile Toplantısı", desc: "Aile bağını güçlendirin, birlikte gülün",    gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 6  },
  { emoji: "🎉", label: "Doğum Günü",        desc: "Misafirler konuğu ne kadar tanıyor?",       gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8  },
  { emoji: "💼", label: "Takım Building",    desc: "Ekip arkadaşlarınızı keşfedin",             gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10 },
  { emoji: "🧠", label: "Bilgi Yarışması",   desc: "Eğlenceli sorular, komik cezalar",          gameMode: "QUIZ",   ageGroup: "ADULT", maxPlayers: 6  },
  { emoji: "✏️", label: "Özelleştir",        desc: "Mod, yaş grubu ve oyuncu sayısını seç",    gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 4  },
];

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 8, 10];

export function CreateRoom({ onCreated }: Props) {
  const [step, setStep]               = useState<"template" | "config">("template");
  const [selectedTemplate, setTemplate] = useState<Template | null>(null);
  const [mode, setMode]               = useState<GameMode>("SOCIAL");
  const [ageGroup, setAgeGroup]       = useState<AgeGroup>("ADULT");
  const [maxPlayers, setMax]          = useState(4);
  const [loading, setLoading]         = useState(false);

  const isCustom = selectedTemplate?.label === "Özelleştir";

  const handleSelectTemplate = (tpl: Template) => {
    setTemplate(tpl);
    setMode(tpl.gameMode);
    setAgeGroup(tpl.ageGroup);
    setMax(tpl.maxPlayers);
    if (tpl.label === "Özelleştir") {
      setStep("config");
    } else {
      // Şablon seçilince direkt oda kur
      handleCreate(tpl.gameMode, tpl.ageGroup, tpl.maxPlayers);
    }
  };

  const handleCreate = async (
    finalMode     = mode,
    finalAgeGroup = ageGroup,
    finalMax      = maxPlayers
  ) => {
    setLoading(true);
    const res = await fetch("/api/rooms", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ gameMode: finalMode, ageGroup: finalAgeGroup, maxPlayers: finalMax }),
    });
    if (res.ok) {
      const data = await res.json();
      onCreated(data.id, data.code);
    } else if (res.status === 401) {
      window.location.href = "/login";
    }
    setLoading(false);
  };

  if (step === "config") {
    return (
      <div style={s.container}>
        <button onClick={() => setStep("template")} style={s.backBtn}>← Geri</button>
        <p style={s.label}>Oyun modu</p>
        <div style={s.modeRow}>
          {(["SOCIAL", "QUIZ"] as GameMode[]).map((m) => (
            <button
              key={m}
              style={{ ...s.modeCard, ...(mode === m ? s.modeCardActive : {}) }}
              onClick={() => setMode(m)}
            >
              <span style={s.modeEmoji}>{m === "SOCIAL" ? "💜" : "🧠"}</span>
              <span style={s.modeTitle}>{m === "SOCIAL" ? "Birbirini Tanı" : "Bilgi Yarışması"}</span>
            </button>
          ))}
        </div>

        <p style={s.label}>Senin yaş grubun</p>
        <div style={s.chips}>
          {(["CHILD","ADULT","WISE"] as AgeGroup[]).map((g) => (
            <button key={g} style={{ ...s.chip, ...(ageGroup === g ? s.chipActive : {}) }} onClick={() => setAgeGroup(g)}>
              {g === "CHILD" ? "👶 Çocuk" : g === "ADULT" ? "🧑 Genç/Yetişkin" : "🦉 Bilge"}
            </button>
          ))}
        </div>

        <p style={s.label}>Kaç kişi?</p>
        <div style={s.playerGrid}>
          {PLAYER_OPTIONS.map((n) => (
            <button key={n} style={{ ...s.playerChip, ...(maxPlayers === n ? s.chipActive : {}) }} onClick={() => setMax(n)}>
              {n}
            </button>
          ))}
        </div>
        <p style={s.hint}>{maxPlayers} kişi dolunca oyun otomatik başlar.</p>

        <Button onClick={() => handleCreate()} disabled={loading} style={s.startBtn}>
          {loading ? "Oluşturuluyor..." : "Odayı Kur"}
        </Button>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <p style={s.label}>Nasıl bir gece?</p>
      <div style={s.templateGrid}>
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.label}
            style={s.templateCard}
            onClick={() => handleSelectTemplate(tpl)}
            disabled={loading}
          >
            <span style={s.tplEmoji}>{tpl.emoji}</span>
            <span style={s.tplLabel}>{tpl.label}</span>
            <span style={s.tplDesc}>{tpl.desc}</span>
          </button>
        ))}
      </div>
      {loading && <p style={{ color: "var(--fg-secondary)", fontSize: "0.85rem", textAlign: "center" }}>Oluşturuluyor...</p>}
    </div>
  );
}

const s = {
  container:    { display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
  label:        { color: "var(--fg-secondary)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  hint:         { color: "var(--fg-muted)", fontSize: "0.78rem", textAlign: "center" as const },
  backBtn:      { background: "none", border: "none", color: "var(--fg-secondary)", cursor: "pointer", fontSize: "0.85rem", textAlign: "left" as const, padding: 0 },
  startBtn:     { background: "var(--accent)", color: "#fff", borderRadius: 12, fontWeight: 700, padding: "0.875rem", fontSize: "1rem", width: "100%" },

  // Şablon grid
  templateGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" },
  templateCard: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.3rem", padding: "0.9rem 0.5rem", background: "var(--bg-elevated)", border: "2px solid transparent", borderRadius: 14, cursor: "pointer", transition: "border-color 0.15s", textAlign: "center" as const },
  tplEmoji:     { fontSize: "1.75rem" },
  tplLabel:     { color: "var(--fg-primary)", fontWeight: 700, fontSize: "0.88rem" },
  tplDesc:      { color: "var(--fg-secondary)", fontSize: "0.7rem", lineHeight: 1.3 },

  // Mod seçimi
  modeRow:      { display: "flex", gap: "0.6rem" },
  modeCard:     { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.3rem", padding: "1rem 0.5rem", background: "var(--bg-elevated)", border: "2px solid transparent", borderRadius: 12, cursor: "pointer" },
  modeCardActive:{ borderColor: "var(--accent)" },
  modeEmoji:    { fontSize: "1.6rem" },
  modeTitle:    { color: "var(--fg-primary)", fontWeight: 700, fontSize: "0.85rem" },

  // Chip'ler
  chips:        { display: "flex", gap: "0.4rem", flexWrap: "wrap" as const },
  chip:         { flex: 1, padding: "0.45rem 0.5rem", background: "var(--bg-elevated)", color: "var(--fg-secondary)", border: "1px solid var(--fg-muted)", borderRadius: 8, fontWeight: 500, fontSize: "0.78rem", cursor: "pointer", textAlign: "center" as const, minWidth: 90 },
  chipActive:   { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" },
  playerGrid:   { display: "flex", gap: "0.4rem", flexWrap: "wrap" as const },
  playerChip:   { width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", color: "var(--fg-secondary)", border: "2px solid transparent", borderRadius: 10, fontWeight: 700, fontSize: "1rem", cursor: "pointer" },
};
