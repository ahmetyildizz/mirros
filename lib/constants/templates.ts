import { 
  Users, 
  Cake, 
  Briefcase, 
  Brain, 
  Baby,
  Star,
  Flame,
  Fingerprint,
  Clock,
  MessageSquare,
  Gamepad2,
  MoonStar,
  Utensils,
  Coffee,
  Tv,
  Crown
} from "lucide-react";

export type GameMode = "SOCIAL" | "QUIZ" | "EXPOSE" | "BLUFF" | "SPY";
export type AgeGroup = "CHILD" | "ADULT" | "WISE";

export interface Template {
  icon:       any;
  label:      string;
  desc:       string;
  gameMode:   GameMode;
  ageGroup:   AgeGroup;
  maxPlayers: number;
  color:      string;
}

export const TEMPLATES: Template[] = [
  { icon: Users,      label: "Çift Gecesi",      desc: "Birbirinizi ne kadar tanıyorsunuz?", gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 2,  color: "from-rose-500 to-pink-600" },
  { icon: Coffee,     label: "Buz Kıran",        desc: "Yeni tanışanlar için buzları eriten sorular", gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-sky-400 to-blue-500" },
  { icon: Flame,      label: "Dedikodu Masası",  desc: "Grupta en çok kim... (Yüzleşme)",    gameMode: "EXPOSE", ageGroup: "ADULT", maxPlayers: 10, color: "from-red-500 to-orange-600" },
  { icon: Users,      label: "Aile Toplantısı", desc: "Aile bağını güçlendirin, birlikte gülün",    gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 6,  color: "from-purple-500 to-indigo-600" },
  { icon: Cake,       label: "Doğum Günü",        desc: "Misafirler konuğu ne kadar tanıyor?",       gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-orange-400 to-red-500" },
  { icon: Briefcase,  label: "Takım Building",    desc: "Ekip arkadaşlarınızı keşfedin",             gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10, color: "from-cyan-500 to-blue-600" },
  { icon: Flame,      label: "Ofis Kaosu",        desc: "İş yerinde maskeleri düşürün!",             gameMode: "EXPOSE", ageGroup: "ADULT", maxPlayers: 8,  color: "from-blue-600 to-slate-800" },
  { icon: Flame,      label: "Kampüs Kaosu",      desc: "Kantin ve dersliklerdeki maskeler düşsün!", gameMode: "EXPOSE", ageGroup: "ADULT", maxPlayers: 10, color: "from-orange-500 to-red-600" },
  { icon: Clock,      label: "Nostalji 90'lar",   desc: "Kasetler, atariler ve unutulmaz anılar!",   gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-yellow-500 to-orange-600" },
  { icon: Star,       label: "Kız Gecesi",        desc: "Gıybet, moda ve dostluk dolu bir akşam!",   gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 12, color: "from-pink-400 to-rose-500" },
  { icon: Brain,      label: "Bilgi Yarışması",   desc: "Eğlenceli sorular, komik cezalar",          gameMode: "QUIZ",   ageGroup: "ADULT", maxPlayers: 6,  color: "from-emerald-400 to-teal-500" },
  { icon: Tv,         label: "Sinema & Dizi",     desc: "Kült filmler ve viral diziler hakkında her şey!", gameMode: "QUIZ", ageGroup: "ADULT", maxPlayers: 8, color: "from-blue-500 to-indigo-600" },
  { icon: Crown,      label: "Bilgelerin Meydanı", desc: "Tarih, felsefe ve derin genel kültür",     gameMode: "QUIZ",   ageGroup: "WISE",  maxPlayers: 6,  color: "from-indigo-600 to-purple-800" },
  { icon: Flame,      label: "Bluff Gecesi",      desc: "Yalan söyle, kandır, kazan! (Fibbage)",     gameMode: "BLUFF",  ageGroup: "ADULT", maxPlayers: 8,  color: "from-violet-500 to-fuchsia-600" },
  { icon: Fingerprint, label: "Casus Avı",        desc: "Aramızdaki casusu kim bulacak?",            gameMode: "SPY",    ageGroup: "ADULT", maxPlayers: 10, color: "from-slate-700 to-black" },
  { icon: Baby,       label: "Süper Çocuklar",    desc: "Küçükler için eğlenceli ve güvenli oyun",   gameMode: "SOCIAL", ageGroup: "CHILD", maxPlayers: 6,  color: "from-cyan-400 to-blue-400" },
  { icon: MessageSquare, label: "Ben Hiç...",    desc: "İtiraflar başlasın! Kimler ne yaptı?",      gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10, color: "from-purple-400 to-indigo-500" },
  { icon: Gamepad2,   label: "Z Kuşağı",         desc: "Trendler, meme'ler ve yeni nesil jargon!",  gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 10, color: "from-yellow-300 to-green-400" },
  { icon: MoonStar,   label: "Astroloji",        desc: "Yıldızlar senin için ne diyor? (Spiritüel)", gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-indigo-400 to-purple-600" },
  { icon: Utensils,   label: "Gurme & Mutfak",   desc: "Yemek tutkunları için lezzetli sorular!",   gameMode: "SOCIAL", ageGroup: "ADULT", maxPlayers: 8,  color: "from-orange-400 to-amber-500" },
];
