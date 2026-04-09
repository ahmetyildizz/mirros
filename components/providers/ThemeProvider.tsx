"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/game.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useGameStore();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return <>{children}</>;
}
