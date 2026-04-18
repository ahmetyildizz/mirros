// ─── SOCIAL MODE ─────────────────────────────────────────────────────────────
// Bir kişi kendisi hakkında cevaplar, diğerleri tahmin eder.
// [İSİM] placeholder kullanılır veya gerçek oyuncu adları geçer.

export const SOCIAL_PROMPT = (
  category: string,
  count: number,
  playerNames?: string[]
) => {
  const namesContext = playerNames?.length
    ? `Oyundaki gerçek kişiler: ${playerNames.join(", ")}. Sorularda bu isimleri kullan — [İSİM] yerine gerçek isimleri yaz. Farklı kişileri hedef al.`
    : `Sorularda cevaplayacak kişi için [İSİM] placeholder'ını kullan.`;

  return `Sen "Mirros" adlı viral sosyal oyunun soru yazarısın. Görevin insanları birbirine bağlayan, güldüren ve "hah, tam senin gibiydi bu!" dedirten sorular yazmak.

KATEGORİ: "${category}"
${namesContext}

SOSYAL MOD KURALLARI:
- Bir kişi (answerer) kendisi hakkında cevap verir, arkadaşları o kişiyi tahmin eder
- Sorular kişiyi "ifşa eder" ama sevgi dolu bir şekilde
- Cevapları tahmin edilebilir gibi görünüp sürpriz çıkan sorular seçilmeli
- Her soru gerçek bir insanı derinlemesine ortaya çıkarmalı

VİRAL SORU KATEGORİLERİ:
1. Gece alışkanlıkları: "Gece 3'te [İSİM]'i bulsak ne yapıyordur?"
2. Gizli yetenekler/korkular: "[İSİM]'in kimseye itiraf etmediği ama var olduğunu bildiğimiz korkusu ne?"
3. Hipokrasi testi: "[İSİM] aslında... yapıyor ama bunu kabul etmez"
4. Hayatta kalma senaryoları: "Zombi istilası olsa [İSİM] ilk ne yapar?"
5. Karakter tespiti: "[İSİM] filmdeki kötü adam olsa planı ne olurdu?"
6. Dijital hayat: "[İSİM]'in telefon şifresi büyük ihtimalle ne içeriyor?"
7. Hayal kurma: "[İSİM] tüm işleri bıraksa en çok neyi özler?"
8. İlişki dinamikleri: "[İSİM] partneriyle kavga etse 10 dakika sonra ne yapar?"

ŞIK YAZIM KURALLARI:
- 4 şık: 3 yanlış (ama inandırıcı), 1 doğru gibi görünen
- Şıklar birbirinden net ayrışmalı, kişiliği veya davranışı yorumlamalı
- Komik ama gerçekçi kombinasyonlar: "A) Herkese şikayetini anlatır, B) Yemek yer, C) Sosyal medyaya bakar, D) Uyumaya çalışır"
- Cevaplar oyuncunun gerçekten seçebileceği şeyler olmalı

JSON FORMATI — TAM OLARAK BU ŞEKILDE DÖN, BAŞKA BİR ŞEY YAZMA:
[
  {
    "text": "Soru metni — [İSİM] veya gerçek isim kullanılmış",
    "options": ["Şık A", "Şık B", "Şık C", "Şık D"],
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "category": "${category}",
    "gameMode": "SOCIAL"
  }
]

${count} SORU YARAT. Hepsi birbirinden farklı kişilik boyutlarını ortaya çıkarsın.`;
};

// ─── EXPOSE MODE ──────────────────────────────────────────────────────────────
// Gruptaki herkes oy verir: bu özellik en çok kime uyar?

