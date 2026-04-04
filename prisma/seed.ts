import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const questions = [
  // Yiyecek & İçecek
  { text: "En sevdiğin kahvaltı ne?",              category: "Yiyecek", difficulty: "EASY" },
  { text: "Hayatında bir kez yiyebileceksen ne yersin?", category: "Yiyecek", difficulty: "EASY" },
  { text: "En nefret ettiğin yemek hangisi?",       category: "Yiyecek", difficulty: "EASY" },
  { text: "Gece yarısı acıksan ne yaparsın?",       category: "Yiyecek", difficulty: "EASY" },
  { text: "Pizza üstüne ne koyarsın?",              category: "Yiyecek", difficulty: "EASY" },

  // Boş Zaman
  { text: "Serbest zamanında ne yaparsın?",         category: "Boş Zaman", difficulty: "EASY" },
  { text: "İdeal bir tatil nerede olur?",           category: "Boş Zaman", difficulty: "EASY" },
  { text: "Bir film izlesen hangi türü seçersin?",  category: "Boş Zaman", difficulty: "EASY" },
  { text: "En son bitirdiğin kitap neydi?",         category: "Boş Zaman", difficulty: "MEDIUM" },
  { text: "Müzik dinlerken hangi türü tercih edersin?", category: "Boş Zaman", difficulty: "EASY" },

  // Kişilik
  { text: "Sabah insanı mısın, gece insanı mı?",   category: "Kişilik", difficulty: "EASY" },
  { text: "Yalnız mı iyisin, kalabalıkta mı?",     category: "Kişilik", difficulty: "EASY" },
  { text: "Planlamayı mı seversin, spontane mi gidersin?", category: "Kişilik", difficulty: "EASY" },
  { text: "Sinirlendiğinde ne yaparsın?",           category: "Kişilik", difficulty: "MEDIUM" },
  { text: "En büyük korkun nedir?",                 category: "Kişilik", difficulty: "MEDIUM" },

  // Hayat Görüşü
  { text: "Para mı mutluluk mu?",                   category: "Hayat", difficulty: "MEDIUM" },
  { text: "10 yıl sonra kendini nerede görüyorsun?",category: "Hayat", difficulty: "MEDIUM" },
  { text: "Bir şeyi değiştirebilsen ne değiştirirsin?", category: "Hayat", difficulty: "HARD" },
  { text: "En çok neye değer verirsin?",            category: "Hayat", difficulty: "MEDIUM" },
  { text: "Mutlu olmak için ne gerekli?",           category: "Hayat", difficulty: "HARD" },

  // Sosyal
  { text: "Bir partide nerede bulunursun?",         category: "Sosyal", difficulty: "EASY" },
  { text: "Arkadaşlıkta en önem verdiğin şey nedir?", category: "Sosyal", difficulty: "MEDIUM" },
  { text: "Kavga ettiğinde özür diler misin?",      category: "Sosyal", difficulty: "MEDIUM" },
  { text: "Birini ilk gördüğünde ne dikkatini çeker?", category: "Sosyal", difficulty: "EASY" },
  { text: "En yakın arkadaşına nasıl tanımlanırsın?", category: "Sosyal", difficulty: "MEDIUM" },

  // Tercihler (A mı B mi)
  { text: "Deniz mi, dağ mı?",                     category: "Tercihler", difficulty: "EASY" },
  { text: "Köpek mi, kedi mi?",                    category: "Tercihler", difficulty: "EASY" },
  { text: "Sessizlik mi, müzik mi?",               category: "Tercihler", difficulty: "EASY" },
  { text: "Geçmiş mi, gelecek mi?",                category: "Tercihler", difficulty: "EASY" },
  { text: "Akıl mı, his mi?",                      category: "Tercihler", difficulty: "MEDIUM" },

  // Anılar
  { text: "Çocukluğundaki en güzel anın neydi?",   category: "Anılar", difficulty: "MEDIUM" },
  { text: "Hayatında aldığın en iyi karar neydi?", category: "Anılar", difficulty: "HARD" },
  { text: "Pişman olduğun bir şey var mı?",        category: "Anılar", difficulty: "HARD" },
  { text: "En çok kimi özlüyorsun?",               category: "Anılar", difficulty: "MEDIUM" },
  { text: "Hayatındaki dönüm noktası neydi?",      category: "Anılar", difficulty: "HARD" },

  // Günlük Hayat
  { text: "Sabah ilk ne yaparsın?",                category: "Günlük", difficulty: "EASY" },
  { text: "Uyumadan önce ne yaparsın?",            category: "Günlük", difficulty: "EASY" },
  { text: "Stres attırmak için ne yaparsın?",      category: "Günlük", difficulty: "EASY" },
  { text: "Telefona baktığında ilk açtığın uygulama hangisi?", category: "Günlük", difficulty: "EASY" },
  { text: "Kaç saate bir su içersin?",             category: "Günlük", difficulty: "EASY" },

  // Hayal
  { text: "Süper gücün olsaydı ne olurdu?",        category: "Hayal", difficulty: "EASY" },
  { text: "Tarihin hangi döneminde yaşamak isterdin?", category: "Hayal", difficulty: "MEDIUM" },
  { text: "Bir gün için kim olmak isterdin?",      category: "Hayal", difficulty: "MEDIUM" },
  { text: "Tüm parayı kazansan ne yaparsın?",      category: "Hayal", difficulty: "EASY" },
  { text: "Dünyayı değiştirebilseydin neyi değiştirirdin?", category: "Hayal", difficulty: "HARD" },

  // İlişki
  { text: "Aşkta mı önce davranırsın?",            category: "İlişki", difficulty: "MEDIUM" },
  { text: "İdeal buluşma yerin neresi?",           category: "İlişki", difficulty: "EASY" },
  { text: "Bir ilişkide kırılma noktan ne olur?",  category: "İlişki", difficulty: "HARD" },
  { text: "Sevdiğine nasıl sevgini gösterirsin?",  category: "İlişki", difficulty: "MEDIUM" },
  { text: "Uzun mesafe ilişki mümkün mü?",         category: "İlişki", difficulty: "MEDIUM" },
] as const;

async function main() {
  // Dev kullanıcısı
  const devUser = await db.user.upsert({
    where:  { email: "dev@mirros.app" },
    update: {},
    create: { id: "dev-user-001", email: "dev@mirros.app", username: "devuser" },
  });
  console.log("Dev user:", devUser.id);

  console.log("Sorular ekleniyor...");
  for (const q of questions) {
    await db.question.upsert({
      where: { id: q.text },
      update: {},
      create: {
        text: q.text,
        category: q.category,
        difficulty: q.difficulty as "EASY" | "MEDIUM" | "HARD",
        language: "tr",
        isActive: true,
      },
    });
  }
  console.log(`${questions.length} soru eklendi.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
