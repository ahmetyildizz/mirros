
import 'dotenv/config';
import { db } from '../lib/db';

async function main() {
  const exposeQuestions = [
    { text: "Şu an Slack/Teams üzerinden gizlice patronu çekiştiren kimdir?", category: "Ofis Kaosu", penalty: "En son attığı iş mesajını 'bebek sesiyle' okusun." },
    { text: "Şirkette bir soygun planlansa, güvenlik açıklarını ilk kim fark eder?", category: "Ofis Kaosu", penalty: "Casus gibi masanın etrafında sessizce bir tur atsın." },
    { text: "Pazartesi sendromunu tüm ofise bulaştıran o karanlık enerji kimde?", category: "Ofis Kaosu", penalty: "En dramatik 'Pazartesi sabahı' yüz ifadesini sergilesin." },
    { text: "Kimin tarayıcı geçmişi ortaya çıksa İK departmanı anında kapıya dayanır?", category: "Ofis Kaosu", penalty: "İK uzmanıymış gibi kendini sertçe sorgulasın." },
    { text: "Toplantı sırasında 'Benim internetim dondu' yalanına en çok sığınan kim?", category: "Ofis Kaosu", penalty: "30 saniye boyunca robot gibi donmuş taklidi yapsın." },
    { text: "Ofiste çıkan bedava pizzayı kimseye haber vermeden tek başına bitiren kim?", category: "Ofis Kaosu", penalty: "Sanki ağzı doluymuş gibi konuşmaya çalışsın." },
    { text: "İstifa dilekçesi şu an masaüstünde 'Draft' olarak bekleyen kim?", category: "Ofis Kaosu", penalty: "Çok havalı bir 'İstifa ediyorum' konuşması yapsın." },
  ];

  for (const q of exposeQuestions) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "EXPOSE", penalty: q.penalty, options: [], isActive: true },
    });
  }
  console.log('Ofis Kaosu questions added!');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
