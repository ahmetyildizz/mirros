"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  placeholder?: string;
  onSubmit: (value: string) => void | Promise<void>;
  loading?: boolean;
}

export function AnswerInput({ placeholder = "Cevabını yaz...", onSubmit, loading }: Props) {
  const [value, setValue]       = useState("");
  const [sending, setSending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim() || sending || submitted) return;
    setSending(true);
    try {
      await onSubmit(value.trim());
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        background: "var(--bg-elevated)",
        borderRadius: 12,
        padding: "1rem",
        textAlign: "center",
        color: "var(--exact)",
        fontWeight: 600,
        fontSize: "0.95rem",
      }}>
        ✓ Gönderildi — bekliyoruz...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={placeholder}
        maxLength={120}
        disabled={sending}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--fg-muted)",
          color: "var(--fg-primary)",
          borderRadius: 12,
          padding: "0.75rem 1rem",
          opacity: sending ? 0.6 : 1,
        }}
      />
      <Button
        onClick={handleSubmit}
        disabled={!value.trim() || loading || sending}
        style={{
          background: "var(--accent)",
          color: "#fff",
          borderRadius: 12,
          fontWeight: 600,
        }}
      >
        {sending ? "Gönderiliyor..." : "Gönder"}
      </Button>
    </div>
  );
}
