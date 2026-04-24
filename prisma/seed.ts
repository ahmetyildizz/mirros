import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning database...");
  await db.$executeRawUnsafe('TRUNCATE "Score","Guess","Answer","Round","Insight","Game" CASCADE');
  await db.$executeRawUnsafe('TRUNCATE "RoomParticipant","Room" CASCADE');
  await db.$executeRawUnsafe('TRUNCATE "Question" CASCADE');

  // ─── EXPOSE (DEDİKODU MASASI) ──────────────────────────────────────────────
  const exposeQuestions = [
    // EASY (Normal)
    { text: "Kıyamet kopsa zombi istilasında grupta ilk kim ölür?", category: "Eğlence", gameMode: "EXPOSE", difficulty: "EASY", penalty: "En yüksek oyu alan kişi zombilerin taklidini yapsın." },
    { text: "Bir soygun yapsak ortadan ilk kim kaybolup bizi satar?", category: "İhanet", gameMode: "EXPOSE", difficulty: "EASY", penalty: "Kazanan, masaya hayali bir rüşvet vererek kendini kurtarmaya çalışsın." },
    { text: "Zengin olsa bizi ilk kim tanımazlıktan gelir?", category: "Para", gameMode: "EXPOSE", difficulty: "EASY", penalty: "Kazanan, sanki milyoner olmuş gibi iğrenç bir zengin taklidi yapsın." },
    { text: "Issız bir adaya düşsek grubun hayatta kalma şansını kim sıfırlar?", category: "Kaos", gameMode: "EXPOSE", difficulty: "EASY", penalty: "Kazanan, Hindistan cevizi kırıyormuş gibi yapsın." },
    
    // MEDIUM (Hot)
    { text: "Şu an en gizli sekmesi en tehlikeli olan kişi kimdir?", category: "Tehlike", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "En yüksek oyu alan, telefonunun son 3 aramasını okur." },
    { text: "Eski sevgilisinin storylerine sahte hesaptan bakan o kişi kim?", category: "Tehlike", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "En yüksek oyu alan, bir dakika boyunca 'stalker' gibi davranmalı." },
    { text: "Gruptaki birinin sırrını 'dayanamayıp' başkasına anlatacak olan kim?", category: "İhanet", gameMode: "EXPOSE", difficulty: "MEDIUM", penalty: "En yüksek oyu alan, masadaki birine en küçük sırrını açıklasın." },

    // HARD (Nuclear)
    { text: "Yalan söylerken gözü bile kırpmayan, aramıza sızmış o ajan kim?", category: "Kaos", gameMode: "EXPOSE", difficulty: "HARD", penalty: "En yüksek oyu alan, telefonundaki galeride son 5 fotoğrafı hızlıca göstersin." },
    { text: "Kendi çıkarı için gruptaki en yakın arkadaşını bir saniyede harcayabilecek kim?", category: "İhanet", gameMode: "EXPOSE", difficulty: "HARD", penalty: "En yüksek oyu alan, masadaki birine 'Aslında şunu düşünüyorum' desin." },
    { text: "Aramızda en samimiyetsiz davranıp aslında hepimizi içten içe eleştiren kim?", category: "Tehlike", gameMode: "EXPOSE", difficulty: "HARD", penalty: "En yüksek oyu alan, 15 saniye boyunca iğneleyici bir konuşma yapsın." },

    // OFİS KAOSU
    { text: "Şu an Slack/Teams üzerinden gizlice patronu çekiştiren kimdir?", category: "Ofis Kaosu", gameMode: "EXPOSE", difficulty: "EASY", penalty: "En son attığı iş mesajını 'bebek sesiyle' okusun." },
    { text: "Şirkette bir soygun planlansa, güvenlik açıklarını ilk kim fark eder?", category: "Ofis Kaosu", gameMode: "EXPOSE", difficulty: "EASY", penalty: "Casus gibi masanın etrafında sessizce bir tur atsın." },
    { text: "Kimin tarayıcı geçmişi ortaya çıksa İK departmanı anında kapıya dayanır?", category: "Ofis Kaosu", gameMode: "EXPOSE", difficulty: "HARD", penalty: "İK uzmanıymış gibi kendini sertçe sorgulasın." },
  ];

  for (const q of exposeQuestions) {
    await db.question.create({ data: { ...q, isActive: true, options: [] } as any });
  }

  // ─── SOSYAL SORULAR ──────────────────────────────────────────────────────────
  const social = [
    { text: "Gecenin 3'ünde uyandırsak [İSİM] ne yiyordur?", category: "Yemek", ageGroup: "ADULT", gameMode: "SOCIAL", options: ["Lahmacun", "Çikolata", "Çorba", "Pizza"] },
    { text: "[İSİM] en son ne zaman yalan söyledi?", category: "İtiraf", ageGroup: "ADULT", gameMode: "SOCIAL", options: ["Bugün", "Bu hafta", "Geçen ay", "Hiç"] },
  ];

  for (const q of social) {
    await db.question.create({ data: { ...q, isActive: true } as any });
  }

  // ─── QUIZ ───────────────────────────────────────────────────────────────────
  const quiz = [
    { text: "Türkiye'nin başkenti neresidir?", category: "Coğrafya", gameMode: "QUIZ", ageGroup: "CHILD", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], correct: "Ankara" },
    { text: "Hangisi Türkiye'nin en büyük gölüdür?", category: "Coğrafya", gameMode: "QUIZ", ageGroup: "ADULT", options: ["Tuz Gölü", "Van Gölü", "Beyşehir Gölü", "Eğirdir Gölü"], correct: "Van Gölü" },
  ];

  for (const q of quiz) {
    await db.question.create({ data: { ...q, isActive: true } as any });
  }

  console.log("Seed finished successfully.");
}

main().catch(console.error).finally(() => db.$disconnect());