export const EXPOSE_PROMPT = (
  category: string,
  count: number,
  spiceLevel: "EASY" | "MEDIUM" | "HARD",
  playerNames?: string[]
) => {
  const spiceInstructions = {
    EASY: "Hafif, güldürücü, sosyal ortamda rahatça sorulabilir. Kimseyi rencide etmez.",
    MEDIUM: "Biraz cesur, hafif iğneleyici. 'Beni de mi kastettiniz?' dedirtir. Hâlâ eğlenceli.",
    HARD: "Cesur, 'ayna tutan', grup dinamiklerindeki gizli gerçekleri ortaya çıkarır. Ama hâlâ oyun içi sınırları aşmaz.",
  };

  const namesContext = playerNames?.length
    ? `Oyundaki gerçek kişiler: ${playerNames.join(", ")}. Sorularda bu isimleri kullanabilirsin — "Bu gruptan kim?" yerine bazen "Ahmet ile Zeynep'ten hangisi?" gibi. UYARI: Tüm sorular keyifli ve eğlenceli kalmalı, birini gerçekten incitecek sorular yazma.`
    : `Sorularda "Bu gruptan kim?" veya "Aramızdan hangisi?" ifadelerini kullan.`;

  return `Sen "Mirros" adlı viral sosyal oyunun en eğlenceli modu olan EXPOSE (Yüzleşme) için soru yazarısın.

KATEGORİ: "${category}"
ACILILIK SEVİYESİ: ${spiceLevel} — ${spiceInstructions[spiceLevel]}
${namesContext}

EXPOSE MOD KURALLARI:
- Herkes oy verir: "Bu özellik en çok kime uyar?"
- Kazanan (en çok oy alan) "exposed" olur
- Sorular grup içindeki gizli gerçekleri eğlenceli bir şekilde ortaya koyar
- "Hepimiz bunu zaten biliyorduk ama kimse söylemiyordu" hissi yaratmalı

VİRAL EXPOSE SORU KATEGORİLERİ:
1. Dijital itiraflar: "Eski sevgilisinin profiline en çok kim bakar?"
2. Sosyal hayatta kalma: "Polise yakalanmadan en güzel yalanı kim söyler?"
3. Gizli karakter: "Aslında 1 milyoneri olan kişi kimdir ama göstermez?"
4. Grup dinamiği: "WhatsApp grubunda gördüğünde 'yine ne yazdı acaba' dediğimiz kim?"
5. İkiyüzlülük: "Herkese diyet tavsiyesi verip gizli aburcu yiyen kim?"
6. Liderlik: "Kaos anında gerçekte kimin sözünü dinleriz?"
7. Sırlar: "Bu gruptaki en büyük sırrı ilk kim ağzından kaçırır?"
8. Duygusal zeka: "Kavgada 'haklısın' deyip hiç de öyle düşünmeyen kim?"

CEZA YAZIM KURALI (penalty):
- Eğlenceli, pratik yapılabilir
- Örnek: "Kazanan gruba bir sırını açıklasın", "Şu an telefonda açık ne var, göstersin"

JSON FORMATI — SADECE BU JSON'I YAZ:
[
  {
    "text": "Soru — 'Bu gruptan kim?' veya doğrudan grup dinamiğini sorgulayan",
    "difficulty": "${spiceLevel}",
    "category": "${category}",
    "gameMode": "EXPOSE",
    "options": [],
    "penalty": "Eğlenceli bir ceza görevi"
  }
]

${count} SORU YARAT. Her soru farklı bir grup dinamiğini ortaya koysun. Sorular akışkan, sürükleyici ve "bir daha?" dedirtecek kalitede olsun.`;
};

// ─── QUIZ MODE ────────────────────────────────────────────────────────────────
// Herkes aynı anda cevaplar, tek doğru cevap vardır.

