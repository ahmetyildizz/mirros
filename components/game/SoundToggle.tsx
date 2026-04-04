"use client";

import { useEffect, useState } from "react";

export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(localStorage.getItem("mirros_sound") !== "off");
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    localStorage.setItem("mirros_sound", next ? "on" : "off");
  };

  return (
    <button
      onClick={toggle}
      title={on ? "Sesi kapat" : "Sesi aç"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "1.1rem",
        color: on ? "var(--fg-secondary)" : "var(--fg-muted)",
        padding: "0.25rem",
        opacity: on ? 1 : 0.45,
      }}
    >
      {on ? "🔊" : "🔇"}
    </button>
  );
}
