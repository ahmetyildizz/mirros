import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret         = req.headers.get("x-seed-secret");
  const expectedSecret = process.env.SEED_SECRET;

  // Her ortamda secret zorunlu — development dahil
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Temizlik
  await db.$executeRawUnsafe('TRUNCATE "Score","Guess","Answer","Round","Insight","Game" CASCADE');
  await db.$executeRawUnsafe('TRUNCATE "RoomParticipant","Room" CASCADE');
  await db.$executeRawUnsafe('TRUNCATE "Question" CASCADE');

  console.log("Database cleaned. Seeding starting...");

  // ─── EXPOSE (DEDİKODU MASASI) ──────────────────────────────────────────────
  const exposeQuestions = [
    // NORMAL (EASY)
    { text: "Kıyamet kopsa zombi istilasında grupta ilk kim ölür?", category: "Eğlence", gameMode: "EXPOSE", difficulty: "EASY", penalty: "En yüksek oyu alan kişi zombilerin taklidini yapsın." },
    { text: "Bir soygun yapsak ortadan ilk kim kaybolup bizi satar?", category: "İhanet", gameMode: "EXPOSE", difficulty: "EASY", penalty: "Kazanan, masaya hayali bir rüşvet vererek kendini kurtarmaya çalışsın." },
    { text: "Zengin olsa bizi ilk kim tanımazlıktan gelir?", category: "Para", gameMode: "EXPOSE", difficulty: "EASY", penalty: "Kazanan, sanki milyoner olmuş gibi iğrenç bir zengin taklidi yapsın." },
    { text: "Issız bir adaya düşsek grubun hayatta kalma şansını kim sıfırlar?", category: "Kaos", gameMode: "EXPOSE", difficulty: "EASY", penalty: "Kazanan, Hindistan cevizi kırıyormuş gibi yapsın." },
    { text: "En saçma şaka kurbanı olmaya en müsait kişi kimdir?", category: "Eğlence", gameMode: "EXPOSE", difficulty: "EASY", penalty: "En yüksek oyu alan 10 saniye boyunca kahkahalarla gülmeli." },

    // HOT (MEDIUM)
    { text: "Şu an en gizli sekmesi en tehlikeli olan kişi kimdir?", category: "Tehlike", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "En yüksek oyu alan, telefonunun son 3 aramasını okur." },
    { text: "Eski sevgilisinin storylerine sahte hesaptan bakan o kişi kim?", category: "Tehlike", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "En yüksek oyu alan, bir dakika boyunca 'stalker' gibi davranmalı." },
    { text: "Gruptaki birinin sırrını 'dayanamayıp' başkasına anlatacak olan kim?", category: "İhanet", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "En yüksek oyu alan, masadaki birine en küçük sırrını açıklasın." },
    { text: "Bir arkadaşlık grubunu fitne çıkarıp dağıtabilecek potansiyel kimde?", category: "Tehlike", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "En yüksek oyu alan, 30 saniye boyunca bir kötü karakter kahkahası atsın." },
    { text: "En son kimin hakkında 'iyi ki burada değil' diye arkasından konuşuldu?", category: "Tehlike", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "En yüksek oyu alan, o kişinin bir taklidini yapsın." },

    // NUCLEAR (HARD)
    { text: "Yalan söylerken gözü bile kırpmayan, aramıza sızmış o ajan kim?", category: "Kaos", gameMode: "EXPOSE", difficulty: "HARD", penalty: "En yüksek oyu alan, telefonundaki galeride son 5 fotoğrafı hızlıca göstersin." },
    { text: "Sevgilisiyle kavga ederken tüm gruptan destek bekleyip başımızı ağrıtan kim?", category: "Kaos", gameMode: "EXPOSE", difficulty: "HARD", penalty: "Sevgilisini arayıp 'Seni seviyorum ama telefonu kapatmam lazım' desin." },
    { text: "Kendi çıkarı için gruptaki en yakın arkadaşını bir saniyede harcayacak olan?", category: "İhanet", gameMode: "EXPOSE", difficulty: "HARD", penalty: "En yüksek oyu alan, masadaki birine 'Senin hakkında aslında şunu düşünüyorum' desin (eğlence amaçlı!)." },
    { text: "Aramızda en samimiyetsiz davranıp aslında hepimizi içten içe eleştiren kim?", category: "Tehlike", gameMode: "EXPOSE", difficulty: "HARD", penalty: "En yüksek oyu alan, 15 saniye boyunca iğneleyici bir konuşma yapsın." },
    { text: "Yatağa en son kiminle girmek istersiniz? (Kaos Başlasın)", category: "Tehlike", gameMode: "EXPOSE", difficulty: "HARD", penalty: "En yüksek oyu alan, odadaki en çekici bulduğu kişiyi (arkadaşça) göstersin." },

    // OFİS KAOSU
    { text: "Şu an Slack/Teams üzerinden gizlice patronu çekiştiren kimdir?", category: "Ofis Kaosu", gameMode: "EXPOSE", difficulty: "EASY", penalty: "En son attığı iş mesajını 'bebek sesiyle' okusun." },
    { text: "Şirkette bir soygun planlansa, güvenlik açıklarını ilk kim fark eder?", category: "Ofis Kaosu", gameMode: "EXPOSE", difficulty: "EASY", penalty: "Casus gibi masanın etrafında sessizce bir tur atsın." },
    { text: "Pazartesi sendromunu tüm ofise bulaştıran o karanlık enerji kimde?", category: "Ofis Kaosu", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "En dramatik 'Pazartesi sabahı' yüz ifadesini sergilesin." },
    { text: "Kimin tarayıcı geçmişi ortaya çıksa İK departmanı anında kapıya dayanır?", category: "Ofis Kaosu", gameMode: "EXPOSE", difficulty: "HARD", penalty: "İK uzmanıymış gibi kendini sertçe sorgulasın." },
    { text: "Toplantı sırasında 'Benim internetim dondu' yalanına en çok sığınan kim?", category: "Ofis Kaosu", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "30 saniye boyunca robot gibi donmuş taklidi yapsın." },
  ];

  for (const q of exposeQuestions) {
    await db.question.create({ data: { ...q, isActive: true, options: [], gameMode: q.gameMode as any, difficulty: q.difficulty as any } });
  }

  // ─── SOSYAL SORULAR ──────────────────────────────────────────────────────────
  const social = [
    { text: "Gecenin 3'ünde uyandırsan bile yiyebileceğin şey nedir?", category: "Yemek", ageGroup: "ADULT", gameMode: "SOCIAL", options: ["Lahmacun", "Çikolata", "Çorba", "Pizza"], penalty: "Yanlış tahmin edenler masadan kalkıp komik dans etmeli 🕺" },
    { text: "En son ne zaman yalan söyledin ve neden?", category: "İtiraf", ageGroup: "ADULT", gameMode: "SOCIAL", options: ["Bugün — küçük bir şeydi", "Bu hafta — zorunluydum", "Geçen ay", "Ben hiç yalan söylemem 😇"], penalty: "Yanlış bilenler gruba gerçek bir itiraf yapmalı 🤫" },
    { text: "Partnerin seni bir ünlüyle aldatsa (hayali), bu kim olurdu?", category: "İlişki", ageGroup: "ADULT", gameMode: "SOCIAL", options: ["Hollywood aktörü/aktristi", "Ünlü bir popçu", "Eski bir dizi oyuncusu", "Sosyal medya fenomeni"] },
    { text: "Zombi istilasında partnerin seni kurtarır mı yoksa terk edip kaçar mı?", category: "İlişki", ageGroup: "ADULT", gameMode: "SOCIAL", options: ["Kesinlikle beni kurtarır", "Kendi canını zor kurtarır", "Beni zombilere yem yapar!", "İkimiz de birlikte yok oluruz"] },
    { text: "Arkadaşların seni hangi kelimeyle tanımlar?", category: "Kişilik", gameMode: "SOCIAL", options: ["Eğlenceli", "Sakin", "Kaotik", "Güvenilir"], penalty: "Yanlış tahmin eden kişi gruptakilerden o kelimeyi neden hak etmediğini savunmalarını istemeli 😂" },
  ];

  for (const q of social) {
    await db.question.create({ data: { ...q, isActive: true } as any });
  }

  // ─── QUIZ ───────────────────────────────────────────────────────────────────
  const quiz = [
    { text: "Pinokyo yalan söylediğinde ne olur?", category: "Çizgi", gameMode: "QUIZ", ageGroup: "CHILD", options: ["Burnu uzar", "Rengi değişir", "Küçülür", "Uçar"], correct: "Burnu uzar" },
    { text: "Türkiye kaç ilde yönetilmektedir?", category: "Türkiye", gameMode: "QUIZ", ageGroup: "ADULT", options: ["71", "79", "81", "83"], correct: "81", difficulty: "MEDIUM" },
    { text: "Hangi element periyodik tabloda 'Au' simgesiyle gösterilir?", category: "Kimya", gameMode: "QUIZ", ageGroup: "ADULT", options: ["Gümüş", "Alüminyum", "Altın", "Arsenik"], correct: "Altın", difficulty: "MEDIUM" },
  ];

  for (const q of quiz) {
    await db.question.create({ data: { ...q, isActive: true } as any });
  }

  const count = await db.question.count();
  console.log(`Successfully seeded ${count} questions.`);
  return NextResponse.json({ ok: true, count });
}
