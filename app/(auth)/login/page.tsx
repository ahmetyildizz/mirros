"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await signIn("email", { email, redirect: false });
    setSent(true);
    setLoading(false);
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--accent)",
              letterSpacing: "-0.03em",
            }}
          >
            mirros
          </h1>
          <p style={{ color: "var(--fg-secondary)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Arkadaşını ne kadar tanıyorsun?
          </p>
        </div>

        {/* Form */}
        {!sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="E-posta adresin"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--fg-muted)",
                color: "var(--fg-primary)",
                borderRadius: 12,
                padding: "0.75rem 1rem",
                fontSize: "1rem",
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!email.trim() || loading}
              style={{
                background: "var(--accent)",
                color: "#fff",
                borderRadius: 12,
                fontWeight: 600,
                padding: "0.75rem",
                fontSize: "1rem",
              }}
            >
              {loading ? "Gönderiliyor..." : "Magic Link Gönder"}
            </Button>
          </div>
        ) : (
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: 16,
              padding: "1.5rem",
              textAlign: "center",
              border: "1px solid var(--accent)",
            }}
          >
            <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📬</p>
            <p style={{ color: "var(--fg-primary)", fontWeight: 600 }}>Link gönderildi!</p>
            <p style={{ color: "var(--fg-secondary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              {email} adresine giriş linki gönderildi.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
