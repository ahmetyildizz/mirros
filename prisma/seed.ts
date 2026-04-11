import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// ── SOSYAL SORULAR (birbirini tanıma, seçmeli) ────────────────────────────
const socialQuestions = [
  // ── İLİŞKİ & PARTNER ───────────────────────────────────────────────────
  { text: "Partnerin seni bir ünlüyle aldatsa (hayali), bu kim olurdu?", category: "İlişki", options: ["Hollywood aktörü/aktristi", "Ünlü bir popçu", "Eski bir dizi oyuncusu", "Sosyal medya fenomeni"] },
  { text: "Zombi istilasında partnerin seni kurtarır mı yoksa terk edip kaçar mı?", category: "İlişki", options: ["Kesinlikle beni kurtarır", "Kendi canını zor kurtarır", "Beni zombilere yem yapar!", "İkimiz de birlikte yok oluruz"] },
  { text: "Partnerin seninle hangi konuda tartışmayı sevmez çünkü kaybedeceğini bilir?", category: "İlişki", options: ["Futbol / Spor", "Geçmişteki detaylar", "Yön bulma / Navigasyon", "Mutfak / Yemek işleri"] },
  { text: "Partnerin en çok hangi eşyandan gizlice kurtulmak istiyor?", category: "İlişki", options: ["Eski ve delik tişörtün", "Gereksiz koleksiyonun", "Aşırı yer kaplayan bir cihazın", "En sevdiğin ama rüküş ayakkabın"] },
  { text: "Aşkta mı önce davranırsın?", category: "İlişki", options: ["Evet, hemen belli ederim", "Hayır, karşıdan beklerim", "Duruma göre değişir", "Asla ilk adımı atmam"] },
  { text: "Bir ilişkide kırılma noktan ne olur?", category: "İlişki", options: ["Yalan", "İlgisizlik", "Kıskançlık", "Saygısızlık"] },
  { text: "Sevdiğine sevgini en çok nasıl gösterirsin?", category: "İlişki", options: ["Sözlerle (Övgü/Onay)", "Hediye alarak", "Vakit geçirerek", "Yardımcı olarak/Hizmet"] },
  { text: "Partnerinle hayalindeki en romantik aktivite nedir?", category: "İlişki", options: ["Baş başa akşam yemeği", "Doğa yürüyüşü/Kamp", "Film/Dizi maratonu", "Birlikte seyahat"] },
  { text: "İlişkide en çok hangisine ihtiyaç duyarsın?", category: "Duygu", options: ["Anlaşılmak", "Takdir edilmek", "Güvende hissetmek", "Özgür hissetmek"] },
  
  // ── KİŞİLİK & GARİP HUYLAR ──────────────────────────────────────────────
  { text: "Partnerinin en sevdiği 'guilty pleasure' (gizli zevk) aktivitesi hangisidir?", category: "Kişilik", options: ["Saçma reality showlar izlemek", "Gece yarısı aşırı tatlı yemek", "Aşırı pahalı eşyalar almak", "Kendi kendine dans edip şarkı söylemek"] },
  { text: "Partnerin senin en çok hangi huyuna 'sinir' olur ama söyleyemez?", category: "Kişilik", options: ["Sürekli geç kalmana", "Eşyaları her yere dağıtmana", "Telefonla çok fazla oynamana", "Çok sesli yemek yememe"] },
  { text: "Eğer yarın sabah partnerinin bedeninde uyansaydım, yapacağım ilk şey ne olurdu?", category: "Kişilik", options: ["Ayna karşısında kendimi incelerdim", "Onun işine gidip her şeyi karıştırırdım", "Onun en sevdiği yemeği kendime yapardım", "Gün boyu uyuyarak tadını çıkarırdım"] },
  { text: "Kendini bir hayvana benzetseydin ne olurdun?", category: "Kişilik", options: ["Aslan", "Kedi", "Köpek", "Kartal"] },
  { text: "Arkadaşların seni nasıl tanımlar?", category: "Kişilik", options: ["Eğlenceli", "Güvenilir", "Yaratıcı", "Sakin"] },
  { text: "En büyük korkun nedir?", category: "Kişilik", options: ["Yükseklik", "Yalnızlık", "Karanlık", "Başarısızlık"] },

  // ── YAŞAM & KAOS ────────────────────────────────────────────────────────
  { text: "Evinizde bir yangın çıksa (tüm canlılar güvende!), partnerin ilk hangi eşyayı kurtarmaya çalışırdı?", category: "Yaşam", options: ["Bilgisayarını / Konsolunu", "En sevdiği kıyafetini", "Fotoğraf albümlerini", "Mutfaktaki Airfryer'ı!"] },
  { text: "Piyangodan büyük ikramiye çıksa, partnerin bunu ilk kime söylerdi?", category: "Yaşam", options: ["İlk bana (partnerine) söyler", "Ailesinden birine söyler", "En yakın arkadaşına söyler", "Kimseye söylemez, gizlice harcar"] },
  { text: "Partnerin en çok hangi konuda 'uzman' olduğunu düşünüyor (ama aslında değil)?", category: "Yaşam", options: ["Yemek yapmak", "Teknoloji tamiri", "Siyaset / Futbol", "Harita okumak / Navigasyon"] },
  { text: "Partnerin senin hangi yemeğini 'beğenmiyormuş gibi yapıp' (aslında bayılarak) yediğini düşünüyorsun?", category: "Yaşam", options: ["Her yemeğimi beğeniyor", "Sadece tatlılarımı", "Makarna/Pilav gibi basit şeyleri", "Her yemeğimden nefret ediyor (espiri!)"] },
  { text: "Hafta sonunu nasıl geçirirsin?", category: "Yaşam", options: ["Evde dinlenirim", "Dışarı çıkarım", "Arkadaşlarla buluşurum", "Bir şeyler keşfederim"] },
  { text: "Sabahları nasıl uyanırsın?", category: "Yaşam", options: ["Zil çalmadan taze uyanırım", "Zil sesi gerekli", "İlk alarma bakar uyurum", "Zorla kalkabilirim"] },
  { text: "Stresi nasıl atarsın?", category: "Yaşam", options: ["Spor yaparım", "Müzik dinlerim", "Uyurum", "Arkadaşlarla vakit geçiririm"] },
  { text: "Uyku düzenin nasıl?", category: "Yaşam", options: ["Erken yatar erken kalkarım", "Gece kuşuyum", "Düzensizim", "Fırsat buldukça uyurum"] },

  // ── DUYGU & EĞLENCE ─────────────────────────────────────────────────────
  { text: "Partnerin senin için hangi şarkıyı söylerken en çok 'detone' olur?", category: "Duygu", options: ["Romantik bir aşk şarkısı", "Hareketli bir pop parçası", "Ağır bir arabesk", "Uydurma bir çocuk şarkısı"] },
  { text: "Seni en çok neyle güldürebilirim?", category: "Duygu", options: ["Kötü esprilerle", "Komik danslarla", "Gıdıklayarak", "Eski anılarımızı hatırlatarak"] },
  { text: "Sinirlenince ne yaparsın?", category: "Duygu", options: ["Sessiz kalırım", "Konuşarak çözerim", "Yürüyüşe çıkarım", "Bir süre uzaklaşırım"] },
  
  // ── DİĞER (Filler) ──────────────────────────────────────────────────────
  { text: "En önemli değerin hangisi?", category: "Değerler", options: ["Dürüstlük", "Sadakat", "Özgürlük", "Başarı"] },
  { text: "Sosyal medyayı nasıl kullanırsın?", category: "Dijital", options: ["Aktif paylaşırım", "Sadece takip ederim", "Nadir kullanırım", "Hiç açmam"] },
  { text: "Çocukken ne olmak istiyordun?", category: "Nostalji", options: ["Sporcu", "Sanatçı/Müzisyen", "Doktor/Öğretmen", "Pilot/Astronot"] },
  { text: "Hangi süper güç isterdin?", category: "Hayal", options: ["Görünmezlik", "Uçmak", "Zaman durdurmak", "Zihin okumak"] },
  { text: "Çocukluğundan en çok neyi özlüyorsun?", category: "Nostalji", options: ["Sokak oyunlarını", "Bayram sabahlarını", "Okula gitmeyi", "Sorumsuzluğu"] },
  { text: "Geçmişe gidebilseydin hangi yılı seçerdin?", category: "Hayal", options: ["90'lar", "80'ler", "2000'lerin başı", "Geleceğe giderdim"] },
  { text: "Partnerin bir günlüğüne bir hayvana dönüşse, bu ne olurdu?", category: "İlişki", options: ["Kedi (Keyfine düşkün)", "Köpek (Sadık ve oyunbaz)", "Aslan (Dominant)", "Tembel Hayvan (Uykucu)"] },
  { text: "Partnerin seni bir kokuya benzetse, bu ne kokusu olurdu?", category: "Duygu", options: ["Taze Kahve", "Yağmur Sonrası Toprak", "Vanilya / Kurabiye", "Deniz İyodu"] },
  { text: "Partnerin en çok hangi konuda 'yetenek abidesi' olduğunu sanıyor?", category: "Yaşam", options: ["Araba Park Etme", "Yemek Yapma", "Espri Yapma", "Şans Oyunları"] },
  { text: "Partnerin senin en çok hangi 'mimik'ine bayılıyor?", category: "Duygu", options: ["Gülerken gözlerinin kısılmasına", "Düşünürken dudağını büzmene", "Şaşırınca kaşlarını kaldırmana", "Kızınca burnundan solumana!"] },
] as const;

