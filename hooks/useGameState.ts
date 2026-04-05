"use client";

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";
import { useGameStore } from "@/store/game.store";
import type { Player, GuessResult, QuizResult } from "@/store/game.store";

interface RoundStartedPayload {
  roundId:           string;
  roundNumber:       number;
  questionId:        string;
  answererId:        string | null;
  questionText?:     string;
  questionCategory?: string;
  questionOptions?:  string[] | null;
}

interface QuizRoundScoredPayload {
  roundId:       string;
  correctAnswer: string;
  results:       QuizResult[];
  playerScores:  Record<string, number>;
  penalty?:      string | null;
}

interface AnswerSubmittedPayload {
  roundId:           string;
  // quiz fields
  userId?:           string;
  answerCount?:      number;
  totalParticipants?:number;
  allAnswered?:      boolean;
  // social fields
  answererId?:       string;
  updatedOptions?:   string[] | null;
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
  penalty?:     string | null;
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
    setLastRoundScore, setLastQuizResults, setGuessProgress, setPlayers,
    setQuestionOptions, setLastPenalty,
  } = useGameStore();

  useEffect(() => {
    if (!gameId) return;
    const pusher  = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("round-started", (data: RoundStartedPayload) => {
      setGameState("ANSWERING");
      setActiveRoundId(data.roundId);
      setCurrentRound(data.roundNumber);
      setAnswererId(data.answererId ?? null);
      setMyRole(data.answererId ? (data.answererId === myUserId ? "answerer" : "guesser") : "guesser");
      setGuessProgress(0, 0);
      if (data.questionText) {
        setQuestion({ id: data.questionId, text: data.questionText, category: data.questionCategory ?? "", options: data.questionOptions ?? null });
      }
    });

    channel.bind("answer-submitted", (data: AnswerSubmittedPayload) => {
      if (data.answererId !== undefined) {
        // SOCIAL: guessing'e geç, varsa güncellenmiş şıkları uygula
        if (data.updatedOptions) setQuestionOptions(data.updatedOptions);
        setGameState("GUESSING");
        return;
      }
      // QUIZ: kaç kişi cevapladı bilgisi güncelle
      setGuessProgress(data.answerCount ?? 0, data.totalParticipants ?? 0);
    });

    channel.bind("quiz-round-scored", (data: QuizRoundScoredPayload) => {
      setLastQuizResults({ correctAnswer: data.correctAnswer, results: data.results });
      setPlayerScores(data.playerScores);
      setLastPenalty(data.penalty ?? null);
      setGameState("SCORING");
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
      setLastPenalty(data.penalty ?? null);
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
      setActiveRoundId, setAnswererId, setPlayerScores, setLastRoundScore, setLastQuizResults,
      setGuessProgress, setPlayers, setQuestionOptions, setLastPenalty]);
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
