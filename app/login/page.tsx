"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

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
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>mirros</h1>
        <p style={styles.sub}>Beni ne kadar tanıyorsun?</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Kullanıcı adın"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            maxLength={20}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading || username.trim().length < 2} style={styles.btn}>
            {loading ? "Giriş yapılıyor..." : "Devam Et"}
          </button>
        </form>

        <p style={styles.hint}>Hesap yoksa otomatik oluşturulur</p>
      </div>
    </main>
  );
}

const styles = {
  page:  { minHeight: "100dvh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" },
  card:  { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "1rem", width: "100%", maxWidth: 360 },
  logo:  { color: "var(--accent)", fontWeight: 800, fontSize: "2rem", letterSpacing: "-0.04em" },
  sub:   { color: "var(--fg-secondary)", fontSize: "0.9rem", marginTop: "-0.5rem" },
  form:  { width: "100%", display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
  input: { width: "100%", padding: "0.875rem 1rem", background: "var(--bg-card)", border: "1px solid var(--fg-muted)", borderRadius: 10, color: "var(--fg-primary)", fontSize: "1rem", outline: "none", boxSizing: "border-box" as const },
  btn:   { padding: "0.875rem", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "1rem", cursor: "pointer" },
  error: { color: "var(--wrong, #ef4444)", fontSize: "0.85rem", textAlign: "center" as const },
  hint:  { color: "var(--fg-muted)", fontSize: "0.75rem" },
};
