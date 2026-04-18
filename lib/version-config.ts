export const CURRENT_VERSION = "v0.5.1";

export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "v0.5.1",
    date: "2026-04-18",
    title: "İstatistikler ve Versiyon Kontrolü",
    changes: [
      "Ana sayfaya canlı stats (oda/oyuncu sayısı) eklendi",
      "Kişiselleştirilmiş kullanıcı dashboard'u eklendi",
      "İnteraktif oyun rehberi (Nasıl Oynanır?) eklendi",
      "Merkezi versiyon takip sistemi ve changelog paneli kuruldu"
    ]
  },
  {
    version: "v0.5.0",
    date: "2026-04-18",
    title: "Sosyal Özellikler ve Ses Fixleri",
    changes: [
      "Casus (SPY) modu senkronizasyon hataları giderildi",
      "Komik ses efektleri (reaksiyonlar) remapped ve iyileştirildi",
      "Mobil/Web autoplay ses engeli (unlocker) aşıldı",
      "Puanlama sistemindeki beraberlik durumları (Spy) randomize yerine stratejik hale getirildi"
    ]
  },
  {
    version: "v0.4.0",
    date: "2026-04-17",
    title: "Eğlence Paketi",
    changes: [
      "Canlı reaksiyonlar (emoji + ses) eklendi",
      "Casus (SPY) oyun modu prototipi eklendi",
      "AI tabanlı sosyal rozetler ve analiz sistemi eklendi",
      "İzleyici (Spectator) modu desteği geldi"
    ]
  }
];
