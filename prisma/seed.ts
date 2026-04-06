import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// ── SOSYAL SORULAR (birbirini tanıma, seçmeli) ────────────────────────────
const socialQuestions = [
  { text: "En sevdiğin mevsim hangisi?", category: "Kişilik", options: ["İlkbahar", "Yaz", "Sonbahar", "Kış"] },
  { text: "Hafta sonunu nasıl geçirirsin?", category: "Yaşam", options: ["Evde dinlenirim", "Dışarı çıkarım", "Arkadaşlarla buluşurum", "Bir şeyler keşfederim"] },
  { text: "Hangi tür müzik seni en çok etkiler?", category: "Müzik", options: ["Pop", "Rock/Metal", "Klasik/Jazz", "Türk müziği"] },
  { text: "Hayal ettiğin tatil nasıl olur?", category: "Tatil", options: ["Deniz & güneş", "Doğa & yürüyüş", "Şehir & kültür", "Evden çıkmam"] },
  { text: "Kendini bir hayvana benzetseydin ne olurdun?", category: "Kişilik", options: ["Aslan", "Kedi", "Köpek", "Kartal"] },
  { text: "Sabahları nasıl uyanırsın?", category: "Yaşam", options: ["Zil çalmadan taze uyanırım", "Zil sesi gerekli", "İlk alarma bakar uyurum", "Zorla kalkabilirim"] },
  { text: "Sinirlenince ne yaparsın?", category: "Duygu", options: ["Sessiz kalırım", "Konuşarak çözerim", "Yürüyüşe çıkarım", "Bir süre uzaklaşırım"] },
  { text: "En önemli değerin hangisi?", category: "Değerler", options: ["Dürüstlük", "Sadakat", "Özgürlük", "Başarı"] },
  { text: "Bir hediye seçseydin ne isterdin?", category: "Eğlence", options: ["Deneyim (konser, seyahat)", "Teknoloji", "Kişisel bir şey", "Sürpriz olsun"] },
  { text: "Arkadaşların seni nasıl tanımlar?", category: "Kişilik", options: ["Eğlenceli", "Güvenilir", "Yaratıcı", "Sakin"] },
  { text: "Film seçerken önceliğin nedir?", category: "Eğlence", options: ["Komedi", "Aksiyon/Macera", "Dram/Romantik", "Korku/Gerilim"] },
  { text: "Stresi nasıl atarsın?", category: "Yaşam", options: ["Spor yaparım", "Müzik dinlerim", "Uyurum", "Arkadaşlarla vakit geçiririm"] },
  { text: "İdeal bir akşam yemeği nasıl olur?", category: "Yemek", options: ["Ev yemeği", "Restoran", "Piknik/dışarıda", "Sipariş söylerim evde"] },
  { text: "Sosyal medyayı nasıl kullanırsın?", category: "Dijital", options: ["Aktif paylaşırım", "Sadece takip ederim", "Nadir kullanırım", "Hiç açmam"] },
  { text: "Çocukken ne olmak istiyordun?", category: "Nostalji", options: ["Sporcu", "Sanatçı/Müzisyen", "Doktor/Öğretmen", "Pilot/Astronot"] },
  { text: "Nasıl bir insan olduğunu düşünürsün?", category: "Kişilik", options: ["İçe dönük", "Dışa dönük", "İkisi arası", "Duruma göre değişirim"] },
  { text: "Para biriktirirsen ne yaparsın?", category: "Para", options: ["Seyahat ederim", "Yatırım yaparım", "Bir şey satın alırım", "Acil duruma saklarım"] },
  { text: "Hangi süper güç isterdin?", category: "Hayal", options: ["Görünmezlik", "Uçmak", "Zaman durdurmak", "Zihin okumak"] },
  { text: "Yemek yemeyi mi yoksa pişirmeyi mi seversin?", category: "Yemek", options: ["Yemek yemeyi", "Pişirmeyi", "İkisini de", "İkisini de sevmem"] },
  { text: "Sabah kahvaltısında vazgeçilmezin nedir?", category: "Yemek", options: ["Çay", "Kahve", "Meyve suyu", "Su yeter"] },
  { text: "Bir partide nerede bulunursun?", category: "Sosyal", options: ["Herkesin odak noktasında", "Küçük gruplarla sohbette", "Yiyeceklerin yanında", "Erken eve giderim"] },
  { text: "Uyku düzenin nasıl?", category: "Yaşam", options: ["Erken yatar erken kalkarım", "Gece kuşuyum", "Düzensizim", "Fırsat buldukça uyurum"] },
  { text: "Bir şey öğrenmek istersen ne yaparsın?", category: "Kişilik", options: ["YouTube/Video izlerim", "Kitap/makale okurum", "Birine sorarım", "Yaparak öğrenirim"] },
  { text: "İdeal ev nasıl olur?", category: "Yaşam", options: ["Şehir merkezi daire", "Sakin semt ev", "Doğa içinde köy evi", "Deniz kenarı villa"] },
  { text: "Seyahat ederken ne yaparsın?", category: "Tatil", options: ["Her şeyi önceden planlarım", "Spontane giderim", "Rehber tutarım", "Yerel birini bulurum"] },
  { text: "İlk bakışta aşka inanır mısın?", category: "İlişki", options: ["Kesinlikle", "Hayır, zamanla olur", "Eskiden inanırdım", "Kısmen mümkün"] },
  { text: "Partnerinde aradığın en önemli özellik nedir?", category: "İlişki", options: ["Güven", "Mizah anlayışı", "Zeka", "Dürüstlük"] },
  { text: "Çocukluğundan en çok neyi özlüyorsun?", category: "Nostalji", options: ["Sokak oyunlarını", "Bayram sabahlarını", "Okula gitmeyi", "Sorumsuzluğu"] },
  { text: "Geçmişe gidebilseydin hangi yılı seçerdin?", category: "Hayal", options: ["90'lar", "80'ler", "2000'lerin başı", "Geleceğe giderdim"] },
  { text: "İlk okul öğretmeninin adını hatırlıyor musun?", category: "Anılar", options: ["Evet, asla unutmam", "Hayır, silinmiş", "Sadece soyadını", "Yüzünü hatırlarım"] },
  { text: "Bir ilişkide 'kırmızı çizgin' nedir?", category: "İlişki", options: ["Yalan", "İgisizlik", "Kıskançlık", "Saygısızlık"] },
  { text: "Hangi eski oyuncak senin favorindi?", category: "Nostalji", options: ["Lego", "Barbie/Aksiyon figürü", "Atari/Gameboy", "Top/Misket"] },
  { text: "En sevdiğin aile yemeği hangisidir?", category: "Anılar", options: ["Annemin köftesi", "Pazar kahvaltısı", "Bayram yemeği", "Dışarıda yenilen yemek"] },
  { text: "Kiminle bir günlüğüne yer değiştirmek isterdin?", category: "Hayal", options: ["Bir dünya lideri", "Bir sanatçı", "Partnerim/Eşim", "Evcil hayvanım"] },
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
  { text: "Türkiye'de en uzun kıyı şeridine sahip il hangisidir?", category: "Coğrafya", options: ["Muğla", "Antalya", "İzmir", "İstanbul"], correct: "Muğla" },
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

// ── ESKİ SERBEST METİN SORULAR (sosyal, şıksız) ───────────────────────────
const socialFreeText = [
  { text: "En sevdiğin kahvaltı ne?", category: "Yiyecek" },
  { text: "Hayatında bir kez yiyebileceksen ne yersin?", category: "Yiyecek" },
  { text: "En nefret ettiğin yemek hangisi?", category: "Yiyecek" },
  { text: "Gece yarısı acıksan ne yaparsın?", category: "Yiyecek" },
  { text: "Pizza üstüne ne koyarsın?", category: "Yiyecek" },
  { text: "En son bitirdiğin kitap neydi?", category: "Boş Zaman" },
  { text: "En büyük korkun nedir?", category: "Kişilik" },
  { text: "10 yıl sonra kendini nerede görüyorsun?", category: "Hayat" },
  { text: "Bir şeyi değiştirebilseydin ne değiştirirdin?", category: "Hayat" },
  { text: "Çocukluğundaki en güzel anın neydi?", category: "Anılar" },
  { text: "Hayatında aldığın en iyi karar neydi?", category: "Anılar" },
  { text: "En çok kimi özlüyorsun?", category: "Anılar" },
  { text: "Hayatındaki dönüm noktası neydi?", category: "Anılar" },
  { text: "Tarihin hangi döneminde yaşamak isterdin?", category: "Hayal" },
  { text: "Bir gün için kim olmak isterdin?", category: "Hayal" },
  { text: "Dünyayı değiştirebilseydin neyi değiştirirdin?", category: "Hayal" },
  { text: "Aşkta mı önce davranırsın?", category: "İlişki" },
  { text: "Bir ilişkide kırılma noktan ne olur?", category: "İlişki" },
  { text: "Sevdiğine nasıl sevgini gösterirsin?", category: "İlişki" },
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

  // Sosyal serbest metin sorular
  for (const q of socialFreeText) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "SOCIAL", isActive: true },
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

  const total = socialQuestions.length + socialFreeText.length + quizChild.length + quizAdult.length + quizWise.length;
  console.log(`✓ ${total} soru eklendi`);
}

main().catch(console.error).finally(() => db.$disconnect());
