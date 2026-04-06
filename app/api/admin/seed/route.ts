import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  /*
  const secret         = req.headers.get("x-seed-secret");
  const expectedSecret = process.env.SEED_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  */

  await db.$executeRawUnsafe('TRUNCATE "Score","Guess","Answer","Round","Insight","Game" CASCADE');
  await db.$executeRawUnsafe('TRUNCATE "RoomParticipant","Room" CASCADE');
  await db.$executeRawUnsafe('TRUNCATE "Question" CASCADE');

  // ─── SOSYAL SORULAR ──────────────────────────────────────────────────────────
  // Kişiyi tanımaya yönelik, komik, grup ortamı için
  const social: Array<{ text: string; category: string; options?: string[]; penalty?: string; ageGroup?: string }> = [
    {
      text: "Gecenin 3'ünde uyandırsan bile yiyebileceğin şey nedir?",
      category: "Yemek",
// ... (omitted for brevity, will replace the whole block)
      ageGroup: "ADULT",
      options: ["Lahmacun", "Çikolata", "Çorba", "Pizza"],
      penalty: "Yanlış tahmin edenler masadan kalkıp komik dans etmeli 🕺",
    },
    {
      text: "En büyük kahramanın kim?",
      category: "Hayal",
      ageGroup: "CHILD",
      options: ["Örümcek Adam", "Annem/Babam", "Öğretmenim", "Elsa"],
      penalty: "Yanlış bilenler 10 saniye boyunca bir süper kahraman gibi uçmaya çalışmalı 🦸",
    },
    {
      text: "Emeklilikte en çok ne yapmayı hayal ediyorsun?",
      category: "Gelecek",
      ageGroup: "WISE",
      options: ["Bahçeyle uğraşmak", "Dünyayı gezmek", "Torun bakmak", "Sadece uyumak"],
      penalty: "Yanlış bilenler emeklilikte yapacakları hobiyi 15 saniye sessiz sinema gibi anlatmalı 👵",
    },
    {
      text: "En son ne zaman yalan söyledin ve neden?",
      category: "İtiraf",
      ageGroup: "ADULT",
      options: ["Bugün — küçük bir şeydi", "Bu hafta — zorunluydum", "Geçen ay", "Ben hiç yalan söylemem 😇"],
      penalty: "Yanlış bilenler gruba gerçek bir itiraf yapmalı 🤫",
    },
    {
      text: "En sevdiğin çizgi film hangisi?",
      category: "Eğlence",
      ageGroup: "CHILD",
      options: ["Pepee", "Kral Şakir", "Tom ve Jerry", "Niloya"],
      penalty: "Yanlış bilenler o çizgi filmdeki bir karakterin sesini çıkarmalı 🐱",
    },
    {
      text: "Gençliğinde en çok hangi sanatçıya hayrandın?",
      category: "Geçmiş",
      ageGroup: "WISE",
      options: ["Zeki Müren", "Barış Manço", "Ajda Pekkan", "Müslüm Gürses"],
      penalty: "Yanlış tahmin edenler o sanatçının bir şarkısını 10 saniye mırıldanmalı 🎤",
    },
    {
      text: "Sinirlenince ne yaparsın?",
      category: "Duygu",
      options: ["Sessizliğe çekilirim", "Bağırıp çağırırım", "Ağlarım", "Abur cubur yerim 🍟"],
      penalty: "Yanlış tahmin eden kişi 15 saniye sinirli birini canlandırmalı 😤",
    },
    {
      text: "Çocukken ne olmak istiyordun?",
      category: "Geçmiş",
      options: ["Astronot", "Futbolcu", "Şarkıcı", "Doktor"],
      penalty: "Yanlış bilen kişi o mesleği 20 saniye oynayarak göstermeli 🎭",
    },
    {
      text: "Telefon şarjın %5 kaldı, şarj aleti yok. Tepkin ne olur?",
      category: "Teknoloji",
      options: ["Panik atak geçiririm 😱", "Sakin kalırım", "Herkese 'şarjın var mı?' diye sorarım", "Fark etmez, kullanmıyordum zaten"],
      penalty: "Yanlış bilenler şarjsız kalıyormuş gibi 10 saniye dramatik davranmalı",
    },
    {
      text: "Arkadaşların seni hangi kelimeyle tanımlar?",
      category: "Kişilik",
      options: ["Eğlenceli", "Sakin", "Kaotik", "Güvenilir"],
      penalty: "Yanlış tahmin eden kişi gruptakilerden o kelimeyi neden hak etmediğini savunmalarını istemeli 😂",
    },
    {
      text: "Düğünde kaçıncı ağlayan olursun?",
      category: "Eğlence",
      options: ["İlk ağlayan — müzik başlar başlamaz", "Ortada bir yerde", "Son dakikada dayanamam", "Ben hiç ağlamam 🧊"],
      penalty: "Yanlış bilen kişi şu an mutlu ağlıyor gibi yapmalı 😭",
    },
    {
      text: "Yabancıyla asansörde sıkışsan ne yaparsın?",
      category: "Sosyal",
      options: ["Susar beklerim", "Hava durumundan bahsederim ☁️", "Telefona dalın", "Anında arkadaş olurum"],
      penalty: "Yanlış bilenler gruba yabancıymış gibi tanışma konuşması başlatmalı 👋",
    },
    {
      text: "Rezil olduğun anı bize anlatsaydın…",
      category: "İtiraf",
      options: ["Toplum içinde düştüm", "Yanlış kişiye mesaj attım", "Adımı unuttum 😅", "Fiyatı sormadan aldım"],
      penalty: "En yakın yanlış tahmin eden utandırıcı bir anısını kısaca anlatmalı 🙈",
    },
    {
      text: "Sabah uyandığında önce ne yaparsın?",
      category: "Rutin",
      options: ["Telefona dalarım 📱", "Tuvalete koşarım 🚽", "Gerinip uzanırım 🦥", "Hemen kalkıp kahve yaparım"],
      penalty: "Yanlış bilenler sabah rutinlerini dans ederek göstermeli ☀️",
    },
    {
      text: "İçindeki çocuğu en çok ne çıkarıyor?",
      category: "Eğlence",
      options: ["Çizgi film 🎬", "Oyun parkı 🎡", "Balon patlatmak 🎈", "Şeker yemek 🍬"],
      penalty: "Yanlış tahmin eden kişi 20 saniye çocuk gibi davranmalı 👶",
    },
    {
      text: "Misafir gelince evin hangi yerini gizlersin?",
      category: "Ev",
      options: ["Yatakodası 🛏️", "Mutfak tezgahı 🍳", "Banyo 🚿", "Her şeyi temizlerim zaten ✨"],
      penalty: "Yanlış bilenler evlerindeki en pis köşeyi itiraf etmeli 🗑️",
    },
    {
      text: "Bir hafta tek başına ıssız adada kalsan ne yaparsın?",
      category: "Hayal",
      options: ["Günlük tutarım 📓", "Balık tutup yaşam kurarım 🎣", "İlk gün çıldırırım 😵", "Harika, sonunda dinlenirim 😎"],
      penalty: "Yanlış tahmin eden kişi 15 saniye adada hayatta kalmak zorundaymış gibi davranmalı 🏝️",
    },
    {
      text: "Seni en çok kim kızdırır?",
      category: "İlişki",
      options: ["Ailemi 👨‍👩‍👧", "En iyi arkadaşım 👯", "Tanımadığım biri 🤷", "Ben kendimi 😅"],
      penalty: "Yanlış bilen kişi o kişiyi taklit etmeli (sadece taklide izin var, isim söyleme!) 😂",
    },
    {
      text: "Hayatındaki en büyük alışkanlığın ne?",
      category: "Alışkanlık",
      options: ["Yatmadan önce telefon 📱", "Abur cubur 🍿", "Ertelemek ⏰", "Fazla çay/kahve ☕"],
      penalty: "Yanlış bilenler o alışkanlığı 20 saniye canlandırmalı 🎭",
    },
    {
      text: "Sınavdan önce ne yaparsın?",
      category: "Geçmiş",
      options: ["Son gece çalışırım 📚", "Herkesten özet isterim", "Dua ederim 🙏", "Kader ne derse o 🤷"],
      penalty: "Yanlış tahmin eden kişi sınava girecekmiş gibi paniklemeli 😱",
    },
    {
      text: "Evde yalnız kaldığında ses çıkarır mısın?",
      category: "Gizli Hayat",
      options: ["Söylerim 🎤", "Konuşurum — kendimle 🗣️", "Film replikleri tekrarlarım", "Sus pus oturur beklerim 🤐"],
      penalty: "Yanlış bilenler şu an seslerinden bir şey canlandırmalı 🎵",
    },
    {
      text: "Bir süper güç seçseydin ne isterdin?",
      category: "Hayal",
      options: ["Uçmak 🦅", "Görünmezlik 👻", "Zihin okumak 🧠", "Sonsuz para 💰"],
      penalty: "Yanlış tahmin eden kişi o süper güce sahipmiş gibi 15 saniye davranmalı 🦸",
    },
    {
      text: "En kötü hediye aldığında ne yaparsın?",
      category: "Sosyal",
      options: ["Gülümseyip teşekkür ederim 😬", "Satar ya da verirdim", "Saklarım çekmecede 📦", "Dürüstçe söylerim"],
      penalty: "Yanlış bilenler aldıkları en saçma hediyeyi anlatmalı 🎁",
    },
    {
      text: "Hangi durumda yalan söylemek kabul edilebilir?",
      category: "Değerler",
      options: ["Kişiyi korumak için 🛡️", "Sürprizi saklamak için 🎉", "Küçük nezaket yalanları", "Asla 🚫"],
      penalty: "Yanlış tahmin edenler şu an bir yalan uydurup gruba anlatmalı (gruba da söyle gerçek değil) 😅",
    },
    {
      text: "Arkadaşlarınla tartışma çıkınca ne yaparsın?",
      category: "İlişki",
      options: ["Uzlaşı ararım 🤝", "Sessizliğe geçerim 🤐", "Direkt söylerim 🗣️", "Espriyle geçiştiririm 😄"],
      penalty: "Yanlış bilenler 20 saniyeliğine kavga ediyormuş gibi dramatik bir canlandırma yapmalı",
    },
    {
      text: "Para birikince ilk ne yaparsın?",
      category: "Para",
      options: ["Seyahat ederim ✈️", "Güzel bir şey yerim 🍜", "Yatırıma koşarım 📊", "Harcamamaya çalışırım ama...", ],
      penalty: "Yanlış tahmin eden kişi o anı yaşıyormuş gibi sevinç gösterisi yapmalı 🎉",
    },
    {
      text: "Bugüne kadar yaptığın en cesur şey ne?",
      category: "Macera",
      options: ["Bungee/paraşüt", "Birini beğendiğimi söyledim", "İşten ayrıldım/okul bıraktım", "Hiçbir şey — korkaklığım koruyucu 😅"],
      penalty: "Yanlış bilenler sahte cesur bir an canlandırmalı 💪",
    },
    {
      text: "Hayatında en çok ne zaman güldün?",
      category: "Anı",
      options: ["Arkadaşlarla komik bir anda", "İzlerken (film/video)", "Yanlışlıkla utandım ve güldüm", "Dün"],
      penalty: "Yanlış tahmin eden kişi o güldüğü anı mimikle dramatik şekilde göstermeli 😂",
    },
    {
      text: "Karanlıkta tek başına ev — tepkin ne olur?",
      category: "Korku",
      options: ["Tüm ışıkları açarım 💡", "Fark etmez, alıştım", "Telefon fenerini açarım 🔦", "Salona çıkmam dahi 🙈"],
      penalty: "Yanlış bilenler 10 saniye korku filmindeki kahraman gibi davranmalı 👻",
    },
    {
      text: "Favori kaçış yerin neresi?",
      category: "Huzur",
      options: ["Yatağım 🛏️", "Banyo 🚿", "Mutfak 🍳", "Dışarı çıkarım 🌳"],
      penalty: "Yanlış tahmin eden kişi o mekanı canlandırarak gruba göstermeli 🏡",
    },
    {
      text: "Seni en iyi tanıyan kişiye göre zayıf noktanız ne?",
      category: "Kişilik",
      options: ["Sinirlenince sabırsızlanırım", "Çok duygusal olurum", "Kararsızlık benim kadenim", "Her şeyi ertelerim"],
      penalty: "Yanlış bilenler o zayıf noktayı abartılı şekilde sergilemeli 😩",
    },
    {
      text: "Doğum günün için sürpriz yapılsa tepkin ne olur?",
      category: "Sosyal",
      options: ["Çok mutlu olurum 🥹", "Utanırım ama sevinirim", "Siniririm — sürpriz sevmem 😤", "Ağlarım kesinlikle 😭"],
      penalty: "Yanlış tahmin edenler şu an sürpriz görmüş gibi tepki vermeliler 🎉",
    },
    {
      text: "Trafikte veya kalabalıkta nasıl birsin?",
      category: "Stres",
      options: ["Bağırıp çağırırım 📢", "Sakin kalırım 🧘", "Müzik açar geçiştiririm 🎧", "Yolu değiştiririm"],
      penalty: "Yanlış bilenler trafikte sıkışmış gibi 15 saniye davranmalı 🚗",
    },
    {
      text: "En utanç verici an hangisi?",
      category: "İtiraf",
      options: ["Topluluk içinde tökezledim", "Yanlış kişiye mesaj attım", "Adresimi yanlış söyledim", "Mikrofon açık kaldı 🎤"],
      penalty: "Yanlış tahmin eden kişi kısa ve komik bir utanç anısını anlatmalı 🙈",
    },
    {
      text: "Birini beğenince ilk ne yaparsın?",
      category: "İlişki",
      options: ["Sosyal medyasını incelerim 🔍", "Direkt söylerim", "İpuçları bırakırım 💌", "Bekle görürüz der geçerim"],
      penalty: "Yanlış bilenler gruba sahte bir aşk itirafı yapmalı 💕",
    },
    {
      text: "Şu an evin hangi odası senin halin?",
      category: "Ev",
      options: ["Yatak odası — huzur 🛌", "Mutfak — yiyorum hep 🍽️", "Salon — merkez 📺", "Banyo — düşünce mekanim 🚿"],
      penalty: "Yanlış tahmin eden kişi o odayı canlandırarak gruba göstermeli 🏠",
    },
    {
      text: "Hangi konuda fazla bilgi verir uzman gibi davranırsın?",
      category: "Eğlence",
      options: ["Yemek tarifleri 🍳", "Film/dizi önerileri 🎬", "Sağlık tavsiyeleri 💊", "Hayat felsefesi 🧠"],
      penalty: "Yanlış bilenler o konuda uzmanmış gibi 20 saniye ders vermeli 👨‍🏫",
    },
    {
      text: "Çok sıkılınca ne yaparsın?",
      category: "Rutin",
      options: ["Telefona dalarım 📱", "Uyurum 😴", "Yemek yerim 🍕", "Bir şeyler temizlerim (çaresizlik)"],
      penalty: "Yanlış tahmin eden kişi şu an can sıkıntısından o şeyi yapıyor gibi canlandırmalı",
    },
    {
      text: "Çok yorulunca nasıl biri olursun?",
      category: "Duygu",
      options: ["Her şeye gülerim 😂", "Ağlarım 😭", "Sinirli bir hal alırım 😤", "Sustum mu biter"],
      penalty: "Yanlış bilenler aşırı yorgun hallerini gruba göstermeli 🥱",
    },
    {
      text: "Tatile gitmeden önce ne yaparsın?",
      category: "Tatil",
      options: ["Her şeyi planlıyorum 📋", "Bavulu son gece hazırlarım", "Bavulu uçuşa girerken 😅", "Hazırlık yok, akışa bırak"],
      penalty: "Yanlış tahmin eden kişi tatile gidecekmiş gibi heyecanını gruba göstermeli ✈️",
    },
    {
      text: "Kaybetmeyi kaldırabilir misin?",
      category: "Kişilik",
      options: ["Kesinlikle hayır, berbat olurum 😤", "Zor ama kaldırırım", "İyi hissettiririm kendim 🧘", "Önemli değil, oyun oyun"],
      penalty: "Yanlış bilenler bir yarışmayı kaybeden kişiyi abartılı canlandırmalı 🏆",
    },
    {
      text: "Uyku saati gelince ne yaparsın?",
      category: "Rutin",
      options: ["Hemen yatarım, 5dk uyku", "Telefona dalarım saatler geçer", "Hâlâ aç mıyım diye mutfağa giderim", "Müzik açar düşüncelere dalarım"],
      penalty: "Yanlış tahmin eden kişi yatmaya hazırlanıyor gibi 20 saniye canlandırmalı 🌙",
    },
    {
      text: "Gruptan biri ağlarsa ne yaparsın?",
      category: "Empati",
      options: ["Hemen kucaklaşma 🤗", "Ne yapacağımı bilirim", "Donup kalırım 🥲", "Ben de ağlarım"],
      penalty: "Yanlış bilenler birini teselli ediyor gibi dramatik sahne oynamalı 🎭",
    },
    {
      text: "Uzun yolculuklarda nasıl geçirirsin?",
      category: "Seyahat",
      options: ["Uyurum 💤", "Müzik/podcast 🎧", "Pencereden bakarım 🪟", "Arabaya sığmadım dedim diyemem"],
      penalty: "Yanlış tahmin eden kişi arabadasın, sıkılmışsın, 15 saniye canlandır 🚗",
    },
    {
      text: "En çok hangi tip insanla anlaşırsın?",
      category: "İlişki",
      options: ["Komik ve rahat", "Ciddi ama güvenilir", "Maceraperest", "Sakin ve anlayışlı"],
      penalty: "Yanlış bilenler o tip insanı 20 saniye canlandırmalı 👥",
    },
    {
      text: "Başkasının yemeğini çalmak ne zaman kabul edilebilir?",
      category: "Yemek",
      options: ["Hiçbir zaman! 😤", "Çok yakın biriysek tamam", "Bir lokma fark etmez 😏", "Her zaman — mülkiyet ortak"],
      penalty: "Yanlış tahmin eden kişi yemek çalarken yakalanmış gibi canlandırmalı 🍟",
    },
  ];

  for (const q of social) {
    await db.question.create({
      data: {
        text: q.text,
        category: q.category,
        gameMode: "SOCIAL",
        options: q.options ?? undefined,
        penalty: q.penalty ?? undefined,
        ageGroup: q.ageGroup as any ?? undefined,
        isActive: true,
      },
    });
  }

  // ─── QUIZ — ÇOCUK ────────────────────────────────────────────────────────────
  // Eğlenceli, basit, güldürücü
  const quizChild: Array<{ text: string; category: string; options: string[]; correct: string; penalty?: string }> = [
    { text: "Pinokyo yalan söylediğinde ne olur?", category: "Çizgi", options: ["Burnu uzar", "Rengi değişir", "Küçülür", "Uçar"], correct: "Burnu uzar", penalty: "Yanlış bilenler Pinokyo gibi 10 saniye yalan söyler gibi yapmalı 🤥" },
    { text: "Hangi hayvan havlamaz ama uçar?", category: "Hayvanlar", options: ["Yarasa", "Köpekbalığı", "Timsah", "Fil"], correct: "Yarasa", penalty: "Yanlış tahmin eden kişi 10 saniye havlayan yarasa gibi ses çıkarmalı 🦇" },
    { text: "Renkler: sarı + kırmızı = ?", category: "Renk", options: ["Turuncu", "Mor", "Yeşil", "Pembe"], correct: "Turuncu", penalty: "Yanlış bilen kişi turuncu bir nesneyi 10 saniyede odadan bulmalı 🍊" },
    { text: "Bir haftada kaç gün var?", category: "Matematik", options: ["7", "6", "8", "5"], correct: "7", penalty: "Yanlış tahmin eden kişi 7 kez zıplamalı 🤸" },
    { text: "Hangi hayvan kendini yumuşatarak yere çakılmaz?", category: "Hayvanlar", options: ["Kedi 🐱", "Köpek", "Tavşan", "Hamster"], correct: "Kedi 🐱", penalty: "Yanlış bilenler kedi gibi 15 saniye yürümeli 🐾" },
    { text: "Noel Baba armağanları hangi geceden önce bırakır?", category: "Kültür", options: ["24 Aralık gecesi", "31 Aralık gecesi", "1 Ocak sabahı", "25 Aralık öğleden sonra"], correct: "24 Aralık gecesi", penalty: "Yanlış bilenler Noel Baba gibi derin bir 'HO HO HO!' çekmalı 🎅" },
    { text: "Superman'in zayıflığı nedir?", category: "Süper Kahraman", options: ["Kriptonit", "Soğuk", "Ateş", "Demir"], correct: "Kriptonit", penalty: "Yanlış tahmin eden kişi süper kahramandan zayıf düşüyor gibi 10 saniye dramatik sahneler yapmalı 🦸" },
    { text: "Gökkuşağında kaç renk var?", category: "Doğa", options: ["7", "5", "6", "8"], correct: "7", penalty: "Yanlış bilen kişi ellerini gökyüzüne doğru tutarak gökkuşağı gibi durmalı 🌈" },
    { text: "Hangi sebze ağlatır?", category: "Yemek", options: ["Soğan 🧅", "Havuç", "Patates", "Biber"], correct: "Soğan 🧅", penalty: "Yanlış bilenler soğan kesiyormuş gibi ağlıyor gibi yapmalı 😭" },
    { text: "Köpekler hangi rengi görmez?", category: "Hayvanlar", options: ["Kırmızı-yeşil arası net değil", "Mavi", "Sarı", "Siyah"], correct: "Kırmızı-yeşil arası net değil", penalty: "Yanlış tahmin eden köpek gibi 15 saniye her şeyi koklayarak aramalı 🐕" },
    { text: "Hangi balık uçabilir?", category: "Deniz", options: ["Uçan balık", "Palyaço balığı", "Köpekbalığı", "Balina (değil balık ama)"], correct: "Uçan balık", penalty: "Yanlış bilenler uçan balık gibi 10 saniye kollarını kanat gibi açarak koşmalı 🐟" },
    { text: "Karanlıkta parlayan şey nedir?", category: "Doğa", options: ["Ateşböceği", "Arı", "Kelebek", "Güve"], correct: "Ateşböceği", penalty: "Yanlış tahmin eden kişi 15 saniye karanlıkta ateşböceği gibi yanıp sönüyor gibi yapmalı 🐛" },
    { text: "Hangi hayvan geriye doğru yürüyebilir?", category: "Hayvanlar", options: ["Yengeç 🦀", "Fil", "Zürafa", "Penguen"], correct: "Yengeç 🦀", penalty: "Yanlış bilenler yengeç gibi 10 saniye yan yan yürümeli 🦀" },
  ];

  for (const q of quizChild) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "QUIZ", ageGroup: "CHILD", options: q.options, correct: q.correct, penalty: q.penalty ?? null, isActive: true },
    });
  }

  // ─── QUIZ — GENÇ/YETİŞKİN ────────────────────────────────────────────────────
  const quizAdult: Array<{ text: string; category: string; options: string[]; correct: string; penalty?: string }> = [
    { text: "Hangisi 'binge-watch' yaparken söylenmez?", category: "Dizi Kültürü", options: ["'Sadece bir bölüm daha'", "'Bu gece erken yatacağım'", "'Ne izlesem bilmiyorum'", "'Bitirdim, hayatım boşaldı'"], correct: "'Bu gece erken yatacağım'", penalty: "Yanlış bilenler dizi izlerken sarıldıkları yastığı tasvir eden bir konuşma yapmalı 📺" },
    { text: "Türkiye'nin sosyal medya kullanımında hangi platform lider?", category: "Dijital", options: ["Instagram", "TikTok", "Twitter/X", "LinkedIn"], correct: "Instagram", penalty: "Yanlış tahmin eden kişi Instagram reels çekiyormuş gibi 15 saniye poz verip dans etmeli 📸" },
    { text: "Hangi ülke çay tüketiminde dünyada birinci?", category: "Kültür", options: ["Türkiye", "İngiltere", "Çin", "Hindistan"], correct: "Türkiye", penalty: "Yanlış bilenler çay içerken çay sohbeti yapıyor gibi gruba 20 saniyelik performans sergilemeli ☕" },
    { text: "Friends dizisinde Monica'nın en büyük tutkusu neydi?", category: "Dizi", options: ["Yemek yapmak 🍳", "Dans etmek", "Şarkı söylemek", "Temizlik"], correct: "Yemek yapmak 🍳", penalty: "Yanlış tahmin eden kişi Monica gibi obsesif temizleyici taklidi yapmalı 🧹" },
    { text: "Hangisi sosyal kaygının belirtisi DEĞİLDİR?", category: "Psikoloji", options: ["Harika bir konuşmacı olmak", "Kalabalıktan kaçınmak", "Çok terlemek", "Konuşma öncesi paniklemek"], correct: "Harika bir konuşmacı olmak", penalty: "Yanlış bilenler sosyal kaygısı olan biri gibi gruba 10 saniyelik tanışma konuşması yapmalı 😰" },
    { text: "En çok stres veren aktivite hangisi?", category: "Psikoloji", options: ["Konuşma yapmak 🎤", "Diş hekimine gitmek", "Vergi beyannamesi", "Tatile gitmek 🏖️"], correct: "Konuşma yapmak 🎤", penalty: "Yanlış tahmin eden kişi mikrofon önünde konuşuyormuş gibi 20 saniye gruba sunum yapmalı 🎤" },
    { text: "Hangisi Türk mutfağına ait değil?", category: "Yemek", options: ["Sushi 🍱", "Çiğköfte", "İskender", "Baklava"], correct: "Sushi 🍱", penalty: "Yanlış bilenler sushi yermiş gibi çubukla yemek yiyormuş gibi 15 saniye canlandırmalı 🥢" },
    { text: "Zodiac'a inanmak ne kadar yaygın?", category: "Kültür", options: ["Çoğunluk eğlence için takip eder", "Kimse inanmaz", "Herkes ciddi alır", "Sadece kadınlar"], correct: "Çoğunluk eğlence için takip eder", penalty: "Yanlış tahmin eden kişi burç yorumu yapıyor gibi gruba ciddi ciddi kehanet sunmalı ⭐" },
    { text: "Doğum günü pastasındaki mumları üflerken ne düşünürsün?", category: "Gelenek", options: ["Dilek tutarım 🙏", "'Kaç yaşındayım ya' diye şaşırırım", "'Ateş korkuyor muyum?' diye merak ederim", "Hiçbir şey — sadece üflerim"], correct: "Dilek tutarım 🙏", penalty: "Yanlış bilenler mum üflüyor gibi yaparak 3 saniyelik bir dilek tutmalı (sesli!) 🎂" },
    { text: "Hangisi 'red flag' değildir?", category: "İlişki", options: ["Hayvanları sevmek 🐾", "Sabah hiç konuşmamak", "Seninle sürekli tartışmak", "Seni görmezden gelmek"], correct: "Hayvanları sevmek 🐾", penalty: "Yanlış tahmin eden kişi kırmızı bayrak olan davranışı 15 saniye canlandırmalı 🚩" },
    { text: "Sosyal medyada 'ghostlamak' ne demek?", category: "Dijital", options: ["Cevap vermeden kaybolmak 👻", "Hesabı silmek", "Tüm fotoğrafları gizlemek", "Çok fazla paylaşım yapmak"], correct: "Cevap vermeden kaybolmak 👻", penalty: "Yanlış bilenler ghost gibi sessizce sandalyelerinden kalkıp geri gelmeleri 👻" },
    { text: "Türkiye'de kaç il var?", category: "Türkiye", options: ["81", "79", "83", "75"], correct: "81", penalty: "Yanlış tahmin eden kişi bir il adı sayarken 5'te durup gruba baktırmak zorunda 🗺️" },
    { text: "'YOLO' ne anlama gelir?", category: "İngilizce", options: ["You Only Live Once", "You Only Laugh Once", "Yesterday Only Looks Old", "Yes Or Leave Option"], correct: "You Only Live Once", penalty: "Yanlış bilenler YOLO felsefesiyle bir karar vermeli ve gruba ilan etmeli 🎉" },
  ];

  for (const q of quizAdult) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "QUIZ", ageGroup: "ADULT", options: q.options, correct: q.correct, difficulty: "MEDIUM", penalty: q.penalty ?? null, isActive: true },
    });
  }

  // ─── QUIZ — BİLGE ────────────────────────────────────────────────────────────
  const quizWise: Array<{ text: string; category: string; options: string[]; correct: string; penalty?: string }> = [
    { text: "Sigmund Freud'a göre insan kişiliğinin en temel dürtüsü nedir?", category: "Psikoloji", options: ["Cinsellik ve hayatta kalma (Eros/Thanatos)", "Para kazanma", "Toplumsal kabul", "Bilgi edinme"], correct: "Cinsellik ve hayatta kalma (Eros/Thanatos)", penalty: "Yanlış bilenler Freud taklidi yaparak komik bir analiz sunmalı 🛋️" },
    { text: "Hangi felsefe akımına göre 'varoluş özden önce gelir'?", category: "Felsefe", options: ["Varoluşçuluk", "Nihilizm", "Hedonizm", "Stoacılık"], correct: "Varoluşçuluk", penalty: "Yanlış tahmin eden kişi varoluşunu sorgulayan 20 saniyelik bir iç monolog okumalı 🧐" },
    { text: "Dunning-Kruger etkisi ne açıklar?", category: "Psikoloji", options: ["Yetersiz kişilerin kendini abartması", "Zeki kişilerin depresyona girmesi", "Grupların kötü karar alması", "Hafıza yanılmaları"], correct: "Yetersiz kişilerin kendini abartması", penalty: "Yanlış bilenler hiç bilmedikleri bir konuda uzmanmış gibi 20 saniye konuşmalı 🤓" },
    { text: "Osmanlı'da 'millet sistemi' neyi ifade eder?", category: "Tarih", options: ["Din bazlı topluluk özerkliği", "Askeri sınıf düzeni", "Vergi toplama sistemi", "Eğitim yapısı"], correct: "Din bazlı topluluk özerkliği", penalty: "Yanlış tahmin eden kişi Osmanlı paşası taklidi yaparak gruba 20 saniyelik ferman okumalı 📜" },
    { text: "Nietzsche'nin 'Tanrı öldü' derken kastettiği nedir?", category: "Felsefe", options: ["Dini değerlerin merkezi otoritesini yitirmesi", "Tanrı'nın gerçekten olmadığı", "Kilise güç kaybetti", "Ölüm felsefesi"], correct: "Dini değerlerin merkezi otoritesini yitirmesi", penalty: "Yanlış bilenler Nietzsche bıyığıyla (gerçek ya da hayali) ciddi bir kelam söylemeli 👨‍🦱" },
    { text: "Ekonomide 'enflasyon paradoksu' hangisidir?", category: "Ekonomi", options: ["Düşük enflasyon da büyümeye zarar verebilir", "Enflasyon sadece fakirleri etkiler", "Enflasyon durdurulamaz", "Zenginler enflasyondan kazanır"], correct: "Düşük enflasyon da büyümeye zarar verebilir", penalty: "Yanlış tahmin eden kişi merkez bankası başkanı gibi gruba açıklama yapmalı 🏦" },
    { text: "Hawking radyasyonu hangi fizik olgusunu açıklar?", category: "Fizik", options: ["Kara deliklerin yavaşça enerji yayması", "Güneş fırtınaları", "Kuantum tünellemesi", "Karanlık madde salınımı"], correct: "Kara deliklerin yavaşça enerji yayması", penalty: "Yanlış bilenler Hawking'i taklit ederek kara delik hakkında gruba 15 saniyelik ders vermeliler 🌌" },
    { text: "Machiavelli'nin 'Prens' eserinde savunduğu temel ilke nedir?", category: "Siyaset", options: ["Amaç araçları meşrulaştırır", "Demokrasi en iyi yönetim şeklidir", "Güç halka aittir", "Barış her şeyin önündedir"], correct: "Amaç araçları meşrulaştırır", penalty: "Yanlış tahmin eden kişi hükümdar taklidi yaparak 20 saniyelik iktidar konuşması yapmalı 👑" },
    { text: "Milgram deneyi neyi kanıtladı?", category: "Psikoloji", options: ["İnsanlar otorite emriyle zararlı eylem yapabilir", "İnsanlar doğaları gereği iyidir", "Grup baskısı karar değiştirir", "Bellek çok kırılgandır"], correct: "İnsanlar otorite emriyle zararlı eylem yapabilir", penalty: "Yanlış bilenler grup liderine itaat ediyormuş gibi verilen ilk emri hemen yapmalı ⚡" },
    { text: "Hangi Osmanlı padişahı en uzun süre tahtta kalmıştır?", category: "Tarih", options: ["Kanuni Sultan Süleyman", "Abdülhamid II", "II. Mehmed", "I. Ahmed"], correct: "Kanuni Sultan Süleyman", penalty: "Yanlış tahmin eden kişi Kanuni taklidi yaparak gruba 20 saniyelik kanun bildirisi okumalı 🏛️" },
    { text: "Spinoza'ya göre 'Tanrı' ile 'doğa' arasındaki ilişki nedir?", category: "Felsefe", options: ["Aynı şeydir — panteizm", "Tanrı doğanın yaratıcısıdır", "Doğa Tanrı'dan bağımsızdır", "Tanrı doğanın içinde değil dışındadır"], correct: "Aynı şeydir — panteizm", penalty: "Yanlış bilenler doğayla bütünleşmiş gibi 15 saniye meditasyon pozu almalı 🌿" },
    { text: "Kopernik'in heliosentrik teorisi neden devrimci sayılır?", category: "Bilim Tarihi", options: ["Dünya'nın güneş etrafında döndüğünü öne sürdü", "Uzayın sonsuz olduğunu kanıtladı", "Diğer gezegenleri keşfetti", "Teleskop icat etti"], correct: "Dünya'nın güneş etrafında döndüğünü öne sürdü", penalty: "Yanlış tahmin eden kişi güneş etrafında dönen dünya gibi sandalye etrafında 2 tur atmalı 🌍" },
  ];

  for (const q of quizWise) {
    await db.question.create({
      data: { text: q.text, category: q.category, gameMode: "QUIZ", ageGroup: "WISE", options: q.options, correct: q.correct, difficulty: "HARD", penalty: q.penalty ?? null, isActive: true },
    });
  }

  const count = await db.question.count();
  return NextResponse.json({ ok: true, count });
}
