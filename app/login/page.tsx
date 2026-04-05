"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router   = useRouter();
  const [username, setUsername] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Giriş başarısız");
      setLoading(false);
    }
  };

  return (
    <main style={s.page}>
      {/* Aurora bg */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
        <div className="aurora-blob-3" />
      </div>

      <div style={s.card} className="glass-card-elevated fade-up">
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoOrb} />
          <h1 className="gradient-text" style={s.logo}>mirros</h1>
        </div>
        <p style={s.sub}>Beni ne kadar tanıyorsun?</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.inputWrap}>
            <span style={s.inputIcon}>👤</span>
            <input
              className="input-glass"
              style={s.input}
              type="text"
              placeholder="Kullanıcı adın"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              maxLength={20}
            />
          </div>

          {error && (
            <div style={s.errorBox}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || username.trim().length < 2}
            className="btn-gradient"
            style={s.btn}
          >
            {loading ? (
              <span style={s.btnInner}>
                <span style={s.spinner} />
                Giriş yapılıyor...
              </span>
            ) : (
              "Devam Et →"
            )}
          </button>
        </form>

        <p style={s.hint}>Hesap yoksa otomatik oluşturulur</p>
      </div>
    </main>
  );
}

const s = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    position: "relative" as const,
    zIndex: 1,
  },
  card: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "1rem",
    width: "100%",
    maxWidth: 360,
    padding: "2rem 1.5rem",
  },
  logoWrap: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoOrb: {
    position: "absolute" as const,
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
    filter: "blur(16px)",
  },
  logo: {
    fontSize: "2.5rem",
    fontWeight: 800,
    letterSpacing: "-0.05em",
    margin: 0,
    position: "relative" as const,
    zIndex: 1,
  },
  sub: {
    color: "var(--fg-secondary)",
    fontSize: "0.9rem",
    fontWeight: 500,
    marginTop: "-0.25rem",
    textAlign: "center" as const,
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  inputWrap: {
    position: "relative" as const,
  },
  inputIcon: {
    position: "absolute" as const,
    left: "0.875rem",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "1rem",
    lineHeight: 1,
    pointerEvents: "none" as const,
  },
  input: {
    width: "100%",
    padding: "0.875rem 1rem 0.875rem 2.75rem",
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "rgba(248,113,113,0.12)",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: 10,
    padding: "0.6rem 0.875rem",
    color: "#FC8181",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  btn: {
    width: "100%",
    padding: "0.875rem",
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  btnInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    display: "inline-block",
    animation: "spin-slow 0.8s linear infinite",
  },
  hint: {
    color: "var(--fg-muted)",
    fontSize: "0.75rem",
    textAlign: "center" as const,
  },
};
