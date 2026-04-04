import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

const LEVEL_LABEL: Record<string, string> = {
  EXACT: "Tam Eşleşme",
  CLOSE: "Yakın",
  WRONG: "Farklı",
};

const LEVEL_COLOR: Record<string, string> = {
  EXACT: "var(--exact)",
  CLOSE: "var(--close)",
  WRONG: "var(--wrong)",
};

export default async function ResultsPage({ params }: { params: Promise<{ gameId: string }> }) {
  await requireAuth();
  const { gameId } = await params;

  const game = await db.game.findUnique({
    where:   { id: gameId },
    include: {
      scores: { orderBy: { createdAt: "asc" } },
      rounds: {
        orderBy: { number: "asc" },
        include: {
          question: true,
          answers:  true,
          guesses:  true,
        },
      },
      room: true,
    },
  });

  if (!game) notFound();

  const totalPoints = game.scores.reduce((s, sc) => s + sc.points, 0);
  const familiarity = Math.round((totalPoints / (game.totalRounds * 10)) * 100);

  return (
    <main style={styles.page}>
      <div style={styles.inner}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={styles.logo}>mirros</h1>
          <p style={styles.subtitle}>Oyun bitti!</p>
        </div>

        {/* Familiarity score */}
        <div style={styles.familiarityCard}>
          <p style={styles.familiarityNum}>{familiarity}%</p>
          <p style={styles.familiarityLabel}>Tanışıklık Puanı</p>
          <p style={styles.familiarityDesc}>{familiarityText(familiarity)}</p>
        </div>

        {/* Per-round breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={styles.sectionTitle}>Round Özeti</p>
          {game.rounds.map((round) => {
            const score  = game.scores.find((s) => s.roundId === round.id);
            const answer = round.answers[0]?.content ?? "—";
            const guess  = round.guesses[0]?.content ?? "—";
            return (
              <div key={round.id} style={styles.roundCard}>
                <div style={styles.roundHeader}>
                  <span style={styles.roundNum}>Round {round.number}</span>
                  {score && (
                    <span style={{ color: LEVEL_COLOR[score.matchLevel], fontWeight: 700, fontSize: "0.8rem" }}>
                      {LEVEL_LABEL[score.matchLevel]} · {score.points}pt
                    </span>
                  )}
                </div>
                <p style={styles.questionText}>{round.question.text}</p>
                <div style={styles.answers}>
                  <span style={styles.answerBadge}>Cevap: {answer}</span>
                  <span style={styles.guessBadge}>Tahmin: {guess}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Play again */}
        <a href="/" style={styles.playAgain}>Yeni Oyun</a>
      </div>
    </main>
  );
}

function familiarityText(score: number) {
  if (score >= 90) return "Birbirinizi çok iyi tanıyorsunuz!";
  if (score >= 70) return "Birbirinizi oldukça iyi tanıyorsunuz.";
  if (score >= 50) return "Birbirinizi biraz tanıyorsunuz.";
  if (score >= 30) return "Birbirinizi daha fazla tanıyabilirsiniz.";
  return "Birbirinizi henüz çok az tanıyorsunuz.";
}

const styles = {
  page:            { minHeight: "100dvh", background: "var(--bg-base)", padding: "1.5rem" },
  inner:           { maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: "1.25rem" },
  logo:            { color: "var(--accent)", fontWeight: 800, fontSize: "1.5rem" },
  subtitle:        { color: "var(--fg-secondary)", fontSize: "0.9rem" },
  familiarityCard: { background: "var(--bg-surface)", borderRadius: 16, padding: "2rem", textAlign: "center" as const, border: "1px solid var(--accent)" },
  familiarityNum:  { color: "var(--accent)", fontSize: "3.5rem", fontWeight: 800, lineHeight: 1 },
  familiarityLabel:{ color: "var(--fg-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" },
  familiarityDesc: { color: "var(--fg-primary)", fontSize: "0.95rem", marginTop: "0.75rem" },
  sectionTitle:    { color: "var(--fg-secondary)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  roundCard:       { background: "var(--bg-surface)", borderRadius: 12, padding: "1rem" },
  roundHeader:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  roundNum:        { color: "var(--fg-secondary)", fontSize: "0.8rem", fontWeight: 600 },
  questionText:    { color: "var(--fg-primary)", fontSize: "0.95rem", marginBottom: "0.5rem" },
  answers:         { display: "flex", gap: "0.5rem", flexWrap: "wrap" as const },
  answerBadge:     { background: "var(--bg-elevated)", color: "var(--fg-primary)", borderRadius: 8, padding: "0.25rem 0.6rem", fontSize: "0.8rem" },
  guessBadge:      { background: "var(--bg-elevated)", color: "var(--accent)", borderRadius: 8, padding: "0.25rem 0.6rem", fontSize: "0.8rem" },
  playAgain:       { display: "block", background: "var(--accent)", color: "#fff", borderRadius: 12, fontWeight: 600, padding: "0.875rem", textAlign: "center" as const, textDecoration: "none", marginTop: "0.5rem" },
};
