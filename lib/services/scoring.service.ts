export type MatchLevel = "EXACT" | "CLOSE" | "WRONG";

export interface ScoreResult {
  matchLevel: MatchLevel;
  points: number;
  familiarity: number; // 0-100
}

const POINTS: Record<MatchLevel, number> = {
  EXACT: 10,
  CLOSE: 5,
  WRONG: 0,
};

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Türkçe karakter normalizasyonu
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(/\s+/));
  const tb = new Set(b.split(/\s+/));
  const common = [...ta].filter((t) => tb.has(t)).length;
  return common / Math.max(ta.size, tb.size);
}

export function scoreRound(answer: string, guess: string): MatchLevel {
  const a = normalize(answer);
  const g = normalize(guess);

  if (a === g) return "EXACT";

  const dist = levenshtein(a, g);
  if (dist <= 2) return "CLOSE";

  const overlap = tokenOverlap(a, g);
  if (overlap >= 0.7) return "CLOSE";

  return "WRONG";
}

export function calculateFamiliarity(
  totalPoints: number,
  totalRounds: number
): number {
  const max = totalRounds * POINTS.EXACT;
  return Math.round((totalPoints / max) * 100);
}

export function getPoints(level: MatchLevel): number {
  return POINTS[level];
}
