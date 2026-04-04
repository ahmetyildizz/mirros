"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";
import { useGameStore } from "@/store/game.store";
import type { Player, GuessResult } from "@/store/game.store";

interface RoundStartedPayload {
  roundId:          string;
  roundNumber:      number;
  questionId:       string;
  answererId:       string;
  questionText?:    string;
  questionCategory?: string;
}

interface GuessSubmittedPayload {
  roundId:       string;
  userId:        string;
  guessCount:    number;
  totalGuessers: number;
  allDone:       boolean;
}

interface RoundScoredPayload {
  roundId:      string;
  answererId:   string;
  answer:       string;
  guessResults: GuessResult[];
  playerScores: Record<string, number>;
}

interface GameFinishedPayload {
  gameId:       string;
  playerScores: Record<string, number>;
}

interface PlayerJoinedPayload {
  userId:   string;
  username: string;
  players:  Player[];
}

export function useGameState(gameId: string, myUserId: string) {
  const router = useRouter();
  const {
    setGameState, setQuestion, setMyRole, setCurrentRound,
    setActiveRoundId, setAnswererId, setPlayerScores,
    setLastRoundScore, setGuessProgress, setPlayers,
  } = useGameStore();

  useEffect(() => {
    if (!gameId) return;
    const pusher  = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("round-started", (data: RoundStartedPayload) => {
      setGameState("ANSWERING");
      setActiveRoundId(data.roundId);
      setCurrentRound(data.roundNumber);
      setAnswererId(data.answererId);
      setMyRole(data.answererId === myUserId ? "answerer" : "guesser");
      setGuessProgress(0, 0);
      if (data.questionText) {
        setQuestion({ id: data.questionId, text: data.questionText, category: data.questionCategory ?? "" });
      }
    });

    channel.bind("answer-submitted", () => {
      setGameState("GUESSING");
    });

    channel.bind("guess-submitted", (data: GuessSubmittedPayload) => {
      setGuessProgress(data.guessCount, data.totalGuessers);
    });

    channel.bind("round-scored", (data: RoundScoredPayload) => {
      setLastRoundScore({
        roundId:      data.roundId,
        answererId:   data.answererId,
        answer:       data.answer,
        guessResults: data.guessResults,
      });
      setPlayerScores(data.playerScores);
      setGameState("SCORING");
    });

    channel.bind("game-finished", (data: GameFinishedPayload) => {
      setPlayerScores(data.playerScores);
      setGameState("END");
      router.push(`/results/${data.gameId}`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, myUserId, router, setGameState, setQuestion, setMyRole, setCurrentRound,
      setActiveRoundId, setAnswererId, setPlayerScores, setLastRoundScore, setGuessProgress, setPlayers]);
}

/** Bekleme odası için: oyuncular listesini dinle */
export function useRoomState(roomId: string) {
  const { setPlayers } = useGameStore();

  useEffect(() => {
    if (!roomId) return;
    const pusher  = getPusherClient();
    const channel = pusher.subscribe(`room-${roomId}`);

    channel.bind("player-joined", (data: PlayerJoinedPayload) => {
      setPlayers(data.players);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, setPlayers]);
}
