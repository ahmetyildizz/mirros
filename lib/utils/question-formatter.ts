/**
 * Mirros Soru Formatlayıcı
 *
 * [İSİM] yer tutucusunu gerçek isimle değiştirir.
 * Odak ismi "Siz" olduğunda fiil ve iyelik eklerini 2. çoğul şahsa (siz) uyarlar.
 */

export function formatQuestion(text: string, focusName: string): string {
  if (!text) return "";

  // Üçüncü şahıs isimlerde sadece placeholder değişimi yeterli
  if (focusName !== "Siz") {
    return text.replace(/\[İ?S[Iİ]M\]/gi, focusName);
  }

  // 1. Placeholder'ı "Siz" ile değiştir
  let q = text.replace(/\[İ?S[Iİ]M\]/gi, "Siz");

  // ── İyelik ekleri (3. şahıs → 2. çoğul) ──────────────────────────────────
  const possessive: [RegExp, string][] = [
    [/\bpartneriyle\b/g,     "partnerinizle"],
    [/\bsevgilisiyle\b/g,    "sevgilinizle"],
    [/\barkadaşıyla\b/g,     "arkadaşınızla"],
    [/\bailesiyle\b/g,       "ailenizle"],
    [/\bannesiye\b/g,        "annenizle"],
    [/\bbabasıyla\b/g,       "babanızla"],
    [/\bevinde\b/g,          "evinizde"],
    [/\bevinden\b/g,         "evinizden"],
    [/\beverine\b/g,         "evinize"],
    [/\bişinde\b/g,          "işinizde"],
    [/\bişinden\b/g,         "işinizden"],
    [/\bişine\b/g,           "işinize"],
    [/\btelefonunda\b/g,     "telefonunuzda"],
    [/\btelefonundan\b/g,    "telefonunuzdan"],
    [/\btelefonuna\b/g,      "telefonunuza"],
    [/\bcüzdanında\b/g,      "cüzdanınızda"],
    [/\bodasında\b/g,        "odanızda"],
    [/\bodasından\b/g,       "odanızdan"],
    [/\bodasına\b/g,         "odanıza"],
    [/\barabasında\b/g,      "arabanızda"],
    [/\barabasından\b/g,     "arabanızdan"],
    [/\barabasına\b/g,       "arabanıza"],
    [/\bhayatında\b/g,       "hayatınızda"],
    [/\bhayatından\b/g,      "hayatınızdan"],
    [/\bhayatına\b/g,        "hayatınıza"],
    [/\bkafasında\b/g,       "kafanızda"],
    [/\bkafasından\b/g,      "kafanızdan"],
    [/\bkafasına\b/g,        "kafanıza"],
    [/\bmasasında\b/g,       "masanızda"],
    [/\bçantasında\b/g,      "çantanızda"],
    [/\bgözünde\b/g,         "gözünüzde"],
    [/\bsırrını\b/g,         "sırrınızı"],
    [/\bsırrı\b/g,           "sırrınız"],
    [/\bdüşüncesi\b/g,       "düşünceniz"],
    [/\bplanı\b/g,           "planınız"],
    [/\bhedefi\b/g,          "hedefiniz"],
    [/\bkorkusu\b/g,         "korkunuz"],
    [/\bkorkusu\b/g,         "korkunuz"],
  ];
  for (const [from, to] of possessive) {
    q = q.replace(from, to);
  }

  // ── Geçmiş zaman (3. tekil → 2. çoğul) ───────────────────────────────────
  // "-dı/-di/-du/-dü" ve "-tı/-ti/-tu/-tü" ekleri
  q = q
    .replace(/yaşadı(\s|,|\.|\?)/g,  "yaşadınız$1")
    .replace(/yaptı(\s|,|\.|\?)/g,   "yaptınız$1")
    .replace(/etti(\s|,|\.|\?)/g,    "ettiniz$1")
    .replace(/gitti(\s|,|\.|\?)/g,   "gittiniz$1")
    .replace(/geldi(\s|,|\.|\?)/g,   "geldiniz$1")
    .replace(/söyledi(\s|,|\.|\?)/g, "söylediniz$1")
    .replace(/istedi(\s|,|\.|\?)/g,  "istediniz$1")
    .replace(/buldu(\s|,|\.|\?)/g,   "buldunuz$1")
    .replace(/seçti(\s|,|\.|\?)/g,   "seçtiniz$1")
    .replace(/çıktı(\s|,|\.|\?)/g,   "çıktınız$1")
    .replace(/aldı(\s|,|\.|\?)/g,    "aldınız$1")
    .replace(/verdi(\s|,|\.|\?)/g,   "verdiniz$1")
    .replace(/oldu(\s|,|\.|\?)/g,    "oldunuz$1");

  // ── Şimdiki zaman soru / spekülasyon kalıpları ────────────────────────────
  q = q
    .replace(/ne yapıyordur\?/g,      "ne yapıyorsunuzdur?")
    .replace(/ne yapıyor\?/g,         "ne yapıyorsunuz?")
    .replace(/nerededir\?/g,          "neredesiniz?")
    .replace(/ne düşünüyordur\?/g,    "ne düşünüyorsunuzdur?")
    .replace(/ne düşünüyor\?/g,       "ne düşünüyorsunuz?")
    .replace(/ne hissediyordur\?/g,   "ne hissediyorsunuzdur?")
    .replace(/ne hissediyor\?/g,      "ne hissediyorsunuz?")
    .replace(/ne yapardı\?/g,         "ne yapardınız?")
    .replace(/ne yapardı /g,          "ne yapardınız ")
    .replace(/ne der\?/g,             "ne dersiniz?")
    .replace(/ne yapar\?/g,           "ne yaparsınız?")
    .replace(/neler yapar\?/g,        "neler yaparsınız?")
    .replace(/ne seçer\?/g,           "ne seçersiniz?")
    .replace(/ne ister\?/g,           "ne istersiniz?")
    .replace(/ne söyler\?/g,          "ne söylersiniz?");

  // ── Şart kipi (3. tekil → 2. çoğul) ──────────────────────────────────────
  q = q
    .replace(/\byapsa\b/g,  "yapsanız")
    .replace(/\bolsa\b/g,   "olsanız")
    .replace(/\bgörse\b/g,  "görseniz")
    .replace(/\bgitse\b/g,  "gitseniz")
    .replace(/\bverse\b/g,  "verseniz")
    .replace(/\bsöylese\b/g,"söyleseniz")
    .replace(/\bbulsa\b/g,  "bulsanız")
    .replace(/\bçıksa\b/g,  "çıksanız");

  // ── Gereklilik / istek kipi ────────────────────────────────────────────────
  q = q
    .replace(/yapmalı\?/g,  "yapmalısınız?")
    .replace(/etmeli\?/g,   "etmelisiniz?")
    .replace(/gitmeli\?/g,  "gitmelisiniz?");

  // ── Hikâye / rivayet geçmişi ───────────────────────────────────────────────
  q = q
    .replace(/miydi\?/g,  "miydiniz?")
    .replace(/mıydı\?/g,  "mıydınız?")
    .replace(/muydu\?/g,  "muydunuz?")
    .replace(/müydü\?/g,  "müydünüz?");

  return q;
}
