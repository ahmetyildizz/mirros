import { GoogleGenerativeAI } from "@google/generative-ai";
import { SOCIAL_PROMPT, EXPOSE_PROMPT, QUIZ_PROMPT, SPY_PROMPT } from "../prompts/question-gen";
import { db } from "../db";

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";
const genAI   = new GoogleGenerativeAI(API_KEY);
const model   = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ─── Oyun Sonu Analizi ────────────────────────────────────────────────────────

export interface GameDataForAI {
  familiarity: number;
  gameMode: string;
  category?: string;
  rounds: {
    question:  string;
    answerer:  string;
    answer:    string;
    guesses:   { guesser: string; content: string; points: number }[];
  }[];
}

export async function analyzeGameWithGemini(data: GameDataForAI) {
  if (!API_KEY) {
    return {
      tag:   "Zeka Beklemede",
      story: "Mirros Zekası şu an uykuda (API Key eksik). Ama sonuçlarınız harika görünüyor!",
    };
  }

  const isHighSpice    = data.gameMode === "EXPOSE" || data.category?.includes(":Hot") || data.category?.includes(":Nuclear");
  const spiceMultiplier = data.category?.includes(":Nuclear") ? "EKSTREM" : "YÜKSEK";

  const prompt = `
    Sen "Mirros" adlı bir sosyal oyunun eğlenceli, zeki ve ${
      isHighSpice ? `oldukça ${spiceMultiplier} derecede iğneleyici/spicy` : "samimi"
    } yapay zekasısın.
    Aşağıdaki oyun verilerini analiz et ve oyuncular (arkadaşlar veya partnerler) hakkında unutulmaz,
    bazen maskeleri düşüren, bazen de bağları yücelten bir özet çıkar.

    OYUN VERİLERİ:
    - Mod: ${data.gameMode}
    - Kategori: ${data.category || "Genel"}
    - Genel Uyum Skoru: %${data.familiarity}
    - Round Detayları:
    ${data.rounds
      .map(
        (r, i) =>
          `Round ${i + 1}: "${r.question}" sorusuna ${r.answerer} "${r.answer}" cevabını verdi. ` +
          `Arkadaşları şu tahminleri yaptı: ${r.guesses.map((g) => `${g.guesser} (${g.content})`).join(", ")}`
      )
      .join("\n")}

    İSTEKLER:
    1. "tag": Maksimum 3 kelimelik vurucu bir başlık. ${isHighSpice ? "Daha agresif veya iddialı olabilir." : "Sempatik olabilir."}
    2. "story": Yaklaşık 3-4 cümlelik analiz.
       - ${isHighSpice ? "Cevaplar arasındaki çelişkileri veya 'iyice saçmalayan' tahminleri tiye al." : "Grubun uyumuna veya komik tesadüflere odaklan."}
       - Mutlaka en az iki oyuncunun ismini zikret ve verdikleri spesifik cevaplara/tahminlere atıf yap.
       - ${data.gameMode === "EXPOSE" ? "Eğer EXPOSE moduysa, en çok 'exposed' olan kişiye (kazanana) özel bir gönderme yap." : ""}
       - Dil: Modern, samimi, 'genç işi' ve etkileyici bir Türkçe.

    JSON formatında döndür: { 
      "tag": "...", 
      "story": "...",
      "playerBadges": [
        { "userId": "...", "badgeSlug": "toxic_tongue", "badgeEmoji": "🐍", "badgeName": "Zehirli Dil" },
        ...
      ]
    }
  `;

  try {
    const result   = await model.generateContent(prompt);
    const text     = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { tag: "Mirros Analizi", story: text };
  } catch (error) {
    console.error("[AI] analyzeGame error:", error);
    return { tag: "Analiz Hatası", story: "Yapay zeka şu an biraz yorgun, ama eğlenceniz baki!" };
  }
}

// ─── Soru Üretimi ─────────────────────────────────────────────────────────────

