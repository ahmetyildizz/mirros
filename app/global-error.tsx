"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ background: "#000", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: "#fff", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Kritik Hata
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Uygulama beklenmedik bir hatayla karşılaştı.
          </p>
          {error.digest && (
            <p style={{ color: "#475569", fontSize: "0.625rem", fontFamily: "monospace", marginBottom: "1rem" }}>
              {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{ padding: "0.75rem 1.5rem", background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", color: "#a855f7", borderRadius: "0.75rem", cursor: "pointer", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
