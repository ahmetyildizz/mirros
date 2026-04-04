import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  await db.$executeRawUnsafe('TRUNCATE "Score","Guess","Answer","Round","Insight","Game" CASCADE');
  await db.$executeRawUnsafe('TRUNCATE "RoomParticipant","Room" CASCADE');
  await db.$executeRawUnsafe('TRUNCATE "Question" CASCADE');

  const social: Array<{ text: string; category: string; options?: string[] }> = [
    { text: "En sevdiğin mevsim hangisi?", category: "Kişilik", options: ["İlkbahar","Yaz","Sonbahar","Kış"] },
    { text: "Hafta sonunu nasıl geçirirsin?", category: "Yaşam", options: ["Evde dinlenirim","Dışarı çıkarım","Arkadaşlarla buluşurum","Bir şeyler keşfederim"] },
    { text: "Hangi tür müzik seni en çok etkiler?", category: "Müzik", options: ["Pop","Rock/Metal","Klasik/Jazz","Türk müziği"] },
    { text: "Hayal ettiğin tatil nasıl olur?", category: "Tatil", options: ["Deniz & güneş","Doğa & yürüyüş","Şehir & kültür","Evden çıkmam"] },
    { text: "Kendini bir hayvana benzetseydin ne olurdun?", category: "Kişilik", options: ["Aslan","Kedi","Köpek","Kartal"] },
    { text: "Sabahları nasıl uyanırsın?", category: "Yaşam", options: ["Zil çalmadan taze","Zil sesi gerekli","İlk alarma bakar uyurum","Zorla kalkabilirim"] },
    { text: "Sinirlenince ne yaparsın?", category: "Duygu", options: ["Sessiz kalırım","Konuşarak çözerim","Yürüyüşe çıkarım","Bir süre uzaklaşırım"] },
    { text: "En önemli değerin hangisi?", category: "Değerler", options: ["Dürüstlük","Sadakat","Özgürlük","Başarı"] },
    { text: "Bir hediye seçseydin ne isterdin?", category: "Eğlence", options: ["Deneyim (konser, seyahat)","Teknoloji","Kişisel bir şey","Sürpriz olsun"] },
    { text: "Arkadaşların seni nasıl tanımlar?", category: "Kişilik", options: ["Eğlenceli","Güvenilir","Yaratıcı","Sakin"] },
    { text: "Film seçerken önceliğin nedir?", category: "Eğlence", options: ["Komedi","Aksiyon/Macera","Dram/Romantik","Korku/Gerilim"] },
    { text: "Stresi nasıl atarsın?", category: "Yaşam", options: ["Spor yaparım","Müzik dinlerim","Uyurum","Arkadaşlarla vakit geçiririm"] },
    { text: "İdeal akşam yemeği nasıl olur?", category: "Yemek", options: ["Ev yemeği","Restoran","Piknik/dışarıda","Sipariş söylerim evde"] },
    { text: "Sosyal medyayı nasıl kullanırsın?", category: "Dijital", options: ["Aktif paylaşırım","Sadece takip ederim","Nadir kullanırım","Hiç açmam"] },
    { text: "Çocukken ne olmak istiyordun?", category: "Nostalji", options: ["Sporcu","Sanatçı/Müzisyen","Doktor/Öğretmen","Pilot/Astronot"] },
    { text: "Nasıl bir insan olduğunu düşünürsün?", category: "Kişilik", options: ["İçe dönük","Dışa dönük","İkisi arası","Duruma göre değişirim"] },
    { text: "Para biriktirirsen ne yaparsın?", category: "Para", options: ["Seyahat ederim","Yatırım yaparım","Bir şey satın alırım","Acil duruma saklarım"] },
    { text: "Hangi süper güç isterdin?", category: "Hayal", options: ["Görünmezlik","Uçmak","Zaman durdurmak","Zihin okumak"] },
    { text: "Yemek yemeyi mi pişirmeyi mi seversin?", category: "Yemek", options: ["Yemek yemeyi","Pişirmeyi","İkisini de","İkisini de sevmem"] },
    { text: "Sabah kahvaltısında vazgeçilmezin nedir?", category: "Yemek", options: ["Çay","Kahve","Meyve suyu","Su yeter"] },
    { text: "En sevdiğin kahvaltı ne?", category: "Yiyecek" },
    { text: "Gece yarısı acıksan ne yaparsın?", category: "Yiyecek" },
    { text: "En büyük korkun nedir?", category: "Kişilik" },
    { text: "10 yıl sonra kendini nerede görüyorsun?", category: "Hayat" },
    { text: "Çocukluğundaki en güzel anın neydi?", category: "Anılar" },
    { text: "Hayatındaki dönüm noktası neydi?", category: "Anılar" },
    { text: "Tarihin hangi döneminde yaşamak isterdin?", category: "Hayal" },
    { text: "Bir ilişkide kırılma noktan ne olur?", category: "İlişki" },
    { text: "Sevdiğine nasıl sevgini gösterirsin?", category: "İlişki" },
  ];
  for (const q of social) {
    await db.question.create({ data: { text: q.text, category: q.category, gameMode: "SOCIAL", options: q.options ?? null, isActive: true } });
  }

  const quizChild: Array<{ text: string; category: string; options: string[]; correct: string }> = [
    { text: "Türkiye'nin başkenti neresidir?", category: "Coğrafya", options: ["İstanbul","Ankara","İzmir","Bursa"], correct: "Ankara" },
    { text: "En büyük gezegen hangisidir?", category: "Fen", options: ["Satürn","Mars","Jüpiter","Neptün"], correct: "Jüpiter" },
    { text: "Bir haftada kaç gün vardır?", category: "Matematik", options: ["5","6","7","8"], correct: "7" },
    { text: "Hangi hayvan meee sesi çıkarır?", category: "Hayvanlar", options: ["İnek","Koyun","At","Tavuk"], correct: "Koyun" },
    { text: "Gökkuşağında kaç renk vardır?", category: "Fen", options: ["5","6","7","8"], correct: "7" },
    { text: "En büyük okyanus hangisidir?", category: "Coğrafya", options: ["Atlantik","Hint","Arktik","Pasifik"], correct: "Pasifik" },
    { text: "Kaç birincil renk vardır?", category: "Sanat", options: ["2","3","4","5"], correct: "3" },
    { text: "Güneş'e en yakın gezegen hangisi?", category: "Fen", options: ["Venüs","Mars","Merkür","Dünya"], correct: "Merkür" },
    { text: "Arının ürettiği tatlı madde nedir?", category: "Doğa", options: ["Süt","Bal","Şeker","Reçel"], correct: "Bal" },
    { text: "Sarı ile mavi karışırsa hangi renk olur?", category: "Sanat", options: ["Kırmızı","Mor","Yeşil","Turuncu"], correct: "Yeşil" },
    { text: "Dünyanın en uzun nehri hangisidir?", category: "Coğrafya", options: ["Amazon","Nil","Yangtze","Mississippi"], correct: "Nil" },
    { text: "En hızlı koşan hayvan hangisidir?", category: "Hayvanlar", options: ["Aslan","Çita","Leopar","Pars"], correct: "Çita" },
    { text: "12 × 12 = ?", category: "Matematik", options: ["124","132","144","154"], correct: "144" },
  ];
  for (const q of quizChild) {
    await db.question.create({ data: { text: q.text, category: q.category, gameMode: "QUIZ", ageGroup: "CHILD", options: q.options, correct: q.correct, isActive: true } });
  }

  const quizAdult: Array<{ text: string; category: string; options: string[]; correct: string }> = [
    { text: "Türkiye kaç ilden oluşur?", category: "Türkiye", options: ["71","79","81","83"], correct: "81" },
    { text: "Hangi ülke 2022 FIFA Dünya Kupasını kazandı?", category: "Spor", options: ["Fransa","Brezilya","Arjantin","Almanya"], correct: "Arjantin" },
    { text: "İstanbul'un fethinin yılı nedir?", category: "Tarih", options: ["1453","1299","1492","1071"], correct: "1453" },
    { text: "Au simgesi hangi elementi gösterir?", category: "Kimya", options: ["Gümüş","Alüminyum","Altın","Arsenik"], correct: "Altın" },
    { text: "En çok konuşulan dil hangisidir?", category: "Dünya", options: ["İngilizce","İspanyolca","Mandarin","Arapça"], correct: "Mandarin" },
    { text: "Mona Lisa'yı kim yaptı?", category: "Sanat", options: ["Michelangelo","Raphael","Leonardo da Vinci","Picasso"], correct: "Leonardo da Vinci" },
    { text: "Işığın hızı yaklaşık kaçtır?", category: "Fizik", options: ["200.000 km/s","300.000 km/s","150.000 km/s","400.000 km/s"], correct: "300.000 km/s" },
    { text: "Nobel Barış Ödülü hangi şehirde verilir?", category: "Dünya", options: ["Stockholm","Oslo","Kopenhag","Helsinki"], correct: "Oslo" },
    { text: "İnsülini hangi organ üretir?", category: "Biyoloji", options: ["Karaciğer","Böbrek","Pankreas","Dalak"], correct: "Pankreas" },
    { text: "Hamlet'i kim yazdı?", category: "Edebiyat", options: ["Cervantes","Molière","Shakespeare","Dante"], correct: "Shakespeare" },
    { text: "Eiffel Kulesi hangi ülkededir?", category: "Coğrafya", options: ["İtalya","Belçika","Fransa","Almanya"], correct: "Fransa" },
    { text: "Osmanlı Devleti hangi yıl kuruldu?", category: "Tarih", options: ["1071","1176","1243","1299"], correct: "1299" },
    { text: "İnsan vücudunda kaç kemik bulunur?", category: "Biyoloji", options: ["186","206","226","246"], correct: "206" },
  ];
  for (const q of quizAdult) {
    await db.question.create({ data: { text: q.text, category: q.category, gameMode: "QUIZ", ageGroup: "ADULT", options: q.options, correct: q.correct, difficulty: "MEDIUM", isActive: true } });
  }

  const quizWise: Array<{ text: string; category: string; options: string[]; correct: string }> = [
    { text: "Güneş sisteminin merkezini kim öne sürdü?", category: "Astronomi", options: ["Ptolemy","Kopernik","Galileo","Kepler"], correct: "Kopernik" },
    { text: "Sokrates'in öğrencisi kimdi?", category: "Felsefe", options: ["Aristoteles","Platon","Epiktetos","Zenon"], correct: "Platon" },
    { text: "Rönesans nerede başladı?", category: "Tarih", options: ["Fransa","İtalya","Almanya","İspanya"], correct: "İtalya" },
    { text: "Kuantum mekaniğinin kurucularından biri kimdir?", category: "Fizik", options: ["Newton","Einstein","Max Planck","Watt"], correct: "Max Planck" },
    { text: "Yıldızlı Gece kimin eseridir?", category: "Sanat", options: ["Monet","Picasso","Van Gogh","Gauguin"], correct: "Van Gogh" },
    { text: "İnsan genomunda yaklaşık kaç gen bulunur?", category: "Biyoloji", options: ["5.000","10.000","20.000","50.000"], correct: "20.000" },
    { text: "Bitkiler fotosentezde hangi gazı absorbe eder?", category: "Fen", options: ["Oksijen","Azot","Karbondioksit","Hidrojen"], correct: "Karbondioksit" },
    { text: "Roma'yı yaktığı iddia edilen imparator kimdir?", category: "Tarih", options: ["Caligula","Commodus","Nero","Tiberius"], correct: "Nero" },
    { text: "E=mc²'de c neyi temsil eder?", category: "Fizik", options: ["Kütle","Enerji","Işık hızı","İvme"], correct: "Işık hızı" },
    { text: "Boyle-Mariotte kanunu neyi açıklar?", category: "Kimya", options: ["Isı-hacim","Basınç-hacim","Basınç-sıcaklık","Kütle-enerji"], correct: "Basınç-hacim" },
    { text: "Magna Carta hangi ülkede imzalandı?", category: "Tarih", options: ["Fransa","İngiltere","Hollanda","Almanya"], correct: "İngiltere" },
    { text: "DNA çift sarmalı kim keşfetti?", category: "Biyoloji", options: ["Mendel & Darwin","Watson & Crick","Pasteur & Koch","Curie & Bohr"], correct: "Watson & Crick" },
  ];
  for (const q of quizWise) {
    await db.question.create({ data: { text: q.text, category: q.category, gameMode: "QUIZ", ageGroup: "WISE", options: q.options, correct: q.correct, difficulty: "HARD", isActive: true } });
  }

  const count = await db.question.count();
  return NextResponse.json({ ok: true, count });
}
