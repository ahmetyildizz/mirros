import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// .env dosyasını yükle
dotenv.config();

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
// Özellikle içerik üretimi için stabil çalışan model, JSON formatına zorluyoruz
const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  generationConfig: { responseMimeType: "application/json" }
});

const CATEGORIES = [
  "Kız Gecesi", "Buz Kıran", "Aile Toplantısı", "Doğum Günü", 
  "Takım Building", "Dedikodu Masası", "Ofis Kaosu", "Bilgi Yarışması", 
  "Bluff Gecesi", "Casus Avı", "Süper Çocuklar", "Bilgelerin Meydanı", 
  "Kampüs Kaosu", "Nostalji 90'lar", "Sinema & Dizi", "Ben Hiç...", 
  "Z Kuşağı", "Astroloji", "Gurme & Mutfak", "Çift Gecesi"
];

// Dosya isimlerini güvenli hale getirmek için yardımcı fonksiyon
function slugify(text: string) {
  return text.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/['\.]/g, '').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
}

const PROMPT_TEMPLATE = (category: string) => `
Sen "Mirros" oyununun Soru Yazarı ve İçerik Tasarımcısısın.
Görev: "${category}" kategorisi için aşağıdaki oyun modlarında çok eğlenceli, yaratıcı ve zekice sorular üretmek. Jenerik ve sıkıcı sorulardan uzak dur.

Bana SADECE GEÇERLİ BİR JSON ARRAY formatında çıktı ver. (Başlangıç ve bitişte köşeli parantez olsun, markdown tırnakları \`\`\`json vb. OLMASIN).

KURALLAR:
1. SOCIAL: [İSİM] yer tutuculu komik senaryolar. 4 şık (options).
2. QUIZ: "correct" alanı dolu gerçek bilgi soruları. 4 şık.
3. EXPOSE: "En çok kim?" soruları. "penalty" cezası olacak. ŞIK YOK.
4. SPY: Vatandaş için "text", Casus için "correct" alanı. (Örn text: Ruj, correct: Parlatıcı). ŞIK YOK.

Lütfen tam 20 soru üret (5 SOCIAL, 5 QUIZ, 5 EXPOSE, 5 SPY).

ÖRNEK YAPI (Sadece bu formatta dön):
[
  { "mode": "SOCIAL", "text": "[İSİM] sence en büyük sırrını kime söylerdi?", "options": ["X", "Y", "Z", "W"], "category": "${category}", "difficulty": "EASY" },
  { "mode": "EXPOSE", "text": "Bu gruptan kim eski sevgilisine stalk atıyordur?", "penalty": "Cezası", "category": "${category}", "difficulty": "HARD" },
  { "mode": "SPY", "text": "Ruj", "correct": "Parlatıcı", "category": "${category}", "difficulty": "MEDIUM" },
  { "mode": "QUIZ", "text": "Hangi yıl X olmuştur?", "options": ["A", "B", "C", "D"], "correct": "B", "category": "${category}", "difficulty": "HARD" }
]
`;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateWithRetry(category: string, retries = 3): Promise<any[]> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(PROMPT_TEMPLATE(category));
      const text = result.response.text();
      
      // JSON modunda olduğu için direkt parse edilebilir
      try {
        return JSON.parse(text);
      } catch (parseError) {
        // Eğer her şeye rağmen ufak tefek fazlalıklar varsa array'i bul
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw parseError;
      }
    } catch (e: any) {
      if (e?.status === 429) {
        console.warn(`   ⚠️ Ratelimit! 30 saniye bekleniyor... (Deneme ${i+1}/${retries})`);
        await delay(30000); // Ücretsiz limitler için 30 sn bekle
      } else {
        console.warn(`   ⚠️ Hata: ${e.message} (Deneme ${i+1}/${retries})`);
        await delay(5000);
      }
    }
  }
  return [];
}

async function main() {
  console.log("🤖 Mirros AI Soru Üretici Başlıyor...");
  const poolDir = path.join(process.cwd(), "data/pool");
  
  if (!fs.existsSync(poolDir)) {
    fs.mkdirSync(poolDir, { recursive: true });
  }

  for (const category of CATEGORIES) {
    const fileName = `${slugify(category)}.json`;
    const filePath = path.join(poolDir, fileName);

    // Eğer daha önce üretilmiş dosyaysa atla (Kaldığı yerden devam edebilmesi için)
    if (fs.existsSync(filePath)) {
      const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (existing.length >= 20) {
        console.log(`⏩ [${category}] için dosya zaten var, geçiliyor...`);
        continue;
      }
    }

    console.log(`\n✍️ [${category}] için yaratıcı sorular üretiliyor... (Bu işlem 15-20 saniye sürebilir)`);
    
    const questions = await generateWithRetry(category);
    
    if (questions.length > 0) {
      fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), "utf-8");
      console.log(`✅ [${category}] için ${questions.length} soru başarıyla kaydedildi -> ${fileName}`);
    } else {
      console.log(`❌ [${category}] için soru üretilemedi (Maksimum denemeye ulaşıldı).`);
    }

    // Google API'sini kızdırmamak için iki kategori arasında 10 saniye dinlen
    console.log("⏳ Sonraki kategoriye geçmeden önce soğutma molası (10 sn)...");
    await delay(10000); 
  }

  console.log("\n🎉 Tüm kategoriler için soru üretimi tamamlandı! /data/pool klasörünü kontrol edebilirsin.");
}

main().catch(console.error);
