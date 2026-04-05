"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";

interface Props {
  opponentName: string;
  onSubmit:     (value: string, reason?: string) => void | Promise<void>;
  loading?:     boolean;
}

export function GuessInput({ opponentName, onSubmit, loading }: Props) {
  const [value,     setValue]     = useState("");
  const [reason,    setReason]    = useState("");
  const [sending,   setSending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim() || sending || submitted) return;
    setSending(true);
    try {
      await onSubmit(value.trim(), reason.trim() || undefined);
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div style={s.doneBox}>✓ Tahmin gönderildi — bekleniyor...</div>
    );
  }

  return (
    <div style={s.container}>
      <p style={s.hint}>{opponentName} ne demiş olabilir?</p>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Tahminini yaz..."
        maxLength={120}
        style={s.input}
      />
      {value.trim() && (
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder='Neden böyle düşündün? (isteğe bağlı)'
          maxLength={100}
          style={{ ...s.input, fontSize: "0.85rem", borderStyle: "dashed" }}
        />
      )}
      <Button
        onClick={handleSubmit}
        disabled={!value.trim() || sending || loading}
        style={s.btn}
      >
        {sending || loading ? "Gönderiliyor..." : "Tahmin Et"}
      </Button>
    </div>
  );
}

const s = {
  container: { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  hint:      { color: "var(--fg-secondary)", fontSize: "0.875rem" },
  input:     { background: "var(--bg-elevated)", border: "1px solid var(--fg-muted)", color: "var(--fg-primary)", borderRadius: 12, padding: "0.75rem 1rem" },
  btn:       { background: "var(--accent)", color: "#fff", borderRadius: 12, fontWeight: 600, padding: "0.875rem", width: "100%" },
  doneBox:   { background: "var(--bg-elevated)", borderRadius: 12, padding: "1rem", textAlign: "center" as const, color: "var(--exact)", fontWeight: 600 },
};
