import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';

const pool = new pg.Pool({
  connectionString: "postgresql://neondb_owner:npg_nqx2lGwStW9M@ep-shiny-haze-alsnq0fy-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  max: 5
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const genAI = new GoogleGenerativeAI("AIzaSyDVHuvlQynqlzr9m3NF9OLUTz5n4R7FJCs");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function generateQuestions(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) { console.error('No JSON array found'); return []; }
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Gemini error:', e.message);
    return [];
  }
}

async function saveQuestions(questions, gameMode) {
  let saved = 0;
  for (const q of questions) {
    if (!q.text || q.text.length < 5) continue;
    try {
      await db.question.create({
        data: {
          text: q.text,
          category: q.category,
          options: (q.options ?? []),
          correct: q.correct ?? null,
          penalty: q.penalty ?? null,
          difficulty: q.difficulty ?? 'MEDIUM',
          gameMode,
          isActive: true,
          roomId: null,
        }
      });
      saved++;
    } catch (e) {
      if (!e.message.includes('Unique')) console.error('Save error:', e.message);
    }
  }
  return saved;
}

const jobs = [
  { mode: 'EXPOSE', cat: 'Eğlence', prompt: 'Sen sosyal oyun soru yazarısın. "Bu gruptan kim?" tarzında 20 adet EXPOSE modu sorusu yaz. Kategori: Eğlence. Her soru eğlenceli ve sosyal bir yüzlesmе olmalı. JSON formatı: [{"text":"soru","difficulty":"MEDIUM","category":"Eğlence","gameMode":"EXPOSE","options":[],"penalty":"eglenceli ceza"}]' },
  { mode: 'EXPOSE', cat: 'İhanet', prompt: 'Sen sosyal oyun soru yazarısın. "Bu gruptan kim?" tarzında 20 adet EXPOSE modu sorusu yaz. Kategori: İhanet. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"İhanet","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Para', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Para. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Para","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Kaos', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Kaos. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Kaos","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Kisilik', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Kişilik. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Kişilik","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Iliski', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: İlişki. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"İlişki","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Sosyal', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Sosyal. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Sosyal","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Nostalji', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Nostalji. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Nostalji","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Anilar', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Anılar. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Anılar","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Tehlike', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Tehlike. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Tehlike","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Dijital', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Dijital (sosyal medya, telefon, internet). JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Dijital","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Duygu', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Duygu. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Duygu","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Degerler', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu. Kategori: Değerler. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Değerler","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'OfisKaosu', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu is ortamı temalı. Kategori: Ofis Kaosu. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Ofis Kaosu","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'EXPOSE', cat: 'Yemek', prompt: 'Sen sosyal oyun soru yazarısın. 20 EXPOSE sorusu yemek aliskanliklari. Kategori: Yemek. JSON: [{"text":"soru","difficulty":"MEDIUM","category":"Yemek","gameMode":"EXPOSE","options":[],"penalty":"ceza"}]' },
  { mode: 'SOCIAL', cat: 'Kisilik', prompt: 'Sen sosyal oyun soru yazarısın. 20 SOCIAL modu sorusu yaz. [ISIM] placeholder kullan. 4 sik ver. Kategori: Kişilik. JSON: [{"text":"[ISIM] bla bla?","options":["A","B","C","D"],"difficulty":"MEDIUM","category":"Kişilik","gameMode":"SOCIAL"}]' },
  { mode: 'SOCIAL', cat: 'Iliski', prompt: 'Sen sosyal oyun soru yazarısın. 20 SOCIAL sorusu. [ISIM] placeholder. Kategori: İlişki. JSON: [{"text":"soru","options":["A","B","C","D"],"difficulty":"MEDIUM","category":"İlişki","gameMode":"SOCIAL"}]' },
  { mode: 'SOCIAL', cat: 'Eglence', prompt: 'Sen sosyal oyun soru yazarısın. 20 SOCIAL sorusu. [ISIM] placeholder. Kategori: Eğlence. JSON: [{"text":"soru","options":["A","B","C","D"],"difficulty":"MEDIUM","category":"Eğlence","gameMode":"SOCIAL"}]' },
  { mode: 'SOCIAL', cat: 'Yasam', prompt: 'Sen sosyal oyun soru yazarısın. 20 SOCIAL sorusu. [ISIM] placeholder. Kategori: Yaşam. JSON: [{"text":"soru","options":["A","B","C","D"],"difficulty":"MEDIUM","category":"Yaşam","gameMode":"SOCIAL"}]' },
  { mode: 'SOCIAL', cat: 'Anilar', prompt: 'Sen sosyal oyun soru yazarısın. 20 SOCIAL sorusu. [ISIM] placeholder. Kategori: Anılar. JSON: [{"text":"soru","options":["A","B","C","D"],"difficulty":"MEDIUM","category":"Anılar","gameMode":"SOCIAL"}]' },
  { mode: 'QUIZ', cat: 'Turkiye', prompt: 'Sen quiz soru yazarısın. 20 QUIZ sorusu. Kategori: Türkiye (tarih, kultur, cografya). Tek dogru cevap. JSON: [{"text":"soru","options":["A","B","C","D"],"correct":"dogru sik","difficulty":"MEDIUM","category":"Türkiye","gameMode":"QUIZ","ageGroup":"ADULT"}]' },
  { mode: 'QUIZ', cat: 'Cografya', prompt: 'Sen quiz soru yazarısın. 20 QUIZ sorusu. Kategori: Coğrafya. JSON: [{"text":"soru","options":["A","B","C","D"],"correct":"dogru sik","difficulty":"MEDIUM","category":"Coğrafya","gameMode":"QUIZ","ageGroup":"ADULT"}]' },
  { mode: 'QUIZ', cat: 'PopKultur', prompt: 'Sen quiz soru yazarısın. 20 QUIZ sorusu. Kategori: Pop Kültür. JSON: [{"text":"soru","options":["A","B","C","D"],"correct":"dogru sik","difficulty":"MEDIUM","category":"Pop Kültür","gameMode":"QUIZ","ageGroup":"ADULT"}]' },
  { mode: 'QUIZ', cat: 'Bilim', prompt: 'Sen quiz soru yazarısın. 20 QUIZ sorusu. Kategori: Bilim. JSON: [{"text":"soru","options":["A","B","C","D"],"correct":"dogru sik","difficulty":"MEDIUM","category":"Bilim","gameMode":"QUIZ","ageGroup":"ADULT"}]' },
  { mode: 'QUIZ', cat: 'Spor', prompt: 'Sen quiz soru yazarısın. 20 QUIZ sorusu. Kategori: Spor. JSON: [{"text":"soru","options":["A","B","C","D"],"correct":"dogru sik","difficulty":"MEDIUM","category":"Spor","gameMode":"QUIZ","ageGroup":"ADULT"}]' },
];

let totalSaved = 0;
for (const job of jobs) {
  process.stdout.write(`${job.mode}/${job.cat}... `);
  const questions = await generateQuestions(job.prompt);
  const saved = await saveQuestions(questions, job.mode);
  totalSaved += saved;
  console.log(`${saved} kaydedildi`);
  await new Promise(r => setTimeout(r, 800));
}

console.log('\nTOPLAM:', totalSaved, 'soru eklendi');
await pool.end();
