"use client";

import { useState } from "react";

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
  color:      string;   /* accent rengi */
}

const TEMPLATES: Template[] = [
  { emoji: "💑", label: "Çift Gecesi",      desc: "İkiniz birbirinizi ne kadar tanıyorsunuz?", gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 2,  color: "#EC4899" },
  { emoji: "👨‍👩‍👧‍👦", label: "Aile Toplantısı", desc: "Aile bağını güçlendirin, birlikte gülün",    gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 6,  color: "#A855F7" },
  { emoji: "🎉", label: "Doğum Günü",        desc: "Misafirler konuğu ne kadar tanıyor?",       gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "#FB923C" },
  { emoji: "💼", label: "Takım Building",    desc: "Ekip arkadaşlarınızı keşfedin",             gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10, color: "#06B6D4" },
  { emoji: "🧠", label: "Bilgi Yarışması",   desc: "Eğlenceli sorular, komik cezalar",          gameMode: "QUIZ",   ageGroup: "ADULT", maxPlayers: 6,  color: "#4ADE80" },
  { emoji: "✏️", label: "Özelleştir",        desc: "Mod, yaş grubu ve oyuncu sayısını seç",    gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 4,  color: "#8888B0" },
];

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 8, 10];

export function CreateRoom({ onCreated }: Props) {
  const [step,     setStep]    = useState<"template" | "config">("template");
  const [selectedTpl, setTpl] = useState<Template | null>(null);
  const [mode,     setMode]   = useState<GameMode>("SOCIAL");
  const [ageGroup, setAge]    = useState<AgeGroup>("ADULT");
  const [maxPlayers, setMax]  = useState(4);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState<string | null>(null);

  const handleSelectTemplate = (tpl: Template) => {
    setError(null);
    setTpl(tpl);
    setMode(tpl.gameMode);
    setAge(tpl.ageGroup);
    setMax(tpl.maxPlayers);
    if (tpl.label === "Özelleştir") {
      setStep("config");
    } else {
      handleCreate(tpl.gameMode, tpl.ageGroup, tpl.maxPlayers);
    }
  };

  const handleCreate = async (
    finalMode = mode,
    finalAge  = ageGroup,
    finalMax  = maxPlayers,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ gameMode: finalMode, ageGroup: finalAge, maxPlayers: finalMax }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreated(data.id, data.code);
      } else if (res.status === 401) {
        window.location.href = "/login";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Oda oluşturulamadı. Tekrar dene.");
      }
    } catch {
      setError("Bağlantı hatası. İnternet bağlantını kontrol et.");
    }
    setLoading(false);
  };

  /* ── CONFIG ADIMI ─────────────────────────────────────── */
  if (step === "config") {
    return (
      <div style={s.wrap}>
        <button onClick={() => setStep("template")} style={s.backBtn}>
          ← Geri
        </button>

        <p style={s.sectionLabel}>Oyun modu</p>
        <div style={s.modeRow}>
          {(["SOCIAL", "QUIZ"] as GameMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                ...s.modeCard,
                ...(mode === m ? s.modeCardActive : {}),
              }}
            >
              <span style={s.modeEmoji}>{m === "SOCIAL" ? "💜" : "🧠"}</span>
              <span style={s.modeTitle}>{m === "SOCIAL" ? "Birbirini Tanı" : "Bilgi Yarışması"}</span>
            </button>
          ))}
        </div>

        <p style={s.sectionLabel}>Senin yaş grubun</p>
        <div style={s.chips}>
          {(["CHILD", "ADULT", "WISE"] as AgeGroup[]).map((g) => (
            <button
              key={g}
              onClick={() => setAge(g)}
              style={{ ...s.chip, ...(ageGroup === g ? s.chipActive : {}) }}
            >
              {g === "CHILD" ? "👶 Çocuk" : g === "ADULT" ? "🧑 Genç/Yetişkin" : "🦉 Bilge"}
            </button>
          ))}
        </div>

        <p style={s.sectionLabel}>Kaç kişi?</p>
        <div style={s.playerGrid}>
          {PLAYER_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setMax(n)}
              style={{ ...s.playerChip, ...(maxPlayers === n ? s.chipActive : {}) }}
            >
              {n}
            </button>
          ))}
        </div>
        <p style={s.hint}>{maxPlayers} kişi dolunca oyun otomatik başlar. Odayı kuran daha erken de başlatabilir.</p>

        {error && (
          <div style={s.errorBox}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <button
          onClick={() => handleCreate()}
          disabled={loading}
          className="btn-gradient"
          style={s.createBtn}
        >
          {loading ? "Oluşturuluyor..." : "Odayı Kur →"}
        </button>
      </div>
    );
  }

  /* ── ŞABLON ADIMI ─────────────────────────────────────── */
  return (
    <div style={s.wrap}>
      <p style={s.sectionLabel}>Nasıl bir gece?</p>
      <div style={s.grid}>
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.label}
            onClick={() => handleSelectTemplate(tpl)}
            disabled={loading}
            style={s.tplCard}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = tpl.color + "66";
              el.style.background  = tpl.color + "0D";
              el.style.transform   = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--border)";
              el.style.background  = "var(--bg-glass)";
              el.style.transform   = "translateY(0)";
            }}
          >
            <span style={{ ...s.tplOrb, background: tpl.color + "22" }}>
              <span style={s.tplEmoji}>{tpl.emoji}</span>
            </span>
            <span style={s.tplLabel}>{tpl.label}</span>
            <span style={s.tplDesc}>{tpl.desc}</span>
          </button>
        ))}
      </div>
      {loading && <p style={s.loadingText}>Oda oluşturuluyor...</p>}
      {error   && (
        <div style={s.errorBox}>
          <span>⚠️</span><span>{error}</span>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column" as const, gap: "0.75rem" },

  sectionLabel: {
    color: "var(--fg-muted)",
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  hint: { color: "var(--fg-muted)", fontSize: "0.75rem", textAlign: "center" as const },
  loadingText: { color: "var(--fg-secondary)", fontSize: "0.85rem", textAlign: "center" as const },

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
  createBtn: {
    width: "100%",
    padding: "0.95rem",
    fontSize: "1rem",
    fontFamily: "inherit",
    marginTop: "0.25rem",
  },

  /* Template grid */
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" },
  tplCard: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.4rem",
    padding: "1rem 0.6rem 0.875rem",
    background: "var(--bg-glass)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    cursor: "pointer",
    textAlign: "center" as const,
    backdropFilter: "blur(8px)",
    transition: "border-color 0.2s, background 0.2s, transform 0.15s",
    fontFamily: "inherit",
  },
  tplOrb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.1rem",
  },
  tplEmoji: { fontSize: "1.6rem", lineHeight: 1 },
  tplLabel: { color: "var(--fg-primary)", fontWeight: 700, fontSize: "0.85rem" },
  tplDesc:  { color: "var(--fg-secondary)", fontSize: "0.68rem", lineHeight: 1.35 },

  /* Mod seçimi */
  modeRow:       { display: "flex", gap: "0.6rem" },
  modeCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.875rem 0.5rem",
    background: "var(--bg-glass)",
    border: "1.5px solid var(--border)",
    borderRadius: 14,
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    fontFamily: "inherit",
  },
  modeCardActive: { borderColor: "var(--accent)", background: "var(--accent-dim)" },
  modeEmoji:      { fontSize: "1.5rem" },
  modeTitle:      { color: "var(--fg-primary)", fontWeight: 700, fontSize: "0.82rem" },

  /* Chip'ler */
  chips: { display: "flex", gap: "0.4rem", flexWrap: "wrap" as const },
  chip: {
    flex: 1,
    padding: "0.5rem 0.4rem",
    background: "var(--bg-glass)",
    color: "var(--fg-secondary)",
    border: "1.5px solid var(--border)",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: "0.78rem",
    cursor: "pointer",
    textAlign: "center" as const,
    minWidth: 90,
    fontFamily: "inherit",
    transition: "background 0.15s, border-color 0.15s, color 0.15s",
  },
  chipActive: { background: "var(--accent-dim)", color: "var(--accent)", borderColor: "rgba(168,85,247,0.4)" },

  /* Oyuncu sayısı */
  playerGrid: { display: "flex", gap: "0.4rem", flexWrap: "wrap" as const },
  playerChip: {
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-glass)",
    color: "var(--fg-secondary)",
    border: "1.5px solid var(--border)",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s, border-color 0.15s, color 0.15s",
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
};
