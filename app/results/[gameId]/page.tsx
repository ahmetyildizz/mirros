import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { ShareButton } from "@/components/results/ShareButton";

const MATCH_COLOR: Record<string, string> = {
  EXACT: "var(--exact)",
  CLOSE: "var(--close)",
  WRONG: "var(--wrong)",
};
const MATCH_LABEL: Record<string, string> = {
  EXACT: "Tam",
  CLOSE: "Yakın",
  WRONG: "Farklı",
};
const MATCH_POINTS: Record<string, string> = {
  EXACT: "+10",
  CLOSE: "+5",
  WRONG: "0",
};

function familiarityEmoji(f: number) {
  if (f >= 90) return "🔥";
  if (f >= 70) return "💜";
  if (f >= 50) return "✨";
  if (f >= 30) return "🌱";
  return "🌙";
}

function familiarityText(f: number) {
  if (f >= 90) return "İkiniz neredeyse aynı zihin yapısına sahipsiniz!";
  if (f >= 70) return "Birbirinizi gerçekten iyi tanıyorsunuz.";
  if (f >= 50) return "Birbirinizi oldukça iyi tanıyorsunuz.";
  if (f >= 30) return "Birbirinizi tanımak için güzel bir başlangıç!";
  return "Birbirinizi keşfetmek için harika bir yolculuk başlıyor.";
}

