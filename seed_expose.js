const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const exposeQuestions = [
  { text: "Kıyamet kopsa zombi istilasında grupta ilk kim ölür?", category: "Eğlence", gameMode: "EXPOSE", penalty: "En yüksek oyu alan kişi zombilerin taklidini yapsın." },
  { text: "Şu an en gizli sekmesi en tehlikeli olan kişi kimdir?", category: "Tehlike", gameMode: "EXPOSE", penalty: "En yüksek oyu alan, telefonunun son 3 aramasını okur." },
  { text: "Bir soygun yapsak ortadan ilk kim kaybolup bizi satar?", category: "İhanet", gameMode: "EXPOSE", penalty: "Kazanan, masaya hayali bir rüşvet vererek kendini kurtarmaya çalışsın." },
  { text: "Zengin olsa bizi ilk kim tanımazlıktan gelir?", category: "Para", gameMode: "EXPOSE", penalty: "Kazanan, sanki milyoner olmuş gibi iğrenç bir zengin taklidi yapsın." },
  { text: "Issız bir adaya düşsek grubun hayatta kalma şansını kim sıfırlar?", category: "Kaos", gameMode: "EXPOSE", penalty: "Kazanan, Hindistan cevizi kırıyormuş gibi yapsın." }
];

async function main() {
  console.log("Seeding EXPOSE questions...");
  for (const q of exposeQuestions) {
    await db.question.create({ data: q });
  }
  console.log("EXPOSE Questions Seeding finished.");
}

main().catch(console.error).finally(() => db.$disconnect());
