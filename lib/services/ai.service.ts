import { GoogleGenerativeAI } from "@google/generative-ai";
import { QUESTION_GENERATION_PROMPT } from "../prompts/question-gen";

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface GameDataForAI {
  familiarity: number;
  gameMode: string;
  category?: string;
  rounds: {
    question: string;
    answerer: string;
    answer: string;
    guesses: { guesser: string; content: string; points: number }[];
  }[];
}

export async function analyzeGameWithGemini(data: GameDataForAI) {
  if (!API_KEY) {
    return {
      tag: "Zeka Beklemede",
      story: "Mirros Zekası şu an uykuda (API Key eksik). Ama sonuçlarınız harika görünüyor!"
    };
  }

  const isHighSpice = data.gameMode === "EXPOSE" || data.category?.includes(":Hot") || data.category?.includes(":Nuclear");
  const spiceMultiplier = data.category?.includes(":Nuclear") ? "EKSTREM" : "YÜKSEK";

  const prompt = `
    Sen "Mirros" adlı bir sosyal oyunun eğlenceli, zeki ve ${isHighSpice ? `oldukça ${spiceMultiplier} derecede iğneleyici/spicy` : "samimi"} yapay zekasısın. 
    Aşağıdaki oyun verilerini analiz et ve oyuncular (arkadaşlar veya partnerler) hakkında unutulmaz, bazen maskeleri düşüren, bazen de bağları yücelten bir özet çıkar.
    
    OYUN VERİLERİ:
    - Mod: ${data.gameMode}
    - Kategori: ${data.category || "Genel"}
    - Genel Uyum Skoru: %${data.familiarity}
    - Round Detayları:
    ${data.rounds.map((r, i) => `Round ${i+1}: "${r.question}" sorusuna ${r.answerer} "${r.answer}" cevabını verdi. Arkadaşları şu tahminleri yaptı: ${r.guesses.map(g => `${g.guesser} (${g.content})`).join(", ")}`).join("\n")}

    İSTEKLER:
    1. "tag": Maksimum 3 kelimelik vurucu bir başlık. ${isHighSpice ? "Daha agresif veya iddialı olabilir." : "Sempatik olabilir."}
    2. "story": Yaklaşık 3-4 cümlelik analiz. 
       - ${isHighSpice ? "Cevaplar arasındaki çelişkileri veya 'iyice saçmalayan' tahminleri tiye al." : "Grubun uyumuna veya komik tesadüflere odaklan."}
       - Mutlaka en az iki oyuncunun ismini zikret ve verdikleri spesifik cevaplara/tahminlere atıf yap.
       - ${data.gameMode === "EXPOSE" ? "Eğer EXPOSE moduysa, en çok 'exposed' olan kişiye (kazanana) özel bir gönderme yap." : ""}
       - Dil: Modern, samimi, 'genç işi' ve etkileyici bir Türkçe.
    
    JSON formatında döndür: { "tag": "...", "story": "..." }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON response cleaning
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      tag: "Mirros Analizi",
      story: text
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      tag: "Analiz Hatası",
      story: "Yapay zeka şu an biraz yorgun, ama eğlenceniz baki!"
    };
  }
}

export async function generateQuestionsWithAI(category: string, count: number = 10) {
  if (!API_KEY) return [];

  const prompt = QUESTION_GENERATION_PROMPT(category, count);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return [];
  }
}
