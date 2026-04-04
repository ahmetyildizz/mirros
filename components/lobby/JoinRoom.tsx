"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onJoined: (roomId: string) => void;
}

export function JoinRoom({ onJoined }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (code.trim().length < 4) {
      setError("Geçerli bir kod gir.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      onJoined(data.id);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Oda bulunamadı.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        placeholder="Oda kodu (örn. ABC123)"
        maxLength={8}
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${error ? "var(--wrong)" : "var(--fg-muted)"}`,
          color: "var(--fg-primary)",
          borderRadius: 12,
          padding: "0.75rem 1rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontSize: "1rem",
        }}
      />
      {error && (
        <p style={{ color: "var(--wrong)", fontSize: "0.8rem" }}>{error}</p>
      )}
      <Button
        onClick={handleJoin}
        disabled={!code.trim() || loading}
        style={{
          background: "var(--bg-elevated)",
          color: "var(--fg-primary)",
          border: "1px solid var(--fg-muted)",
          borderRadius: 12,
          fontWeight: 600,
          padding: "0.875rem",
          fontSize: "1rem",
        }}
      >
        {loading ? "Katılınıyor..." : "Odaya Katıl"}
      </Button>
    </div>
  );
}
