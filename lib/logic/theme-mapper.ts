import type { GameTheme } from "@/store/game.store";

export function getThemeFromRoom(category: string | null, gameMode: "SOCIAL" | "QUIZ" | "EXPOSE" | string): GameTheme {
  if (gameMode === "QUIZ") return "intel";
  if (gameMode === "EXPOSE") return "neon";
  if (!category) return "purple";

  const lower = category.toLowerCase();
  
  if (lower.includes("çift") || lower.includes("aşk") || lower.includes("romantic") || lower.includes("love")) {
    return "love";
  }
  
  if (lower.includes("aile") || lower.includes("doğum") || lower.includes("arkadaş") || lower.includes("sıcak") || lower.includes("warm")) {
    return "warm";
  }

  if (lower.includes("intel") || lower.includes("bilgi") || lower.includes("quiz")) {
    return "intel";
  }

  if (lower.includes("ofis") || lower.includes("iş") || lower.includes("office") || lower.includes("work")) {
    return "corporate";
  }

  return "purple";
}
