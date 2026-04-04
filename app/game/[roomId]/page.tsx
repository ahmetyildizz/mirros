"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game.store";
import { useGameState } from "@/hooks/useGameState";

import { GameHeader }   from "@/components/game/GameHeader";
import { QuestionCard } from "@/components/game/QuestionCard";
import { AnswerInput }  from "@/components/game/AnswerInput";
import { GuessInput }   from "@/components/game/GuessInput";
import { Button }       from "@/components/ui/button";

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router     = useRouter();

  const {
    gameId, state, question, myRole, answererId,
    players, playerScores, lastRoundScore,
    currentRound, totalRounds, activeRoundId,
    guessCount, totalGuessers,
    setGameState, setMyRole, setAnswererId,
  } = useGameStore();

  const [myUserId, setMyUserId] = useState<string | null>(null);

  // userId yükle + myRole belirle
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setMyUserId(data.id);
        // answererId zaten store'da, karşılaştır
        const currentAnswererId = useGameStore.getState().answererId;
        setMyRole(currentAnswererId === data.id ? "answerer" : "guesser");
      })
      .catch(() => {});
  }, [setMyRole]);

  // answererId değişince myRole güncelle
  useEffect(() => {
    if (!myUserId || !answererId) return;
    setMyRole(answererId === myUserId ? "answerer" : "guesser");
  }, [answererId, myUserId, setMyRole]);

  useGameState(gameId ?? "", myUserId ?? "");

  useEffect(() => {
    if (!gameId) router.replace("/");
  }, [gameId, router]);

  if (!gameId || !question) {
    return (
      <main style={styles.center}>
        <p style={{ color: "var(--fg-secondary)" }}>Oyun yükleniyor...</p>
      </main>
    );
  }

  const spotlightPlayer = players.find((p) => p.id === answererId);
  const isAnswerer      = myRole === "answerer";

  async function submitAnswer(content: string) {
    if (!activeRoundId) return;
    await fetch(`/api/rounds/${activeRoundId}/answer`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async function submitGuess(content: string) {
    if (!activeRoundId) return;
    await fetch(`/api/rounds/${activeRoundId}/guess`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async function triggerScore() {
    if (!activeRoundId) return;
    await fetch(`/api/rounds/${activeRoundId}/score`, { method: "POST" });
  }

  return (
    <main style={styles.page}>
      <GameHeader roundNumber={currentRound} totalRounds={totalRounds} />

      {/* Spotlight göstergesi */}
      <div style={styles.spotlight}>
        <span style={styles.spotlightLabel}>Soru:</span>
        <span style={styles.spotlightName}>
          {isAnswerer ? "Sen" : (spotlightPlayer?.username ?? "?")}
        </span>
      </div>

      {/* Oyuncu skorları */}
      <div style={styles.scoreBar}>
        {players.map((p) => (
          <div key={p.id} style={styles.scoreItem}>
            <div style={{
              ...styles.scoreAvatar,
              background: p.id === answererId ? "var(--accent)" : "var(--bg-elevated)",
              color: p.id === answererId ? "#fff" : "var(--fg-secondary)",
            }}>
              {(p.username ?? "?")[0].toUpperCase()}
            </div>
            <span style={styles.scoreNum}>{playerScores[p.id] ?? 0}</span>
          </div>
        ))}
      </div>

      <div style={styles.content}>
        <QuestionCard
          text={question.text}
          category={question.category}
          roundNumber={currentRound}
        />

        {/* ANSWERING */}
        {state === "ANSWERING" && (
          isAnswerer
            ? <AnswerInput onSubmit={submitAnswer} />
            : <div style={styles.waitBox}>
                <p style={styles.waitText}>
                  <strong>{spotlightPlayer?.username ?? "Spotlight oyuncu"}</strong> cevaplıyor...
                </p>
              </div>
        )}

        {/* GUESSING */}
        {state === "GUESSING" && (
          isAnswerer
            ? (
              <div style={styles.waitBox}>
                <p style={styles.waitText}>Diğerleri tahmin ediyor...</p>
                <div style={styles.guessProgress}>
                  {Array.from({ length: totalGuessers }).map((_, i) => (
                    <div key={i} style={{
                      ...styles.progressDot,
                      background: i < guessCount ? "var(--exact)" : "var(--bg-elevated)",
                    }} />
                  ))}
                  <span style={{ color: "var(--fg-secondary)", fontSize: "0.8rem" }}>
                    {guessCount}/{totalGuessers}
                  </span>
                </div>
                {guessCount >= totalGuessers && (
                  <Button onClick={triggerScore} style={styles.nextBtn}>
                    Sonuçları Gör
                  </Button>
                )}
              </div>
            )
            : <GuessInput
                opponentName={spotlightPlayer?.username ?? "Spotlight oyuncu"}
                onSubmit={submitGuess}
              />
        )}

        {/* SCORING */}
        {state === "SCORING" && lastRoundScore && (
          <div style={styles.scoringBox}>
            <div style={styles.answerReveal}>
              <span style={styles.answerLabel}>Gerçek cevap</span>
              <span style={styles.answerText}>{lastRoundScore.answer}</span>
            </div>

            <div style={styles.guessList}>
              {lastRoundScore.guessResults.map((g) => (
                <div key={g.userId} style={{
                  ...styles.guessRow,
                  borderColor: g.matchLevel === "EXACT" ? "var(--exact)"
                              : g.matchLevel === "CLOSE" ? "var(--close)"
                              : "var(--bg-elevated)",
                }}>
                  <div style={styles.guessAvatar}>
                    {(g.username ?? "?")[0].toUpperCase()}
                  </div>
                  <div style={styles.guessInfo}>
                    <span style={styles.guessUsername}>{g.username}</span>
                    <span style={styles.guessText}>{g.guess}</span>
                  </div>
                  <div style={styles.guessPoints}>
                    <span style={{
                      color: g.matchLevel === "EXACT" ? "var(--exact)"
                           : g.matchLevel === "CLOSE" ? "var(--close)"
                           : "var(--fg-muted)",
                      fontWeight: 700,
                    }}>
                      {g.matchLevel === "EXACT" ? "+10" : g.matchLevel === "CLOSE" ? "+5" : "0"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {isAnswerer && (
              <Button
                onClick={() => setGameState("ANSWERING")}
                style={styles.nextBtn}
              >
                Sonraki Round
              </Button>
            )}
            {!isAnswerer && (
              <p style={{ color: "var(--fg-secondary)", textAlign: "center", fontSize: "0.85rem" }}>
                Spotlight oyuncu sonraki soruya geçiyor...
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  page:          { minHeight: "100dvh", background: "var(--bg-base)", padding: "1rem", display: "flex", flexDirection: "column" as const },
  center:        { minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" },
  content:       { flex: 1, display: "flex", flexDirection: "column" as const, gap: "1rem", paddingTop: "0.75rem" },
  spotlight:     { display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", background: "var(--bg-elevated)", borderRadius: 8, marginBottom: "0.25rem" },
  spotlightLabel:{ color: "var(--fg-secondary)", fontSize: "0.8rem" },
  spotlightName: { color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem" },
  scoreBar:      { display: "flex", gap: "0.75rem", overflowX: "auto" as const, paddingBottom: "0.25rem" },
  scoreItem:     { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.2rem", minWidth: 40 },
  scoreAvatar:   { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" },
  scoreNum:      { color: "var(--fg-primary)", fontSize: "0.75rem", fontWeight: 600 },
  waitBox:       { background: "var(--bg-elevated)", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "1rem" },
  waitText:      { color: "var(--fg-secondary)", textAlign: "center" as const, fontSize: "0.9rem" },
  guessProgress: { display: "flex", alignItems: "center", gap: "0.4rem" },
  progressDot:   { width: 10, height: 10, borderRadius: "50%", transition: "background 0.3s" },
  nextBtn:       { background: "var(--accent)", color: "#fff", borderRadius: 12, fontWeight: 600, padding: "0.875rem", width: "100%" },
  scoringBox:    { display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
  answerReveal:  { background: "var(--bg-elevated)", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column" as const, gap: "0.25rem" },
  answerLabel:   { color: "var(--fg-secondary)", fontSize: "0.75rem" },
  answerText:    { color: "var(--exact)", fontWeight: 700, fontSize: "1.2rem" },
  guessList:     { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  guessRow:      { display: "flex", alignItems: "center", gap: "0.6rem", background: "var(--bg-elevated)", borderRadius: 10, padding: "0.6rem 0.75rem", border: "1px solid" },
  guessAvatar:   { width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 },
  guessInfo:     { flex: 1, display: "flex", flexDirection: "column" as const, gap: "0.1rem" },
  guessUsername: { color: "var(--fg-secondary)", fontSize: "0.75rem" },
  guessText:     { color: "var(--fg-primary)", fontSize: "0.9rem", fontWeight: 500 },
  guessPoints:   { fontSize: "1rem" },
};
