import { analyzeGameWithGemini, GameDataForAI } from "@/lib/services/ai.service";

export interface GameTelemetry extends GameDataForAI {
  topPlayerName: string;
  unpredictableName: string;
  mostIntuitiveName: string;
  chaoticLevel: "LOW" | "MEDIUM" | "HIGH";
}

export async function generateAIInsight(telemetry: GameTelemetry) {
  const intros = [
    "Mirros Zihin Laboratuvarı sonuçları analiz etti...",
    "Kuantum sosyal veri taraması tamamlandı.",
    "Derin öğrenme modelleri aranızdaki bağı çözdü.",
    "Yapay zeka bu grubun sırlarını ortaya döküyor..."
  ];

  const intro = intros[Math.floor(Math.random() * intros.length)];
  
  // Real Gemini Analysis
  const result = await analyzeGameWithGemini(telemetry);

  return {
    intro,
    tag: result.tag,
    story: result.story,
    playerBadges: result.playerBadges || []
  };
}
