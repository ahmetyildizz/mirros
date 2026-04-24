/**
 * Mirros Content Moderation System
 * Robust filtering for Turkish profanity and inappropriate patterns.
 */

const BANNED_WORDS = [
  "aq", "amk", "amq", "piç", "oç", "yavşak", "pezevenk", "göt", "sik", "taşşak",
  "dalyarak", "yarrak", "amcık", "meme", "daddy", "fetiş", "seks", "porno", "azgın",
  "orospu", "kahpe", "fahişe", "gavat", "ibne", "top", "sikerim", "sikiş", "sokuş",
  "kahbe", "kodumun", "puşt", "şerefsiz", "salak", "aptal", "gerizekalı", "gerizalak",
  "orosbu", "amına", "kodum", "yarra", "yarağım", "yarrrak"
];

const BANNED_PATTERNS = [
  /[a4][m][k]/gi,
  /[s][i1][k]/gi,
  /[a][m][c][i1][k]/gi,
  /[y][a][r][r][a][k]/gi,
  /[g][oö][t]/gi,
  /[p][i1][ç]/gi,
  /[o][ç]/gi,
  /[o][.][ç]/gi,
  /[p][e][z][e][v][e][n][k]/gi
];

export function moderateContent(text: string): { isClean: boolean; reason?: string } {
  const normalized = text.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9ğüşıöç\s]/g, "");
  const words = normalized.split(/\s+/);

  // 1. Exact Word Check
  for (const word of words) {
    if (BANNED_WORDS.includes(word)) {
      return { isClean: false, reason: "Uygunsuz bir kelime tespit edildi." };
    }
  }

  // 2. Pattern Check (for bypasses like a.m.k or s.i.k)
  const rawNormalized = text.toLocaleLowerCase("tr-TR");
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(rawNormalized)) {
      return { isClean: false, reason: "Uygunsuz bir içerik kalıbı tespit edildi." };
    }
  }

  // 3. Length checks & repetitive chars (anti-spam)
  if (/(.)\1{4,}/.test(normalized)) { // e.g. "aaaaaa"
     return { isClean: false, reason: "Lütfen anlamsız veya tekrarlayan karakterler kullanmayın." };
  }

  return { isClean: true };
}
