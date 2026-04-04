"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game.store";
import { useUserStore } from "@/store/user.store";
import { useGameState } from "@/hooks/useGameState";

import { GameHeader }      from "@/components/game/GameHeader";
import { RoundIndicator }  from "@/components/game/RoundIndicator";
import { QuestionCard }    from "@/components/game/QuestionCard";
import { AnswerInput }     from "@/components/game/AnswerInput";
import { GuessInput }      from "@/components/game/GuessInput";
import { ScoreReveal }     from "@/components/game/ScoreReveal";
import { InsightCard }     from "@/components/insight/InsightCard";
import { Button }          from "@/components/ui/button";

const TOTAL_ROUNDS = 5;

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router     = useRouter();

  const {
    gameId, state, question, myRole,
    scores, insight, familiarity, currentRound, activeRoundId,
    setGameState,
  } = useGameStore();
  const { userId, username, setUser } = useUserStore();

  // userId yoksa yükle (round-started'da rol belirlemek için)
  useEffect(() => {
    if (userId) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setUser({ userId: data.id, username: data.email }))
      .catch(() => {});
  }, [userId, setUser]);

  // Pusher sync
  useGameState(gameId ?? "", userId ?? "");

  // Odaya ait gameId yoksa lobby'e yönlendir
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

  const lastScore = scores[scores.length - 1];
  const isAnswerer = myRole === "answerer";

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
    await fetch(`/api/rounds/${activeRoundId}/score`, { method: "POST" });
  }

  return (
    <main style={styles.page}>
      <GameHeader roundNumber={currentRound} totalRounds={TOTAL_ROUNDS} />
      <RoundIndicator total={TOTAL_ROUNDS} current={currentRound} />

      <div style={styles.content}>
        {/* ANSWERING */}
        {state === "ANSWERING" && (
          <>
            <QuestionCard
              text={question.text}
              category={question.category}
              roundNumber={currentRound}
            />
            {isAnswerer
              ? <AnswerInput onSubmit={submitAnswer} />
              : <p style={styles.waiting}>{username ?? "Karşı taraf"} cevaplıyor...</p>
            }
          </>
        )}

        {/* GUESSING */}
        {state === "GUESSING" && (
          <>
            <QuestionCard
              text={question.text}
              category={question.category}
              roundNumber={currentRound}
            />
            {!isAnswerer
              ? <GuessInput opponentName={username ?? "Karşı oyuncu"} onSubmit={submitGuess} />
              : <p style={styles.waiting}>Karşı taraf tahmin ediyor...</p>
            }
          </>
        )}

        {/* SCORING */}
        {state === "SCORING" && lastScore && (
          <>
            <ScoreReveal
              matchLevel={lastScore.matchLevel}
              answer=""
              guess=""
            />
            <Button
              onClick={() => setGameState("ANSWERING")}
              style={styles.nextBtn}
            >
              Sonraki Round
            </Button>
          </>
        )}

        {/* END */}
        {state === "END" && (
          <>
            {insight && (
              <InsightCard
                text={insight}
                playerA={username ?? "Sen"}
                playerB="Karşı oyuncu"
              />
            )}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <p style={{ color: "var(--accent)", fontSize: "2rem", fontWeight: 800 }}>
                {familiarity}%
              </p>
              <p style={{ color: "var(--fg-secondary)" }}>Tanışıklık Puanı</p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const styles = {
  page:    { minHeight: "100dvh", background: "var(--bg-base)", padding: "1rem", display: "flex", flexDirection: "column" as const },
  center:  { minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" },
  content: { flex: 1, display: "flex", flexDirection: "column" as const, gap: "1.25rem", paddingTop: "1rem" },
  waiting: { color: "var(--fg-secondary)", textAlign: "center" as const, fontSize: "0.9rem", padding: "2rem" },
  nextBtn: { background: "var(--accent)", color: "#fff", borderRadius: 12, fontWeight: 600, padding: "0.875rem", width: "100%" },
};