// ── ÇOCUK (7-12 yaş) ─────────────────────────────────────────────────────
const quizChild = [
  { text: "Türkiye'nin başkenti neresidir?", category: "Coğrafya", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], correct: "Ankara" },
  { text: "Güneş sistemimizdeki en büyük gezegen hangisidir?", category: "Fen", options: ["Satürn", "Mars", "Jüpiter", "Neptün"], correct: "Jüpiter" },
  { text: "Bir haftada kaç gün vardır?", category: "Matematik", options: ["5", "6", "7", "8"], correct: "7" },
  { text: "Hangi hayvan 'meee' sesi çıkarır?", category: "Hayvanlar", options: ["İnek", "Koyun", "At", "Tavuk"], correct: "Koyun" },
  { text: "Gökkuşağında kaç renk vardır?", category: "Fen", options: ["5", "6", "7", "8"], correct: "7" },
  { text: "En büyük okyanus hangisidir?", category: "Coğrafya", options: ["Atlantik", "Hint", "Arktik", "Pasifik"], correct: "Pasifik" },
  { text: "Kaç tane birincil renk vardır?", category: "Sanat", options: ["2", "3", "4", "5"], correct: "3" },
  { text: "Hangi gezegen Güneş'e en yakındır?", category: "Fen", options: ["Venüs", "Mars", "Merkür", "Dünya"], correct: "Merkür" },
  { text: "Arının ürettiği tatlı madde nedir?", category: "Doğa", options: ["Süt", "Bal", "Şeker", "Reçel"], correct: "Bal" },
  { text: "Hangi renk ile sarıyı karıştırırsan yeşil elde edersin?", category: "Sanat", options: ["Kırmızı", "Mavi", "Beyaz", "Siyah"], correct: "Mavi" },
  { text: "Martı hangi ortamda yaşar?", category: "Hayvanlar", options: ["Orman", "Çöl", "Deniz kıyısı", "Dağ"], correct: "Deniz kıyısı" },
  { text: "Dünyanın en uzun nehri hangisidir?", category: "Coğrafya", options: ["Amazon", "Nil", "Yangtze", "Mississippi"], correct: "Nil" },
  { text: "Hangi hayvan en hızlı koşar?", category: "Hayvanlar", options: ["Aslan", "Çita", "Leopar", "Pars"], correct: "Çita" },
  { text: "12 çarpı 12 kaçtır?", category: "Matematik", options: ["124", "132", "144", "154"], correct: "144" },
  { text: "Hangi meyve portakal rengidir?", category: "Genel", options: ["Limon", "Portakal", "Muz", "Üzüm"], correct: "Portakal" },
] as const;

