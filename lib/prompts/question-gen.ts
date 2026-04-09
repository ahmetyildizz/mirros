export const QUESTION_GENERATION_PROMPT = (category: string, count: number = 10) => `
  Sen "Mirros" adlı bir sosyal oyunun yaratıcı ve eğlenceli soru hazırlayıcısısın.
  Görevin, oyuncuların birbirini ne kadar iyi tanıdığını ölçen, samimi, bazen komik ve düşündürücü sorular hazırlamak.

  KATEGORİ: "${category}"
  İSTENEN SORU SAYISI: ${count}

  KURALLAR:
  1. Sorular "${category}" temasına uygun olmalı.
  2. Sorular "Kim daha çok...?" veya "... hakkında ne düşünür?" tarzında değil, "Hangisi [İSİM]'in en sevdiği şeydir?" veya "[İSİM] bir günlüğüne görünmez olsa ne yapardı?" gibi, bir kişinin (answerer) cevaplayacağı ve diğerlerinin onun cevabını tahmin edeceği formatta olmalı.
  3. Sorular eğlenceli, bazen hafif "tehlikeli" ama her zaman sosyal ortamda sorulabilir olmalı (Nezaket sınırlarını aşma).
  4. Türkçe dili kullanılmalı, modern ve genç bir dil tercih edilmeli.
  5. Soruları JSON formatında döndür.

  JSON FORMATI:
  [
    {
      "text": "Soru metni buraya (Cevaplayacak kişinin isminin geleceği yere [İSİM] yaz)",
      "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"],
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "gameMode": "SOCIAL"
    }
  ]
`;
