"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onJoined:     (roomId: string) => void;
  initialCode?: string;
}

type AgeGroup = "CHILD" | "ADULT" | "WISE";

const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "CHILD", label: "👶 Çocuk" },
  { value: "ADULT", label: "🧑 Genç/Yetişkin" },
  { value: "WISE",  label: "🦉 Bilge" },
];

export function JoinRoom({ onJoined, initialCode = "" }: Props) {
  const [step, setStep]         = useState<"code" | "age">("code");
  const [code, setCode]         = useState(initialCode);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("ADULT");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleCodeNext = () => {
    if (code.trim().length < 4) {
      setError("Geçerli bir kod gir.");
      return;
    }
    setError("");
    setStep("age");
  };

  const handleJoin = async () => {
    setError("");
    setLoading(true);
    const res = await fetch("/api/rooms/join", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ code: code.trim(), ageGroup }),
    });
    if (res.ok) {
      const data = await res.json();
      onJoined(data.id);
    } else if (res.status === 401) {
      window.location.href = "/login";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Bir hata oluştu.");
      setStep("code");
    }
    setLoading(false);
  };

  if (step === "age") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <button onClick={() => setStep("code")} style={s.backBtn}>← Geri</button>
        <p style={s.label}>Senin yaş grubun</p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {AGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              style={{ ...s.chip, ...(ageGroup === value ? s.chipActive : {}) }}
              onClick={() => setAgeGroup(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {error && <p style={{ color: "var(--wrong)", fontSize: "0.8rem" }}>{error}</p>}
        <Button
          onClick={handleJoin}
          disabled={loading}
          style={s.btn}
        >
          {loading ? "Katılınıyor..." : "Odaya Katıl"}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && handleCodeNext()}
        placeholder="Oda kodu (örn. ABC123)"
        maxLength={8}
        style={{
          background:      "var(--bg-elevated)",
          border:          `1px solid ${error ? "var(--wrong)" : "var(--fg-muted)"}`,
          color:           "var(--fg-primary)",
          borderRadius:    12,
          padding:         "0.75rem 1rem",
          letterSpacing:   "0.1em",
          textTransform:   "uppercase",
          fontSize:        "1rem",
        }}
      />
      {error && <p style={{ color: "var(--wrong)", fontSize: "0.8rem" }}>{error}</p>}
      <Button
        onClick={handleCodeNext}
        disabled={!code.trim()}
        style={s.btn}
      >
        Devam →
      </Button>
    </div>
  );
}

const s = {
  label:      { color: "var(--fg-secondary)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  chip:       { flex: 1, padding: "0.55rem 0.5rem", background: "var(--bg-elevated)", color: "var(--fg-secondary)", border: "1px solid var(--fg-muted)", borderRadius: 8, fontWeight: 500, fontSize: "0.85rem", cursor: "pointer", textAlign: "center" as const, minWidth: 90 },
  chipActive: { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" },
  backBtn:    { background: "none", border: "none", color: "var(--fg-secondary)", cursor: "pointer", fontSize: "0.85rem", textAlign: "left" as const, padding: 0 },
  btn:        { background: "var(--bg-elevated)", color: "var(--fg-primary)", border: "1px solid var(--fg-muted)", borderRadius: 12, fontWeight: 600, padding: "0.875rem", fontSize: "1rem", width: "100%" },
};
