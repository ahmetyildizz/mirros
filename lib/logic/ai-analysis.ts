export interface GameTelemetry {
  familiarity: number;
  totalRounds: number;
  topPlayerName: string;
  unpredictableName: string;
  mostIntuitiveName: string;
  chaoticLevel: "LOW" | "MEDIUM" | "HIGH";
  gameMode: string;
}

export function generateAIInsight(telemetry: GameTelemetry) {
  const { familiarity, unpredictableName, mostIntuitiveName, chaoticLevel } = telemetry;

  const intros = [
    "Mirros Zihin Laboratuvarı sonuçları analiz etti...",
    "Kuantum sosyal veri taraması tamamlandı.",
    "Derin öğrenme modelleri aranızdaki bağı çözdü.",
    "Yapay zeka bu grubun sırlarını ortaya döküyor..."
  ];

  const intro = intros[Math.floor(Math.random() * intros.length)];

  let story = "";
  let tag = "";

  if (familiarity >= 85) {
    tag = "Mükemmel Senkronizasyon";
    story = `Siz bir grup değil, tek bir zihin gibi hareket ediyorsunuz. ${mostIntuitiveName} adeta bir 'Zihin Okuyucu' gibi herkesin gizli düşüncelerine erişmiş durumda. Bu bağ o kadar kuvvetli ki, Mirros veritabanı bile bu uyum karşısında sarsıldı. Aranızdaki telepatik bağın kaydını aldım; siz birbirinizden bir şey saklayamazsınız!`;
  } else if (familiarity >= 60) {
    tag = "Güçlü Bağlar";
    story = `Aranızda gerçekten samimi ve dürüst bir ilişki var. ${unpredictableName} bazen 'Vahşi Kart' gibi davranıp herkesi şaşırtsa da, genel olarak birbirinizin kodlarını çözmüşsünüz. ${mostIntuitiveName} ise grubun gözlemci gücü olarak parlıyor. Bu uyum seviyesi, gerçek dostluğun veya derin bir ilişkinin matematiksel kanıtıdır.`;
  } else if (familiarity >= 30) {
    tag = "Keşif Yolculuğu";
    story = `Birbirinizi tanıdığınızı düşünüyorsunuz ama Mirros derinlerde çok farklı şeyler buldu. ${unpredictableName} tam bir kapalı kutu gibi davranarak grubun kafasını karıştırmaktan büyük zevk alıyor. ${chaoticLevel === "HIGH" ? "Kaotik yapınız kararlarınızı etkiliyor," : ""} ancak hala birbirinizde keşfedecek çok fazla sürpriz var. Bu oyun aslında buzdağının görünen kısmıydı.`;
  } else {
    tag = "Tam Bir Muamma";
    story = `Açık konuşalım; bu grup birbirine karşı tam bir yabancı gibi davranıyor! ${unpredictableName} o kadar tahmin edilemez cevaplar verdi ki, AI algoritmalarım bile kendisini sorgulamaya başladı. ${mostIntuitiveName} ise 'Hangi evrendeyiz?' modunda dolanıyor gibi. Endişelenmeyin, bu gizem aranızdaki heyecanı diri tutacaktır. Belki de biraz daha vakit geçirmelisiniz!`;
  }

  return {
    intro,
    tag,
    story
  };
}
