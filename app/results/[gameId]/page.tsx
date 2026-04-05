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

  // Uyumluluk skoru: her sosyal round'da answerer'ı kim kaç puan aldı
  // answerer için: kaç tahminci onu bilebildi → uyumluluk puanı
  const compatMap: Record<string, { knownBy: { userId: string; username: string; points: number }[]; total: number; max: number }> = {};
  if (game.room.gameMode === "SOCIAL") {
    for (const round of game.rounds) {
      if (!round.answererId) continue;
      const answerer = game.room.participants.find((p) => p.userId === round.answererId);
      if (!answerer) continue;
      const key = round.answererId;
      if (!compatMap[key]) compatMap[key] = { knownBy: [], total: 0, max: 0 };
      for (const sc of round.scores) {
        compatMap[key].total += sc.points;
        compatMap[key].max   += 10;
        const guesser = game.room.participants.find((p) => p.userId === sc.guesserId);
        const existing = compatMap[key].knownBy.find((x) => x.userId === sc.guesserId);
        if (existing) {
          existing.points += sc.points;
        } else {
          compatMap[key].knownBy.push({ userId: sc.guesserId, username: guesser?.user.username ?? guesser?.user.email ?? "?", points: sc.points });
        }
      }
    }
  }

  // Hafıza mekaniği: bu oyundaki cevapların daha önceki versiyonlarını bul
  const currentQuestionIds = game.rounds.map((r) => r.questionId);
  const previousAnswers = await db.answer.findMany({
    where: {
      userId: myId,
      round: {
        questionId: { in: currentQuestionIds },
        // Sadece bu oyundan önceki oyunlardaki cevapları al
        game: { startedAt: { lt: game.startedAt }, room: { gameMode: "SOCIAL" } },
      },
    },
    select: { round: { select: { questionId: true } }, content: true, submittedAt: true },
    orderBy: { submittedAt: "desc" },
  });
  // questionId → en son eski cevap map'i
  const pastAnswerMap = new Map<string, { content: string; at: Date }>();
  for (const a of previousAnswers) {
    const qId = a.round.questionId;
    if (!pastAnswerMap.has(qId)) {
      pastAnswerMap.set(qId, { content: a.content, at: a.submittedAt });
    }
  }

  // En komik an: en çok yanlış tahmin yapılan round
  const funniestRound = game.rounds.reduce<typeof game.rounds[0] | null>((best, r) => {
    const wrongCount = r.scores.filter((sc) => sc.matchLevel === "WRONG").length;
    const bestWrong  = best ? best.scores.filter((sc) => sc.matchLevel === "WRONG").length : -1;
    return wrongCount > bestWrong ? r : best;
  }, null);

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
              const answer       = round.answers[0];
              const answererName = answer?.user.username ?? answer?.user.email ?? "?";
              const pastAnswer   = pastAnswerMap.get(round.questionId);
              const monthsAgo    = pastAnswer
                ? Math.max(1, Math.round((Date.now() - pastAnswer.at.getTime()) / (1000 * 60 * 60 * 24 * 30)))
                : null;
              const myAnswer     = round.answers.find((a) => a.user.id === myId);
              const changed      = pastAnswer && myAnswer && pastAnswer.content !== myAnswer.content;
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
                  {pastAnswer && myAnswer && (
                    <div style={s.memoryBox}>
                      <span style={s.memoryLabel}>🕰️ {monthsAgo} ay önce demiştin</span>
                      <span style={s.memoryText}>"{pastAnswer.content}"</span>
                      {changed && <span style={s.memoryChange}>Cevabın değişmiş!</span>}
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

        {/* Uyumluluk Skoru (sadece social mod) */}
        {Object.keys(compatMap).length > 0 && (
          <div style={s.section}>
            <p style={s.sectionTitle}>Seni en iyi kim tanıyor?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {Object.entries(compatMap).map(([uid, data]) => {
                const answerer  = game.room.participants.find((p) => p.userId === uid);
                const answName  = answerer?.user.username ?? answerer?.user.email ?? "?";
                const pct       = data.max > 0 ? Math.round((data.total / data.max) * 100) : 0;
                const bestGuesser = [...data.knownBy].sort((a, b) => b.points - a.points)[0];
                return (
                  <div key={uid} style={s.compatCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem" }}>{answName}</span>
                      <span style={{ color: "var(--fg-secondary)", fontSize: "0.8rem" }}>{pct}% doğruluk</span>
                    </div>
                    <div style={{ height: 5, background: "var(--bg-base)", borderRadius: 3, overflow: "hidden", marginBottom: "0.4rem" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 3 }} />
                    </div>
                    {bestGuesser && (
                      <span style={{ color: "var(--fg-secondary)", fontSize: "0.78rem" }}>
                        En iyi tanıyan: <strong style={{ color: "var(--fg-primary)" }}>{bestGuesser.username}</strong> ({bestGuesser.points} pt)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={s.actions}>
          <ShareButton
            familiarity={familiarity}
            gameId={gameId}
            funniestQuestion={funniestRound?.question.text}
            funniestAnswer={funniestRound?.answers[0]?.content}
          />
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

  compatCard:   { background: "var(--bg-elevated)", borderRadius: 12, padding: "0.75rem 0.9rem" },
  memoryBox:    { background: "#1a1a2e", border: "1px solid #3b3b6b", borderRadius: 8, padding: "0.5rem 0.75rem", marginTop: "0.35rem", display: "flex", flexDirection: "column" as const, gap: "0.15rem" },
  memoryLabel:  { color: "#8888cc", fontSize: "0.7rem" },
  memoryText:   { color: "#c8c8f0", fontSize: "0.85rem", fontStyle: "italic" as const },
  memoryChange: { color: "#a78bfa", fontSize: "0.72rem", fontWeight: 600 },
  actions:      { display: "flex", flexDirection: "column" as const, gap: "0.6rem", paddingTop: "0.5rem" },
  newGame:      { display: "block", background: "var(--bg-elevated)", color: "var(--fg-primary)", border: "1px solid var(--fg-muted)", borderRadius: 12, fontWeight: 600, padding: "0.85rem", textAlign: "center" as const, textDecoration: "none", fontSize: "0.95rem" },
};