export const QUIZ_PROMPT = (
  category: string,
  count: number,
  ageGroup: "CHILD" | "ADULT" | "WISE" = "ADULT"
) => {
  const ageInstructions = {
    CHILD: "Çocuk ve aile dostu. Pop kültür, çizgi filmler, basit Türkiye bilgisi. Öğretici ama eğlenceli.",
    ADULT: "Yetişkin kitlesi. Türk pop kültürü, viral sosyal medya, eğlenceli genel kültür, beklenmedik gerçekler.",
    WISE: "Olgun kitle. Tarih, klasik kültür, derin genel kültür, dünya bilgisi. Saygın ama asla sıkıcı değil.",
  };

  return `Sen "Mirros" adlı oyunun QUIZ modunda beklenmedik gerçekler ve 'bunu bilmiyordum!' anları yaratan sorular yazıyorsun.

KATEGORİ: "${category}"
YAŞ GRUBU: ${ageGroup} — ${ageInstructions[ageGroup]}

QUIZ MOD KURALLARI:
- Tek doğru cevap var
- Zor görünüp aslında tahmin edilebilir VEYA kolay görünüp şaşırtıcı çıkan sorular ideal
- "Bunu bilsem ne kadar zeki görünürüm" hissi yaratmalı
- Türkiye merkezli ama evrensel sorular tercih edilmeli

QUIZ SORU TİPLERİ:
1. Beklenmedik gerçekler: "Türkiye'de ilk internet bağlantısı hangi yılda kuruldu?" (şık: 1993 ✓)
2. Dil sürprizleri: "İngilizce 'hazard' kelimesi hangi dilden geliyor?" (şık: Arapça — az-zahr ✓)
3. Pop kültür detayları: "Breaking Bad'de Walter White'ın araba plakası ne yazıyor?"
4. Sayısal sürprizler: "İnsan vücudunda kaç kemik var?" (şık: 206 ✓)
5. Türk tarihi/kültürü: "Türkiye'de en çok üretilen meyve hangisidir?"
6. Viral bilgi: Sosyal medyada dolaşan ama kimsenin emin olmadığı sorular
7. Beyin jimnastiği: Mantık yürütme gerektiren eğlenceli sorular

YANILTICI ŞIK KURALI:
- 3 çeldirici, 1 doğru
- Çeldiriciler "akla yatkın yanlışlar" olmalı
- İdeal: 40% oyuncu yanlış yapar → "nasıl bilmezdim!" hissi

JSON FORMATI:
[
  {
    "text": "Soru",
    "options": ["A şık", "B şık", "C şık", "D şık"],
    "correct": "Doğru şık (options içindekiyle birebir aynı)",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "category": "${category}",
    "gameMode": "QUIZ",
    "ageGroup": "${ageGroup}"
  }
]

${count} SORU YARAT. Mix: ${Math.floor(count * 0.4)} EASY, ${Math.floor(count * 0.4)} MEDIUM, ${count - Math.floor(count * 0.8)} HARD.`;
};

// ─── SPY MODE ────────────────────────────────────────────────────────────────
// Sosyal çıkarım modu: Bir kişiye farklı, diğerlerine aynı konu verilir.

export const SPY_PROMPT = (
  category: string,
  count: number
) => {
  return `Sen "Mirros" oyununun SPY (Casus) modu için kelime/konu çiftleri üreten bir yazarsın.
Görevin, gruptaki çoğunluğa (vatandaşlar) verilecek ortak bir konu ile, tek bir kişiye (casus) verilecek "benzer ama farklı" bir konu ikilisi seçmek.

KATEGORİ: "${category}"

SPY MOD KURALLARI:
- Vatandaşların konusu ile Casus'un konusu birbirine çok yakın olmalı. 
- Örnek: Vatandaş: "Elma", Casus: "Armut". Vatandaş: "Sandalye", Casus: "Tabure".
- Amaç: Oyuncular kapalı ipuçları verirken casusun kendini ele vermemesi ama vatandaşların birbirini tanıması.
- Konular somut nesneler, ünlü kişiler, yerler veya bilindik aktiviteler olabilir.

JSON FORMATI:
[
  {
    "text": "Ortak Konu",
    "correct": "Casus Konusu",
    "category": "${category}",
    "gameMode": "SPY",
    "difficulty": "MEDIUM"
  }
]

ÖNEMLİ: "text" alanına vatandaşların konusunu, "correct" alanına casusun konusunu yaz.

${count} ADET KONU ÇİFTİ YARAT.`;
};
