import { notFound } from "next/navigation";
import { db }       from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { id: myId }  = await requireAuth();
  const { userId }    = await params;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, createdAt: true },
  });
  if (!user) notFound();

  const displayName = user.username ?? user.email;
  const isMe        = userId === myId;

  // Bu kullanıcının yanıtladığı tüm social round'ları çek
  const rounds = await db.round.findMany({
    where: { answererId: userId, game: { room: { gameMode: "SOCIAL" } }, status: "SCORED" },
    include: {
      question: { select: { text: true } },
      answers:  { where: { userId }, select: { content: true } },
      scores:   { include: { guesser: { select: { id: true, username: true, email: true } } } },
    },
    orderBy: { game: { startedAt: "desc" } },
    take: 50,
  });

  // Kimin seni en iyi tanıdığını hesapla
  const guesserMap: Record<string, { name: string; correct: number; total: number }> = {};
  for (const r of rounds) {
    for (const sc of r.scores) {
      const key = sc.guesserId;
      if (!guesserMap[key]) guesserMap[key] = { name: sc.guesser.username ?? sc.guesser.email, correct: 0, total: 0 };
      guesserMap[key].total  += 1;
      if (sc.points >= 10) guesserMap[key].correct += 1;
    }
  }
  const topGuessers = Object.entries(guesserMap)
    .filter(([, v]) => v.total >= 2)
    .map(([id, v]) => ({ id, ...v, pct: Math.round((v.correct / v.total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  // Oyun istatistikleri
  const totalAnswered = rounds.length;
  const totalGames    = await db.game.count({ where: { room: { participants: { some: { userId } } } } });

  return (
    <main style={s.page}>
      <div style={s.inner}>

        {/* Avatar + isim */}
        <div style={s.header}>
          <div style={s.avatar}>{displayName[0].toUpperCase()}</div>
          <h1 style={s.name}>{displayName}</h1>
          {isMe && <span style={s.meBadge}>Sen</span>}
          <p style={s.since}>Katılma: {new Date(user.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</p>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          <div style={s.statBox}>
            <span style={s.statNum}>{totalGames}</span>
            <span style={s.statLabel}>Oyun</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statNum}>{totalAnswered}</span>
            <span style={s.statLabel}>Cevap verdi</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statNum}>
              {totalAnswered > 0
                ? Math.round(rounds.reduce((acc, r) => {
                    const correct = r.scores.filter((sc) => sc.points >= 10).length;
                    const total   = r.scores.length;
                    return acc + (total > 0 ? correct / total : 0);
                  }, 0) / totalAnswered * 100)
                : 0}%
            </span>
            <span style={s.statLabel}>Doğruluk</span>
          </div>
        </div>

        {/* Seni en iyi tanıyanlar */}
        {topGuessers.length > 0 && (
          <div style={s.section}>
            <p style={s.sectionTitle}>
              {isMe ? "Seni en iyi kim tanıyor?" : `${displayName}'ı en iyi kim tanıyor?`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {topGuessers.map((g, i) => (
                <div key={g.id} style={s.guesserRow}>
                  <span style={s.rank}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                  <span style={{ flex: 1, color: "var(--fg-primary)", fontWeight: 600 }}>{g.name}</span>
                  <span style={{ color: "var(--fg-secondary)", fontSize: "0.8rem" }}>{g.correct}/{g.total}</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700, minWidth: 42, textAlign: "right" }}>{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Son cevaplar */}
        {rounds.length > 0 && (
          <div style={s.section}>
            <p style={s.sectionTitle}>Son cevaplar</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {rounds.slice(0, 8).map((r) => (
                <div key={r.id} style={s.answerCard}>
                  <p style={s.qText}>{r.question.text}</p>
                  <p style={s.aText}>{r.answers[0]?.content ?? "—"}</p>
                  <p style={s.aScore}>
                    {r.scores.filter((sc) => sc.points >= 10).length}/{r.scores.length} kişi bildi
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <a href="/" style={s.homeBtn}>← Ana Sayfa</a>
      </div>
    </main>
  );
}

const s = {
  page:         { minHeight: "100dvh", background: "var(--bg-base)", padding: "1.25rem 1rem 3rem" },
  inner:        { maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: "1.25rem" },

  header:       { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.4rem", textAlign: "center" as const },
  avatar:       { width: 72, height: 72, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "2rem" },
  name:         { color: "var(--fg-primary)", fontSize: "1.4rem", fontWeight: 800 },
  meBadge:      { background: "var(--accent)", color: "#fff", borderRadius: 6, padding: "0.1rem 0.5rem", fontSize: "0.72rem", fontWeight: 700 },
  since:        { color: "var(--fg-secondary)", fontSize: "0.78rem" },

  statsRow:     { display: "flex", gap: "0.6rem" },
  statBox:      { flex: 1, background: "var(--bg-elevated)", borderRadius: 12, padding: "0.85rem", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.2rem" },
  statNum:      { color: "var(--accent)", fontWeight: 800, fontSize: "1.6rem", lineHeight: 1 },
  statLabel:    { color: "var(--fg-secondary)", fontSize: "0.72rem", textAlign: "center" as const },

  section:      { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  sectionTitle: { color: "var(--fg-secondary)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em" },

  guesserRow:   { display: "flex", alignItems: "center", gap: "0.6rem", background: "var(--bg-elevated)", borderRadius: 10, padding: "0.6rem 0.85rem" },
  rank:         { fontSize: "1.1rem", width: 26, textAlign: "center" as const },

  answerCard:   { background: "var(--bg-elevated)", borderRadius: 10, padding: "0.65rem 0.85rem", display: "flex", flexDirection: "column" as const, gap: "0.2rem" },
  qText:        { color: "var(--fg-secondary)", fontSize: "0.78rem" },
  aText:        { color: "var(--fg-primary)", fontWeight: 600, fontSize: "0.95rem" },
  aScore:       { color: "var(--fg-muted)", fontSize: "0.72rem" },

  homeBtn:      { display: "block", background: "var(--bg-elevated)", color: "var(--fg-primary)", border: "1px solid var(--fg-muted)", borderRadius: 12, padding: "0.75rem", textAlign: "center" as const, textDecoration: "none", fontSize: "0.9rem" },
};
