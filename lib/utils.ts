import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hapticFeedback(style: "light" | "medium" | "heavy" | "error" | "success" = "light") {
  if (typeof window !== "undefined" && navigator.vibrate) {
    switch (style) {
      case "light":   navigator.vibrate(10); break;
      case "medium":  navigator.vibrate(25); break;
      case "heavy":   navigator.vibrate(50); break;
      case "success": navigator.vibrate([10, 30, 10]); break;
      case "error":   navigator.vibrate([50, 50, 50]); break;
    }
  }
}
