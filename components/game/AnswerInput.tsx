"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  placeholder?: string;
  onSubmit: (value: string) => void;
  loading?: boolean;
}

export function AnswerInput({ placeholder = "Cevabını yaz...", onSubmit, loading }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={placeholder}
        maxLength={120}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--fg-muted)",
          color: "var(--fg-primary)",
          borderRadius: 12,
          padding: "0.75rem 1rem",
        }}
      />
      <Button
        onClick={handleSubmit}
        disabled={!value.trim() || loading}
        style={{
          background: "var(--accent)",
          color: "#fff",
          borderRadius: 12,
          fontWeight: 600,
        }}
      >
        {loading ? "Gönderiliyor..." : "Gönder"}
      </Button>
    </div>
  );
}
