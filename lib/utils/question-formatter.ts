/**
 * Mirros Soru Formatlayıcı
 * 
 * [İSİM] yer tutucusunu gerçek isimle değiştirir ve 
 * isim "Siz" olduğunda dili 2. tekil/çoğul şahsa göre (Siz/Sen) 
 * dilbilgisi kuralarına uygun şekilde düzeltir.
 */

export function formatQuestion(text: string, focusName: string): string {
  if (!text) return "";

  // Eğer odak ismi "Siz" değilse, sadece basit yer tutucu değişimi yeterli
  if (focusName !== "Siz") {
    return text.replace(/\[İ?S[Iİ]M\]/gi, focusName);
  }

  // 1. Placeholder'ı "Siz" ile değiştir
  let formatted = text.replace(/\[İ?S[Iİ]M\]/gi, "Siz");

  // 2. İyelik ve Nesne Ekleri Düzeltmeleri (Siz partneriyle -> Siz partnerinizle)
  const possessiveFixes = [
    { from: /Siz partneriyle/g, to: "Siz partnerinizle" },
    { from: /Siz sevgilisiyle/g, to: "Siz sevgilinizle" },
    { from: /Siz arkadaşıyla/g, to: "Siz arkadaşınızla" },
    { from: /Siz ailesiyle/g, to: "Siz ailenizle" },
    { from: /Siz evinde/g, to: "Siz evinizde" },
    { from: /Siz işinde/g, to: "Siz işinizde" },
    { from: /Siz telefonunda/g, to: "Siz telefonunuzda" },
    { from: /Siz cüzdanında/g, to: "Siz cüzdanınızda" },
    { from: /Siz odasında/g, to: "Siz odanızda" },
    { from: /Siz arabasında/g, to: "Siz arabanızda" },
  ];

  possessiveFixes.forEach(fix => {
    formatted = formatted.replace(fix.from, fix.to);
  });

  // 3. Fiil Çekimi Düzeltmeleri (3. Tekil -> 2. Çoğul/Nazik)
  // Örn: "yaşadı" -> "yaşadınız", "yapar" -> "yaparsınız"
  
  // Soru Ekli Fiiller (atardı? -> atar mıydınız? / atardınız?)
  // Mevcut sistemdeki soru eklerini güncelleyelim
  formatted = formatted
    .replace(/miydi\?/g, "miydiniz?")
    .replace(/mıydı\?/g, "mıydınız?")
    .replace(/muydu\?/g, "muydunuz?")
    .replace(/müydü\?/g, "müydünüz?")
    .replace(/rdi\?/g, "rdiniz?")
    .replace(/rdı\?/g, "rdınız?")
    .replace(/ti\?/g, "tiniz?")
    .replace(/tı\?/g, "tınız?")
    .replace(/tu\?/g, "tunuz?")
    .replace(/tü\?/g, "tünüz?")
    .replace(/di\?/g, "diniz?")
    .replace(/dı\?/g, "dınız?")
    .replace(/du\?/g, "dunuz?")
    .replace(/dü\?/g, "dünüz?");

  // Geniş Zaman, Şimdiki Zaman ve Şart Kipi Soru (ne yapıyor? -> ne yapıyorsunuz?, yapsa -> yapsanız)
  formatted = formatted
    .replace(/yapıyor\?/g, "yapıyorsunuz?")
    .replace(/eder\?/g, "eder misiniz?")
    .replace(/olurdu\?/g, "olurdunuz?")
    .replace(/seçerdi\?/g, "seçerdiniz?")
    .replace(/atardı\?/g, "atardınız?")
    .replace(/yapsa /g, "yapsanız ")
    .replace(/yapsa,/g, "yapsanız,")
    .replace(/olsa /g, "olsanız ")
    .replace(/olsa,/g, "olsanız,")
    .replace(/görse /g, "görseniz ")
    .replace(/görse,/g, "görseniz,")
    .replace(/ne yapar\?/g, "ne yaparsınız?")
    .replace(/ne der\?/g, "ne dersiniz?")
    .replace(/neler yapar\?/g, "neler yaparsınız?");

  // Geçmiş Zaman (yaşadı -> yaşadınız)
  // Sadece cümle sonundaki veya bağlaç öncesindeki çekimleri hedefle
  formatted = formatted
    .replace(/şadı ve/g, "şadınız ve")
    .replace(/şadı,/g, "şadınız,")
    .replace(/yaşadı /g, "yaşadınız ");

  return formatted;
}