export interface AIQuestion {
  text:       string;
  options:    string[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category:   string;
  gameMode:   "SOCIAL" | "QUIZ" | "EXPOSE" | "SPY";
  correct?:   string;
  penalty?:   string;
  ageGroup?:  "CHILD" | "ADULT" | "WISE";
}

async function callGeminiForQuestions(prompt: string): Promise<AIQuestion[]> {
  if (!API_KEY) return [];
  try {
    const result    = await model.generateContent(prompt);
    const text      = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[AI] generateQuestions error:", error);
    return [];
  }
}

/** Global havuz için SOCIAL soruları üretir (placeholder [İSİM] ile). */
export async function generateSocialQuestions(
  category: string,
  count = 10,
  playerNames?: string[]
): Promise<AIQuestion[]> {
  return callGeminiForQuestions(SOCIAL_PROMPT(category, count, playerNames));
}

/** Global havuz için EXPOSE soruları üretir. */
export async function generateExposeQuestions(
  category: string,
  count = 10,
  spiceLevel: "EASY" | "MEDIUM" | "HARD" = "MEDIUM",
  playerNames?: string[]
): Promise<AIQuestion[]> {
  return callGeminiForQuestions(EXPOSE_PROMPT(category, count, spiceLevel, playerNames));
}

/** Global havuz için QUIZ soruları üretir. */
export async function generateQuizQuestions(
  category: string,
  count = 10,
  ageGroup: "CHILD" | "ADULT" | "WISE" = "ADULT"
): Promise<AIQuestion[]> {
  return callGeminiForQuestions(QUIZ_PROMPT(category, count, ageGroup));
}

/** Global havuz için SPY konuları üretir. */
export async function generateSpyQuestions(
  category: string,
  count = 10
): Promise<AIQuestion[]> {
  const pairs = await callGeminiForQuestions(SPY_PROMPT(category, count));
  return pairs.map(p => ({
    ...p,
    gameMode: "SPY"
  }));
}

/**
 * Bir oda için kişiselleştirilmiş sorular üretir ve DB'ye kaydeder.
 * pickQuestion() oda-özel soruları önce seçer, bu sayede her oyun taze hissettirirk.
 */
export async function generateAndSaveQuestionsForRoom(
  roomId:     string,
  gameMode:   "SOCIAL" | "QUIZ" | "EXPOSE" | "BLUFF" | "SPY",
  category:   string | null,
  ageGroup:   "CHILD" | "ADULT" | "WISE" | null,
  playerNames: string[],
  spiceLevel: "EASY" | "MEDIUM" | "HARD" = "MEDIUM"
): Promise<number> {
  if (!API_KEY) return 0;

  const cat   = category ?? "Genel";
  const count = 12; // Oda başına 12 kişisel soru

  let questions: AIQuestion[] = [];

  if (gameMode === "SOCIAL") {
    questions = await generateSocialQuestions(cat, count, playerNames);
  } else if (gameMode === "EXPOSE") {
    questions = await generateExposeQuestions(cat, count, spiceLevel, playerNames);
  } else if (gameMode === "QUIZ") {
    questions = await generateQuizQuestions(cat, count, ageGroup ?? "ADULT");
  } else if (gameMode === "SPY") {
    questions = await generateSpyQuestions(cat, count);
  }

  if (!questions.length) return 0;

  let saved = 0;
  for (const q of questions) {
    if (!q.text || q.text.length < 5) continue;
    try {
      await db.question.create({
        data: {
          text:       q.text,
          category:   q.category ?? cat,
          options:    (q.options ?? []) as any,
          correct:    q.correct ?? null,
          penalty:    q.penalty ?? null,
          difficulty: q.difficulty ?? "MEDIUM",
          gameMode:   gameMode,
          ageGroup:   q.ageGroup ?? ageGroup ?? null,
          isActive:   true,
          roomId,            // oda-özel → pickQuestion() bunu önce seçer
        },
      });
      saved++;
    } catch (e) {
      console.error("[AI] question save error:", e);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[AI] ${saved}/${count} soru oda ${roomId} için kaydedildi (${gameMode})`);
  }
  return saved;
}

/**
 * Global soru havuzunu doldurur (oda bağımsız).
 * pickQuestion() havuz < LOW_WATER_MARK olduğunda bunu çağırır.
 */
export async function refillGlobalPool(
  gameMode: "SOCIAL" | "QUIZ" | "EXPOSE" | "BLUFF" | "SPY",
  category: string,
  count = 15
): Promise<number> {
  if (!API_KEY) return 0;

  let questions: AIQuestion[] = [];

  if (gameMode === "SOCIAL") {
    questions = await generateSocialQuestions(category, count);
  } else if (gameMode === "EXPOSE") {
    questions = await generateExposeQuestions(category, count, "MEDIUM");
  } else if (gameMode === "QUIZ") {
    questions = await generateQuizQuestions(category, count);
  } else if (gameMode === "SPY") {
    questions = await generateSpyQuestions(category, count);
  }

  if (!questions.length) return 0;

  let saved = 0;
  for (const q of questions) {
    if (!q.text || q.text.length < 5) continue;
    try {
      await db.question.create({
        data: {
          text:       q.text,
          category:   q.category ?? category,
          options:    (q.options ?? []) as any,
          correct:    q.correct ?? null,
          penalty:    q.penalty ?? null,
          difficulty: q.difficulty ?? "MEDIUM",
          gameMode,
          isActive:   true,
          roomId:     null, // global havuz
        },
      });
      saved++;
    } catch (e) {
      console.error("[AI] global pool refill error:", e);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[AI] global havuz: ${saved} soru eklendi (${gameMode}/${category})`);
  }
  return saved;
}
