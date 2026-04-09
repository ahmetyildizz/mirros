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
  totalGuessers?:    number;
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
  guessResults: (GuessResult & { reason?: string | null; streak?: number })[];
  playerScores: Record<string, number>;
  penalty?:     string | null;
  nextRound?: {
    id:               string;
    number:           number;
    questionId:       string;
    questionText:     string;
    questionCategory: string;
    questionOptions:  string[] | null;
    answererId:       string | null;
  } | null;
}

interface GameFinishedPayload {
  gameId:       string;
  playerScores: Record<string, number>;
}

interface PlayerJoinedPayload {
  userId:    string;
  username:  string;
  avatarUrl?: string | null;
  players:   Player[];
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
        // totalGuessers'ı sıfırla ki UI 0/0 göstermesin
        setGuessProgress(0, data.totalGuessers ?? 0);
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

      // Update streaks in players list
      const store = useGameStore.getState();
      const updatedPlayers = store.players.map(p => {
        const res = data.guessResults.find(gr => gr.userId === p.id);
        if (res && res.streak !== undefined) {
          return { ...p, streak: res.streak };
        }
        return p;
      });
      setPlayers(updatedPlayers);

      setPlayerScores(data.playerScores);
      setLastPenalty(data.penalty ?? null);

      // Eğer bir sonraki round bilgisi de geldiyse (pipelined), direkt geç
      if (data.nextRound) {
        const next = data.nextRound;
        setActiveRoundId(next.id);
        setCurrentRound(next.number);
        setAnswererId(next.answererId ?? null);
        setMyRole(next.answererId ? (next.answererId === myUserId ? "answerer" : "guesser") : "guesser");
        setGuessProgress(0, 0);
        setQuestion({ id: next.questionId, text: next.questionText, category: next.questionCategory, options: next.questionOptions });
        setGameState("ANSWERING");
      } else {
        setGameState("SCORING");
      }
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

    channel.bind("game-started", (data: any) => {
      // Verileri store'a yaz ve UI'ın GamePage üzerinden render olmasını sağla
      useGameStore.getState().hydrate({
        gameId:        data.gameId,
        gameMode:      data.gameMode,
        state:         "ANSWERING",
        currentRound:  1,
        totalRounds:   data.totalRounds,
        activeRoundId: data.roundId,
        answererId:    data.answererId,
        question: {
          id:       data.questionId,
          text:     data.questionText,
          category: data.questionCategory,
          options:  data.questionOptions
        },
        players:       data.players
      });
      // Not: URL zaten /game/[roomId] ise GamePage içindeki veri kurtarma (hydrate) çalışacaktır.
      // Bu event sadece lobi ekranında bekleyenlerin anlık geçişini hızlandırır.
    });

    channel.bind("reaction-received", (data: { userId: string; username: string; emoji: string }) => {
      // Dispatch a custom event to show reaction in GamePage
      window.dispatchEvent(new CustomEvent("mirros-reaction", { detail: data }));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, setPlayers]);
}
