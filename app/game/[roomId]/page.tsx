"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game.store";
import { useGameState } from "@/hooks/useGameState";

import { GameHeader }           from "@/components/game/GameHeader";
import { QuestionCard }         from "@/components/game/QuestionCard";
import { AnswerInput }          from "@/components/game/AnswerInput";
import { GuessInput }           from "@/components/game/GuessInput";
import { MultipleChoiceInput }  from "@/components/game/MultipleChoiceInput";
import { Button }               from "@/components/ui/button";
import { sounds }               from "@/lib/sounds";

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router     = useRouter();

  const {
    gameId, state, question, myRole, answererId, gameMode,
    players, playerScores, lastRoundScore, lastQuizResults, lastPenalty,
    currentRound, totalRounds, activeRoundId,
    guessCount, totalGuessers,
    setGameState, setMyRole, setAnswererId,
  } = useGameStore();
  const isQuiz = gameMode === "QUIZ";

  const [myUserId, setMyUserId]   = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Race condition önleme: aynı round için birden fazla tetiklemeyi engelle
  const scoringRoundRef  = useRef<string | null>(null);
  const advancingRoundRef = useRef<string | null>(null);

  // userId yükle + myRole belirle
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setMyUserId(data.id);
        const store = useGameStore.getState();
        if (store.gameMode === "QUIZ") {
          setMyRole("guesser"); // quiz'de herkese "guesser" = cevapçı
        } else {
          setMyRole(store.answererId === data.id ? "answerer" : "guesser");
        }
      })
      .catch(() => {});
  }, [setMyRole]);

  // answererId değişince myRole güncelle (sadece social mod)
  useEffect(() => {
    if (isQuiz) return;
    if (!myUserId || !answererId) return;
    setMyRole(answererId === myUserId ? "answerer" : "guesser");
  }, [answererId, myUserId, setMyRole, isQuiz]);

  useGameState(gameId ?? "", myUserId ?? "");

  useEffect(() => {
    // Her durumda oda bilgisini çek ve kontrol et (stale gameId koruması)
    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.activeGameId) {
          // Eğer store'daki gameId farklıysa veya boşsa recovery yap
          if (data.activeGameId !== gameId) {
            recoverGameState(data.activeGameId);
          } else if (gameId) {
            // Aynıysa bile verileri tazele (sayfa yenileme durumu)
            recoverGameState(gameId);
          }
        } else {
          // Aktif oyun yoksa ana sayfaya/lobiye at
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [roomId, router]); // gameId bağımlılığını kaldırdım ki sonsuz döngüye girmesin, mount'ta bir kez kontrol yeterli

  const recoverGameState = async (id: string) => {
    try {
      const res  = await fetch(`/api/games/${id}`);
      const data = await res.json();
      if (data.gameId) {
        useGameStore.getState().hydrate(data);
        // Role'ü hemen güncelle
        if (myUserId) {
          const role = data.gameMode === "QUIZ" ? "guesser" : (data.answererId === myUserId ? "answerer" : "guesser");
          useGameStore.getState().setMyRole(role);
        }
      }
    } catch (e) {
      console.error("Game recovery failed", e);
    }
  };

  // State değişince ses çal
  useEffect(() => {
    if (state === "ANSWERING") sounds.newRound();
    if (state === "GUESSING")  sounds.tick();
  }, [state]);

  // Tüm tahminler gelince skoru otomatik hesapla (answerer)
  // scoringRoundRef guard: aynı round için birden fazla POST /score engellenir
  useEffect(() => {
    if (state !== "GUESSING" || !isAnswerer) return;
    if (guessCount > 0 && guessCount >= totalGuessers) {
      if (activeRoundId && scoringRoundRef.current !== activeRoundId) {
        scoringRoundRef.current = activeRoundId;
        triggerScore();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessCount, totalGuessers]);

  // Scoring sonuçlarına göre ses
  useEffect(() => {
    if (state !== "SCORING") return;
    if (isQuiz && lastQuizResults) {
      const anyCorrect = lastQuizResults.results.some((r) => r.correct);
      anyCorrect ? sounds.exact() : sounds.wrong();
    } else if (!isQuiz && lastRoundScore) {
      const best = lastRoundScore.guessResults.reduce((b, g) => g.points > b ? g.points : b, 0);
      if (best >= 10) sounds.exact();
      else if (best >= 5) sounds.close();
      else sounds.wrong();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Son round sonuçlarını 10sn sonra temizle (ekrandan kaybolsun)
  useEffect(() => {
    if (state === "ANSWERING" && lastRoundScore) {
      const timer = setTimeout(() => {
        useGameStore.getState().setLastRoundScore(null);
        useGameStore.getState().setLastPenalty(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [state, lastRoundScore]);

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

  async function submitGuess(content: string, reason?: string) {
    if (!activeRoundId) return;
    await fetch(`/api/rounds/${activeRoundId}/guess`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, reason }),
    });
  }

  async function triggerScore() {
    if (!activeRoundId) return;
    await fetch(`/api/rounds/${activeRoundId}/score`, { method: "POST" });
  }

  async function advanceToNext() {
    if (!activeRoundId) return;
    // Guard: aynı round için yalnızca bir kez çağrılır (manuel buton + timeout çakışması önlemi)
    if (advancingRoundRef.current === activeRoundId) return;
    advancingRoundRef.current = activeRoundId;
    await fetch(`/api/rounds/${activeRoundId}/next`, { method: "POST" });
  }

  return (
    <main style={styles.page}>
      <GameHeader roundNumber={currentRound} totalRounds={totalRounds} />

      {/* Spotlight göstergesi (sadece social) */}
      {!isQuiz && (
        <div style={styles.spotlight}>
          <span style={styles.spotlightLabel}>Soru:</span>
          <span style={styles.spotlightName}>
            {isAnswerer ? "Sen" : (spotlightPlayer?.username ?? "?")}
          </span>
        </div>
      )}

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
        {/* Her zaman aktif soruyu göster */}
        <QuestionCard
          key={activeRoundId} // Yeni soru gelince animasyon tetiklensin
          text={question.text}
          category={question.category}
          roundNumber={currentRound}
          answererName={!isQuiz && !isAnswerer && state === "GUESSING" ? (spotlightPlayer?.username ?? undefined) : undefined}
        />

        {/* Girdi alanları (ANSWERING/GUESSING) */}
        <div style={styles.inputArea}>
          {state === "ANSWERING" && (
            isQuiz ? (
              question.options
                ? <MultipleChoiceInput options={question.options} onSubmit={submitAnswer} />
                : <AnswerInput onSubmit={submitAnswer} />
            ) : (
              isAnswerer
                ? (question.options
                    ? <MultipleChoiceInput options={question.options} onSubmit={submitAnswer} allowFreeText />
                    : <AnswerInput onSubmit={submitAnswer} />
                  )
                : <div style={styles.waitBox}>
                    <p style={styles.waitText}>
                      <strong>{spotlightPlayer?.username ?? "Spotlight oyuncu"}</strong> cevaplıyor...
                    </p>
                  </div>
            )
          )}

          {!isQuiz && state === "GUESSING" && (
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
                </div>
              )
              : (question.options
                  ? <MultipleChoiceInput options={question.options} onSubmit={submitGuess} allowFreeText showReason />
                  : <GuessInput opponentName={spotlightPlayer?.username ?? "Spotlight oyuncu"} onSubmit={submitGuess} />
                )
          )}
        </div>

        {/* Eski Round Sonuçları (Alt kısımda kalsın) */}
        {!isQuiz && lastRoundScore && (
          <div style={styles.inlineScoring}>
             <p style={styles.inlineScoringTitle}>Önceki Round Sonuçları</p>
             <div style={styles.answerReveal}>
                <span style={styles.answerLabel}>Gerçek cevap</span>
                <span style={styles.answerText}>{lastRoundScore.answer}</span>
              </div>
              <div style={styles.guessList}>
                {lastRoundScore.guessResults.map((g) => (
                  <div key={g.userId} style={{
                    ...styles.guessRow,
                    borderColor: g.matchLevel === "EXACT" ? "var(--exact)" : g.matchLevel === "CLOSE" ? "var(--close)" : "var(--bg-elevated)",
                  }}>
                    <div style={styles.guessAvatar}>{(g.username ?? "?")[0].toUpperCase()}</div>
                    <div style={styles.guessInfo}>
                      <span style={styles.guessUsername}>{g.username}</span>
                      <span style={styles.guessText}>{g.guess}</span>
                    </div>
                    <span style={{ color: g.matchLevel === "EXACT" ? "var(--exact)" : g.matchLevel === "CLOSE" ? "var(--close)" : "var(--fg-muted)", fontWeight: 700, fontSize: "0.85rem" }}>
                      {g.matchLevel === "EXACT" ? "+10" : g.matchLevel === "CLOSE" ? "+5" : "0"}
                    </span>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* Quiz sonuçları (Scoring state'indeysen göster) */}
        {isQuiz && state === "SCORING" && lastQuizResults && (
          <div style={styles.scoringBox}>
             <div style={styles.answerReveal}>
                <span style={styles.answerLabel}>Doğru cevap</span>
                <span style={styles.answerText}>{lastQuizResults.correctAnswer}</span>
              </div>
              <div style={styles.guessList}>
                {lastQuizResults.results.map((r) => (
                  <div key={r.userId} style={{
                    ...styles.guessRow,
                    borderColor: r.correct ? "var(--exact)" : "var(--bg-elevated)",
                  }}>
                    <div style={styles.guessAvatar}>{(r.username ?? "?")[0].toUpperCase()}</div>
                    <div style={styles.guessInfo}>
                      <span style={styles.guessUsername}>{r.username}</span>
                      <span style={styles.guessText}>{r.answer}</span>
                    </div>
                    <span style={{ color: r.correct ? "var(--exact)" : "var(--fg-muted)", fontWeight: 700 }}>
                      {r.correct ? "+10" : "0"}
                    </span>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* Penaltı varsa her zaman gösterilebilir */}
        {lastPenalty && (
          <div style={styles.penaltyBox}>
            <span style={styles.penaltyTitle}>🎭 Ceza!</span>
            <p style={styles.penaltyText}>{lastPenalty}</p>
          </div>
        )}

        {/* Manuel geçiş gerekirse (Sadece yedek olarak) */}
        {state === "SCORING" && !isQuiz && isAnswerer && (
          <Button onClick={() => advanceToNext()} style={styles.nextBtn}>
            Soruyu Bekleme, Geç →
          </Button>
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
  inputArea:     { display: "flex", flexDirection: "column" as const, gap: "1rem", minHeight: "100px" },
  waitBox:       { background: "var(--bg-elevated)", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "1rem" },
  waitText:      { color: "var(--fg-secondary)", textAlign: "center" as const, fontSize: "0.9rem" },
  guessProgress: { display: "flex", alignItems: "center", gap: "0.4rem" },
  progressDot:   { width: 10, height: 10, borderRadius: "50%", transition: "background 0.3s" },
  nextBtn:       { background: "var(--accent)", color: "#fff", borderRadius: 12, fontWeight: 600, padding: "0.875rem", width: "100%" },
  scoringBox:    { display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
  inlineScoring: { marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed var(--border)", display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
  inlineScoringTitle: { color: "var(--fg-secondary)", fontSize: "0.8rem", fontWeight: 600, textAlign: "center" as const },
  answerReveal:  { background: "var(--bg-elevated)", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column" as const, gap: "0.25rem" },
  answerLabel:   { color: "var(--fg-secondary)", fontSize: "0.75rem" },
  answerText:    { color: "var(--exact)", fontWeight: 700, fontSize: "1.2rem" },
  guessList:     { display: "flex", flexDirection: "column" as const, gap: "0.5rem" },
  guessRow:      { display: "flex", alignItems: "center", gap: "0.6rem", background: "var(--bg-elevated)", borderRadius: 10, padding: "0.6rem 0.75rem", border: "1px solid" },
  guessAvatar:   { width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 },
  guessInfo:     { flex: 1, display: "flex", flexDirection: "column" as const, gap: "0.1rem" },
  guessUsername: { color: "var(--fg-secondary)", fontSize: "0.75rem" },
  guessText:     { color: "var(--fg-primary)", fontSize: "0.9rem", fontWeight: 500 },
  penaltyBox:    { background: "#2d1a00", border: "2px solid #f97316", borderRadius: 12, padding: "0.875rem 1rem", display: "flex", flexDirection: "column" as const, gap: "0.3rem" },
  penaltyTitle:  { color: "#f97316", fontWeight: 800, fontSize: "0.95rem" },
  penaltyText:   { color: "#fed7aa", fontSize: "0.9rem", lineHeight: 1.4 },
};
