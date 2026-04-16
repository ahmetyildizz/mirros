"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";
import { useGameStore } from "@/store/game.store";
import type { Player, GuessResult, QuizResult } from "@/store/game.store";
import { Capacitor } from "@capacitor/core";
import { AdMobService } from "@/lib/services/admob.service";

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
  nextRound?:    any; // Host'un ilerleyebilmesi için
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
  winnerId?:    string | null;
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
    setQuestionOptions, setLastPenalty, setNextRoundData,
  } = useGameStore();

  useEffect(() => {
    if (!gameId) return;
    const pusher  = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("round-started", (data: RoundStartedPayload) => {
      const store = useGameStore.getState();
      const gameMode = store.gameMode;
      // Global Flow Guard: gameMode EXPOSE/QUIZ ise veya answererId yoksa başlangıç durumu GUESSING'dir
      const initialState = (gameMode === "EXPOSE" || gameMode === "QUIZ" || !data.answererId) ? "GUESSING" : "ANSWERING";
      setGameState(initialState);
      setActiveRoundId(data.roundId);
      setCurrentRound(data.roundNumber);
      setAnswererId(data.answererId ?? null);
      // EXPOSE'da herkes guesser
      setMyRole(gameMode === "EXPOSE" ? "guesser" : (data.answererId ? (data.answererId === myUserId ? "answerer" : "guesser") : "guesser"));
      
      const totalPlayers = store.players.length;
      const initialTotalGuessers = gameMode === "EXPOSE" ? totalPlayers : (totalPlayers - 1);
      setGuessProgress(0, initialTotalGuessers);
      
      setNextRoundData(null); // Clear pre-loaded next round
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
      if (data.nextRound) setNextRoundData(data.nextRound);
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
        winnerId:     data.winnerId,
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

      if (data.nextRound) {
        setNextRoundData({
          id:       data.nextRound.id,
          text:     data.nextRound.questionText,
          category: data.nextRound.questionCategory,
          options:  data.nextRound.questionOptions,
          number:   data.nextRound.number,
          answererId: data.nextRound.answererId,
        });
      }

      // Sadece skor aşamasına geç, yeni round verisi olsa bile (host başlatacak)
      setGameState("SCORING");
    });

    channel.bind("game-finished", (data: GameFinishedPayload) => {
      setPlayerScores(data.playerScores);
      setGameState("END");
      // Mobil cihazda geçiş reklamı göster
      if (Capacitor.isNativePlatform()) {
        AdMobService.showInterstitial();
      }
      router.push(`/results/${data.gameId}`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, myUserId, router, setGameState, setQuestion, setMyRole, setCurrentRound,
      setActiveRoundId, setAnswererId, setPlayerScores, setLastRoundScore, setLastQuizResults,
      setGuessProgress, setPlayers, setQuestionOptions, setLastPenalty, setNextRoundData]);
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
      
      const store = useGameStore.getState();
      const gameMode = store.gameMode;
      if (store.state === "GUESSING" || store.state === "ANSWERING") {
        const uniquePlayers = Array.from(new Map(data.players.map(p => [p.id, p])).values()).filter(p => p.role === "PLAYER");
        const newTotal = gameMode === "EXPOSE" ? uniquePlayers.length : Math.max(0, uniquePlayers.length - 1);
        setGuessProgress(store.guessCount, newTotal);
      }
    });

    channel.bind("game-started", (data: any) => {
      // Global Flow Guard: gameMode EXPOSE/QUIZ ise veya answererId yoksa başlangıç durumu GUESSING'dir
      const initialState = (data.gameMode === "EXPOSE" || data.gameMode === "QUIZ" || !data.answererId) ? "GUESSING" : "ANSWERING";
      useGameStore.getState().hydrate({
        gameId:        data.gameId,
        gameMode:      data.gameMode,
        state:         initialState,
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
    });

    channel.bind("reaction-received", (data: { userId: string; username: string; emoji: string }) => {
      window.dispatchEvent(new CustomEvent("mirros-reaction", { detail: data }));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, setPlayers]);
}