// ── GENÇ/YETİŞKİN ────────────────────────────────────────────────────────
const quizAdult = [
  { text: "Türkiye kaç ilde yönetilmektedir?", category: "Türkiye", options: ["71", "79", "81", "83"], correct: "81" },
  { text: "DNA'nın açılımı nedir?", category: "Fen", options: ["Deoksiribo Nükleik Asit", "Dinamik Nöral Asit", "Dijital Nötral Atom", "Direkt Nükleer Analiz"], correct: "Deoksiribo Nükleik Asit" },
  { text: "Hangi ülke 2022 FIFA Dünya Kupası'nı kazandı?", category: "Spor", options: ["Fransa", "Brezilya", "Arjantin", "Almanya"], correct: "Arjantin" },
  { text: "İstanbul fethinin gerçekleştiği yıl hangisidir?", category: "Tarih", options: ["1453", "1299", "1492", "1071"], correct: "1453" },
  { text: "Hangi element periyodik tabloda 'Au' simgesiyle gösterilir?", category: "Kimya", options: ["Gümüş", "Alüminyum", "Altın", "Arsenik"], correct: "Altın" },
  { text: "Dünyada en çok konuşulan dil hangisidir?", category: "Dünya", options: ["İngilizce", "İspanyolca", "Mandarin", "Arapça"], correct: "Mandarin" },
  { text: "Mona Lisa'yı kim yaptı?", category: "Sanat", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Picasso"], correct: "Leonardo da Vinci" },
  { text: "Işığın hızı yaklaşık kaçtır?", category: "Fizik", options: ["200.000 km/s", "300.000 km/s", "150.000 km/s", "400.000 km/s"], correct: "300.000 km/s" },
  { text: "Nobel Barış Ödülü hangi şehirde verilir?", category: "Dünya", options: ["Stockholm", "Oslo", "Kopenhag", "Helsinki"], correct: "Oslo" },
  { text: "Hangi organ insülin üretir?", category: "Biyoloji", options: ["Karaciğer", "Böbrek", "Pankreas", "Dalak"], correct: "Pankreas" },
  { text: "Hamlet'i kim yazdı?", category: "Edebiyat", options: ["Cervantes", "Molière", "Shakespeare", "Dante"], correct: "Shakespeare" },
  { text: "Hangi ülkede Eiffel Kulesi bulunur?", category: "Coğrafya", options: ["İtalya", "Belçika", "Fransa", "Almanya"], correct: "Fransa" },
  { text: "Osmanlı Devleti hangi yıl kuruldu?", category: "Tarih", options: ["1071", "1176", "1243", "1299"], correct: "1299" },
  { text: "Peki İnsan vücudunda kaç kemik bulunur?", category: "Biyoloji", options: ["186", "206", "226", "246"], correct: "206" },
  { text: "Türkiye'ede en uzun kıyı şeridine sahip il hangisidir?", category: "Coğrafya", options: ["Muğla", "Antalya", "İzmir", "İstanbul"], correct: "Muğla" },
] as const;

// ── BİLGE (derin bilgi) ───────────────────────────────────────────────────
const quizWise = [
  { text: "Kopernik'e göre güneş sisteminin merkezi nedir?", category: "Astronomi", options: ["Dünya", "Güneş", "Jüpiter", "Merkür"], correct: "Güneş" },
  { text: "Hangi antik felsefeci Sokrates'in öğrencisiydi?", category: "Felsefe", options: ["Aristoteles", "Platon", "Epiktetos", "Zenon"], correct: "Platon" },
  { text: "Rönesans hangi ülkede başladı?", category: "Tarih", options: ["Fransa", "İtalya", "Almanya", "İspanya"], correct: "İtalya" },
  { text: "Kuantum mekaniğinin kurucularından biri kimdir?", category: "Fizik", options: ["Isaac Newton", "Albert Einstein", "Max Planck", "James Watt"], correct: "Max Planck" },
  { text: "'Yıldızlı Gece' tablosunu kim yaptı?", category: "Sanat", options: ["Claude Monet", "Pablo Picasso", "Vincent van Gogh", "Paul Gauguin"], correct: "Vincent van Gogh" },
  { text: "İnsan genomunda yaklaşık kaç gen bulunur?", category: "Biyoloji", options: ["5.000", "10.000", "20.000", "50.000"], correct: "20.000" },
  { text: "Fotosentez sırasında bitkiler hangi gazı absorbe eder?", category: "Fen", options: ["Oksijen", "Azot", "Karbondioksit", "Hidrojen"], correct: "Karbondioksit" },
  { text: "Hangi imparator Roma'yı yaktığı iddia edilir?", category: "Tarih", options: ["Caligula", "Commodus", "Nero", "Tiberius"], correct: "Nero" },
  { text: "E=mc² formülünde 'c' neyi temsil eder?", category: "Fizik", options: ["Kütle", "Enerji", "Işık hızı", "İvme"], correct: "Işık hızı" },
  { text: "Boyle-Mariotte kanunu hangi ilişkiyi açıklar?", category: "Kimya", options: ["Isı-hacim", "Basınç-hacim", "Basınç-sıcaklık", "Kütle-enerji"], correct: "Basınç-hacim" },
  { text: "Hangi matematikçi ilk diferansiyel hesabı geliştirdi?", category: "Matematik", options: ["Euler", "Gauss", "Newton/Leibniz", "Fermat"], correct: "Newton/Leibniz" },
  { text: "Magna Carta hangi ülkede imzalandı?", category: "Tarih", options: ["Fransa", "İngiltere", "Hollanda", "Almanya"], correct: "İngiltere" },
  { text: "Hangi teoriye göre evren genişlemektedir?", category: "Astronomi", options: ["Büyük Çöküş", "Büyük Patlama", "Sabit Durum", "Döngüsel Evren"], correct: "Büyük Patlama" },
  { text: "Aristoteles hangi konuyu 'ilk felsefe' olarak adlandırdı?", category: "Felsefe", options: ["Epistemoloji", "Metafizik", "Etik", "Mantık"], correct: "Metafizik" },
  { text: "DNA'nın çift sarmal yapısını kim keşfetti?", category: "Biyoloji", options: ["Mendel & Darwin", "Watson & Crick", "Pasteur & Koch", "Curie & Bohr"], correct: "Watson & Crick" },
] as const;

async function main() {
  // Dev kullanıcısı
  await db.user.upsert({
    where:  { email: "dev@mirros.app" },
    update: {},
    create: { id: "dev-user-001", email: "dev@mirros.app", username: "devuser" },
  });

  // Tüm bağımlı verileri temizle (Foreign Key hatalarını önlemek için)
  await db.score.deleteMany({});
  await db.guess.deleteMany({});
  await db.answer.deleteMany({});
  await db.round.deleteMany({});
  await db.game.deleteMany({});
  
  // Tüm soruları temizle
  await db.question.deleteMany({});
  console.log("Eski oyun verileri ve sorular temizlendi.");

  // Sosyal seçmeli sorular
  for (const q of socialQuestions) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "SOCIAL", options: [...q.options], isActive: true },
    });
  }

  const exposeQuestions = [
    { text: "Kıyamet kopsa zombi istilasında grupta ilk kim ölür?", category: "Eğlence", penalty: "En yüksek oyu alan kişi zombilerin taklidini yapsın." },
    { text: "Şu an en gizli sekmesi en tehlikeli olan kişi kimdir?", category: "Tehlike", penalty: "En yüksek oyu alan, telefonunun son 3 aramasını okur." },
    { text: "Bir soygun yapsak ortadan ilk kim kaybolup bizi satar?", category: "İhanet", penalty: "Kazanan, masaya rüşvet veriyormuş taklidi yapsın." },
    { text: "Zengin olsa bizi ilk kim tanımazlıktan gelir?", category: "Para", penalty: "Sanki milyoner olmuş gibi iğrenç bir zengin taklidi yapsın." },
    { text: "Issız bir adaya düşsek grubun hayatta kalma şansını kim sıfırlar?", category: "Kaos", penalty: "Ağaçla kavga ediyormuş gibi yapsın." }
  ];

  for (const q of exposeQuestions) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "EXPOSE", penalty: q.penalty, options: [], isActive: true },
    });
  }

  // Quiz çocuk
  for (const q of quizChild) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "QUIZ", ageGroup: "CHILD", options: [...q.options], correct: q.correct, isActive: true },
    });
  }

  // Quiz yetişkin
  for (const q of quizAdult) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "QUIZ", ageGroup: "ADULT", options: [...q.options], correct: q.correct, difficulty: "MEDIUM", isActive: true },
    });
  }

  // Quiz bilge
  for (const q of quizWise) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "QUIZ", ageGroup: "WISE", options: [...q.options], correct: q.correct, difficulty: "HARD", isActive: true },
    });
  }

  const total = socialQuestions.length + quizChild.length + quizAdult.length + quizWise.length + exposeQuestions.length;
  console.log(`✓ ${total} soru eklendi (Expose dahi!)`);
}

main().catch(console.error).finally(() => db.$disconnect());