export default async function ResultsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { id: myId } = await requireAuth();
  const { gameId }   = await params;

  const game = await db.game.findUnique({
    where:   { id: gameId },
    include: {
      scores: { orderBy: { points: "desc" } },
      rounds: {
        orderBy: { number: "asc" },
        include: {
          question: true,
          answers:  { include: { user: { select: { id: true, username: true, email: true } } } },
          guesses:  { include: { user: { select: { id: true, username: true, email: true } } } },
          scores:   { include: { guesser: { select: { id: true, username: true, email: true } } } },
        },
      },
      room: {
        include: {
          participants: {
            orderBy: { joinedAt: "asc" },
            include: { user: { select: { id: true, username: true, email: true } } },
          },
        },
      },
    },
  });

  if (!game) notFound();

  // Per-player total scores
  const playerTotals: Record<string, { username: string; points: number }> = {};
  for (const p of game.room.participants) {
    playerTotals[p.userId] = {
      username: p.user.username ?? p.user.email,
      points:   0,
    };
  }
  for (const s of game.scores) {
    if (playerTotals[s.guesserId]) {
      playerTotals[s.guesserId].points += s.points;
    }
  }
  const leaderboard = Object.entries(playerTotals)
    .sort((a, b) => b[1].points - a[1].points);

  const maxPoints  = game.totalRounds * 10;
  const topPoints  = leaderboard[0]?.[1].points ?? 0;
  const familiarity = Math.round((topPoints / maxPoints) * 100);

  return (
    <main style={s.page}>
      <div style={s.inner}>

        {/* Header */}
        <div style={s.header}>
          <span style={s.logo}>mirros</span>
          <p style={s.subtitle}>Oyun bitti!</p>
        </div>

        {/* Familiarity hero */}
        <div style={s.heroCard}>
          <div style={s.heroEmoji}>{familiarityEmoji(familiarity)}</div>
          <div style={s.heroNum}>{familiarity}%</div>
          <div style={s.heroLabel}>Tanışıklık Puanı</div>
          <p style={s.heroDesc}>{familiarityText(familiarity)}</p>
          <div style={s.heroBar}>
            <div style={{ ...s.heroBarFill, width: `${familiarity}%` }} />
          </div>
        </div>

        {/* Leaderboard */}
        <div style={s.section}>
          <p style={s.sectionTitle}>Sıralama</p>
          <div style={s.leaderList}>
            {leaderboard.map(([uid, { username, points }], i) => (
              <div key={uid} style={{
                ...s.leaderRow,
                background: uid === myId ? "var(--accent)" : "var(--bg-elevated)",
                color:       uid === myId ? "#fff"          : "var(--fg-primary)",
              }}>
                <span style={s.leaderRank}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                </span>
                <span style={{ flex: 1, fontWeight: uid === myId ? 700 : 500 }}>
                  {username}{uid === myId ? " (Sen)" : ""}
                </span>
                <span style={{ fontWeight: 700 }}>{points} pt</span>
              </div>
            ))}
          </div>
        </div>

        {/* Round breakdown */}
        <div style={s.section}>
          <p style={s.sectionTitle}>Round Özeti</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {game.rounds.map((round) => {
              const answer = round.answers[0];
              const answererName = answer?.user.username ?? answer?.user.email ?? "?";
              return (
                <div key={round.id} style={s.roundCard}>
                  <div style={s.roundHeader}>
                    <span style={s.roundNum}>#{round.number}</span>
                    <span style={s.roundAnswerer}>{answererName}</span>
                  </div>
                  <p style={s.roundQ}>{round.question.text}</p>
                  {answer && (
                    <div style={s.roundAnswer}>
                      <span style={s.answerTag}>Cevap</span>
                      <span style={s.answerVal}>{answer.content}</span>
                    </div>
                  )}
                  {round.scores.length > 0 && (
                    <div style={s.guessGrid}>
                      {round.scores.map((sc) => {
                        const guess = round.guesses.find((g) => g.userId === sc.guesserId);
                        return (
                          <div key={sc.id} style={{
                            ...s.guessChip,
                            borderColor: MATCH_COLOR[sc.matchLevel],
                          }}>
                            <span style={{ color: "var(--fg-secondary)", fontSize: "0.7rem" }}>
                              {sc.guesser.username ?? sc.guesser.email}
                            </span>
                            <span style={{ color: "var(--fg-primary)", fontSize: "0.85rem" }}>
                              {guess?.content ?? "—"}
                            </span>
                            <span style={{ color: MATCH_COLOR[sc.matchLevel], fontWeight: 700, fontSize: "0.75rem" }}>
                              {MATCH_LABEL[sc.matchLevel]} {MATCH_POINTS[sc.matchLevel]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={s.actions}>
          <ShareButton familiarity={familiarity} gameId={gameId} />
          <a href="/" style={s.newGame}>Yeni Oyun</a>
        </div>

      </div>
    </main>
  );
}

const s = {
  page:         { minHeight: "100dvh", background: "var(--bg-base)", padding: "1.25rem 1rem 3rem" },
  inner:        { maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: "1.25rem" },
  header:       { textAlign: "center" as const },
  logo:         { color: "var(--accent)", fontWeight: 800, fontSize: "1.4rem" },
  subtitle:     { color: "var(--fg-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" },

  heroCard:     { background: "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface, var(--bg-elevated)) 100%)", borderRadius: 20, padding: "2rem 1.5rem", textAlign: "center" as const, border: "1px solid var(--accent)", position: "relative" as const, overflow: "hidden" as const },
  heroEmoji:    { fontSize: "2.5rem", marginBottom: "0.5rem" },
  heroNum:      { color: "var(--accent)", fontSize: "4rem", fontWeight: 800, lineHeight: 1 },
  heroLabel:    { color: "var(--fg-secondary)", fontSize: "0.8rem", marginTop: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
  heroDesc:     { color: "var(--fg-primary)", fontSize: "0.95rem", marginTop: "0.75rem", lineHeight: 1.5 },
  heroBar:      { marginTop: "1rem", height: 6, background: "var(--bg-base)", borderRadius: 3, overflow: "hidden" as const },
  heroBarFill:  { height: "100%", background: "var(--accent)", borderRadius: 3, transition: "width 1s ease" },

  section:      { display: "flex", flexDirection: "column" as const, gap: "0.6rem" },
  sectionTitle: { color: "var(--fg-secondary)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em" },

  leaderList:   { display: "flex", flexDirection: "column" as const, gap: "0.4rem" },
  leaderRow:    { display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.7rem 0.9rem", borderRadius: 12 },
  leaderRank:   { fontSize: "1.1rem", width: 28, textAlign: "center" as const },

  roundCard:    { background: "var(--bg-elevated)", borderRadius: 12, padding: "0.85rem" },
  roundHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" },
  roundNum:     { color: "var(--fg-muted)", fontSize: "0.75rem", fontWeight: 700 },
  roundAnswerer:{ color: "var(--accent)", fontSize: "0.75rem", fontWeight: 600 },
  roundQ:       { color: "var(--fg-primary)", fontSize: "0.9rem", marginBottom: "0.5rem" },
  roundAnswer:  { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" },
  answerTag:    { background: "var(--exact)", color: "#000", borderRadius: 4, padding: "0.15rem 0.45rem", fontSize: "0.7rem", fontWeight: 700 },
  answerVal:    { color: "var(--exact)", fontWeight: 700, fontSize: "0.95rem" },
  guessGrid:    { display: "flex", flexDirection: "column" as const, gap: "0.35rem" },
  guessChip:    { display: "flex", flexDirection: "column" as const, gap: "0.1rem", padding: "0.45rem 0.65rem", borderRadius: 8, border: "1px solid" },

  actions:      { display: "flex", flexDirection: "column" as const, gap: "0.6rem", paddingTop: "0.5rem" },
  newGame:      { display: "block", background: "var(--bg-elevated)", color: "var(--fg-primary)", border: "1px solid var(--fg-muted)", borderRadius: 12, fontWeight: 600, padding: "0.85rem", textAlign: "center" as const, textDecoration: "none", fontSize: "0.95rem" },
};
