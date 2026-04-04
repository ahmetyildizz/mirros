"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";
import { useGameStore } from "@/store/game.store";
import type { MatchLevel } from "@/store/game.store";

interface RoundStartedPayload {
  roundId:     string;
  roundNumber: number;
  questionId:  string;
  answererId:  string;
  guesserId:   string;
  questionText?: string;
  questionCategory?: string;
}

interface RoundScoredPayload {
  roundId:    string;
  matchLevel: MatchLevel;
  points:     number;
  familiarity: number;
  answer:     string;
  guess:      string;
}

interface GameFinishedPayload {
  gameId:      string;
  familiarity: number;
}

export function useGameState(gameId: string, myUserId: string) {
  const router = useRouter();
  const {
    setGameState,
    setQuestion,
    setMyRole,
    setCurrentRound,
    setActiveRoundId,
    addScore,
    setFamiliarity,
  } = useGameStore();

  useEffect(() => {
    if (!gameId) return;
    const pusher  = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("round-started", (data: RoundStartedPayload) => {
      setGameState("ANSWERING");
      setActiveRoundId(data.roundId);
      setCurrentRound(data.roundNumber);
      // isHostPlayer + round parity → rol (server logic ile eşleşir)
      const isHostTab = useGameStore.getState().isHostPlayer;
      const isOddRound = data.roundNumber % 2 === 1;
      setMyRole(isHostTab === isOddRound ? "answerer" : "guesser");
      if (data.questionText) {
        setQuestion({
          id:       data.questionId,
          text:     data.questionText,
          category: data.questionCategory ?? "",
        });
      }
    });

    channel.bind("answer-submitted", () => {
      setGameState("GUESSING");
    });

    channel.bind("guess-submitted", () => {
      // Scoring tetiklenene kadar bekle — UI loading gösterebilir
    });

    channel.bind("round-scored", (data: RoundScoredPayload) => {
      addScore({ roundId: data.roundId, matchLevel: data.matchLevel, points: data.points });
      setFamiliarity(data.familiarity);
      setGameState("SCORING");
    });

    channel.bind("game-finished", (data: GameFinishedPayload) => {
      setFamiliarity(data.familiarity);
      setGameState("END");
      router.push(`/results/${data.gameId}`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, myUserId, router, setGameState, setQuestion, setMyRole, setCurrentRound, setActiveRoundId, addScore, setFamiliarity]);
}
