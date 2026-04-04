"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onCreated: (roomId: string, code: string) => void;
}

export function CreateRoom({ onCreated }: Props) {
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch("/api/rooms", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      onCreated(data.id, data.code);
    } else if (res.status === 401) {
      window.location.href = "/login";
    }
    setLoading(false);
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={loading}
      style={{
        width: "100%",
        background: "var(--accent)",
        color: "#fff",
        borderRadius: 12,
        fontWeight: 600,
        padding: "0.875rem",
        fontSize: "1rem",
      }}
    >
      {loading ? "Oluşturuluyor..." : "Yeni Oyun Başlat"}
    </Button>
  );
}
