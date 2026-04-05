"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";

interface Props {
  options:      string[];
  onSubmit:     (value: string, reason?: string) => void | Promise<void>;
  allowFreeText?: boolean;   // sosyal modda son şık = "Diğer"
  showReason?:  boolean;     // tahmin ekranında "neden böyle düşündün?" göster
}

export function MultipleChoiceInput({ options, onSubmit, allowFreeText = false, showReason = false }: Props) {
  const [selected,   setSelected]   = useState<string | null>(null);
  const [freeText,   setFreeText]   = useState("");
  const [showFree,   setShowFree]   = useState(false);
  const [reason,     setReason]     = useState("");
  const [sending,    setSending]    = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const handleSubmit = async () => {
    const value = showFree ? freeText.trim() : selected;
    if (!value || sending || submitted) return;
    setSending(true);
    try {
      await onSubmit(value, reason.trim() || undefined);
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div style={s.doneBox}>
        ✓ Cevabın gönderildi — bekleniyor...
      </div>
    );
  }

  const hasSelection = showFree ? freeText.trim().length > 0 : !!selected;

  return (
    <div style={s.container}>
      {options.map((opt) => (
        <button
          key={opt}
          disabled={sending}
          style={{
            ...s.option,
            ...(selected === opt && !showFree ? s.optionSelected : {}),
          }}
          onClick={() => { setSelected(opt); setShowFree(false); }}
        >
          {opt}
        </button>
      ))}

      {allowFreeText && (
        <button
          style={{ ...s.option, ...(showFree ? s.optionSelected : {}), fontStyle: "italic" }}
          onClick={() => { setShowFree(true); setSelected(null); }}
          disabled={sending}
        >
          ✏️ Diğer (kendin yaz)
        </button>
      )}

      {showFree && (
        <Input
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Cevabını yaz..."
          maxLength={120}
          autoFocus
          style={s.freeInput}
        />
      )}

      {showReason && hasSelection && (
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder='Neden böyle düşündün? (isteğe bağlı)'
          maxLength={100}
          style={{ ...s.freeInput, fontSize: "0.85rem", borderStyle: "dashed" }}
        />
      )}

      <Button
        onClick={handleSubmit}
        disabled={!hasSelection || sending}
        style={s.submitBtn}
      >
        {sending ? "Gönderiliyor..." : "Gönder"}
      </Button>
    </div>
  );
}

const s = {
  container:      { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  option:         { width: "100%", padding: "0.75rem 1rem", background: "var(--bg-elevated)", color: "var(--fg-primary)", border: "2px solid transparent", borderRadius: 12, fontWeight: 500, fontSize: "0.9rem", cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s" },
  optionSelected: { borderColor: "var(--accent)", background: "var(--bg-elevated)", color: "var(--accent)", fontWeight: 700 },
  freeInput:      { background: "var(--bg-elevated)", border: "1px solid var(--fg-muted)", color: "var(--fg-primary)", borderRadius: 12, padding: "0.75rem 1rem" },
  submitBtn:      { marginTop: "0.25rem", background: "var(--accent)", color: "#fff", borderRadius: 12, fontWeight: 600, padding: "0.875rem", width: "100%" },
  doneBox:        { background: "var(--bg-elevated)", borderRadius: 12, padding: "1rem", textAlign: "center" as const, color: "var(--exact)", fontWeight: 600 },
};
