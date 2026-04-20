"use client";

import { useEffect, useRef } from "react";
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
  // Ref pattern: myUserId her değiştiğinde Pusher'ı yeniden bağlamayı önler.
  // /api/me yüklenmesi sırasındaki kısa unsubscribe/resubscribe penceresinde
  // answer-submitted eventinin kaçırılmasını engeller.
  const myUserIdRef = useRef(myUserId);
  useEffect(() => { myUserIdRef.current = myUserId; }, [myUserId]);

  const {
    setGameState, setQuestion, setMyRole, setCurrentRound,
    setActiveRoundId, setAnswererId, setPlayerScores,
    setLastRoundScore, setLastQuizResults, setGuessProgress, setPlayers,
    setQuestionOptions, setLastPenalty, setNextRoundData,
    setBluffOptions, setBluffAnswers,
  } = useGameStore();

  useEffect(() => {
    if (!gameId) return;
    const pusher  = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("round-started", (data: RoundStartedPayload) => {
      try {
        const store = useGameStore.getState();
        const gameMode = store.gameMode;
        // Global Flow Guard: EXPOSE/QUIZ veya answererId yoksa GUESSING; SPY için ANSWERING
        const nextState = (gameMode === "EXPOSE" || gameMode === "QUIZ" || (!data.answererId && gameMode !== "SPY")) ? "GUESSING" : "ANSWERING";
        console.log("[MIRROS] 🟢 round-started", { round: data.roundNumber, roundId: data.roundId, gameMode, answererId: data.answererId, hasText: !!data.questionText, nextState });
        setActiveRoundId(data.roundId);
        setCurrentRound(data.roundNumber);
        setAnswererId(data.answererId ?? null);
        setNextRoundData(null);
        const activePlayersCount = store.players.filter(p => !p.role || p.role === "PLAYER").length;
        const initialTotal = (gameMode === "EXPOSE" || gameMode === "QUIZ") ? activePlayersCount : 0;
        setGuessProgress(0, initialTotal);

        // Soru verisi geldiyse store'u güncelle (her turda yeni soru göstermek için zorunlu)
        if (data.questionText) {
          setQuestion({
            id:       data.questionId,
            text:     data.questionText,
            category: data.questionCategory ?? store.question?.category ?? "",
            options:  data.questionOptions ?? null,
          });
          setGameState(nextState);
          console.log("[MIRROS] ✅ round-started: soru set edildi, state →", nextState);
        } else {
          // Spy modu veya eksik veri: server'dan çek, hydrate tamamlanınca state geç
          console.log("[MIRROS] ⚠️ round-started: questionText yok, server'dan çekiliyor...");
          fetch(`/api/games/${gameId}`)
            .then(res => res.json())
            .then(freshData => {
              if (freshData.gameId) useGameStore.getState().hydrate(freshData);
              setGameState(nextState);
              console.log("[MIRROS] ✅ round-started: hydrate tamamlandı, state →", nextState);
            })
            .catch(err => {
              console.error("[MIRROS] ❌ round-started: sync failed", err);
              setGameState(nextState);
            });
        }
      } catch (err) {
        console.error("[MIRROS] ❌ round-started handler error:", err);
      }
    });

    channel.bind("answer-submitted", (data: AnswerSubmittedPayload) => {
      try {
        if (data.answererId !== undefined) {
          console.log("[MIRROS] 🟡 answer-submitted (SOCIAL)", { answererId: data.answererId, totalGuessers: data.totalGuessers, hasOptions: !!data.updatedOptions });
          if (data.updatedOptions) setQuestionOptions(data.updatedOptions);
          setGuessProgress(0, data.totalGuessers ?? 0);
          setGameState("GUESSING");
          return;
        }
        console.log("[MIRROS] 🟡 answer-submitted (QUIZ)", { answerCount: data.answerCount, total: data.totalParticipants, allAnswered: data.allAnswered });
        setGuessProgress(data.answerCount ?? 0, data.totalParticipants ?? 0);
      } catch (err) {
        console.error("[MIRROS] ❌ answer-submitted handler error:", err);
      }
    });

    channel.bind("bluff-guessing-started", (data: { roundId: string; options: string[]; authors: { userId: string; username: string }[]; totalGuessers: number }) => {
      try {
        console.log("[MIRROS] 🎭 bluff-guessing-started", { optionCount: data.options.length, totalGuessers: data.totalGuessers });
        setBluffOptions(data.options);
        setBluffAnswers(data.authors);
        setGuessProgress(0, data.totalGuessers);
        setGameState("GUESSING");
      } catch (err) {
        console.error("[MIRROS] ❌ bluff-guessing-started handler error:", err);
      }
    });

    channel.bind("quiz-round-scored", (data: QuizRoundScoredPayload) => {
      try {
        console.log("[MIRROS] 🏆 quiz-round-scored", { correctAnswer: data.correctAnswer, hasNextRound: !!data.nextRound, nextRoundId: data.nextRound?.id });
        setLastQuizResults({ correctAnswer: data.correctAnswer, results: data.results });
        setPlayerScores(data.playerScores);
        setLastPenalty(data.penalty ?? null);
        if (data.nextRound) setNextRoundData(data.nextRound);
        setGameState("SCORING");
      } catch (err) {
        console.error("[MIRROS] ❌ quiz-round-scored handler error:", err);
      }
    });

    channel.bind("guess-submitted", (data: GuessSubmittedPayload) => {
      try {
        console.log("[MIRROS] 🔵 guess-submitted", { guessCount: data.guessCount, totalGuessers: data.totalGuessers, allDone: data.allDone });
        setGuessProgress(data.guessCount, data.totalGuessers);
      } catch (err) {
        console.error("[MIRROS] ❌ guess-submitted handler error:", err);
      }
    });

    channel.bind("round-scored", (data: RoundScoredPayload) => {
      try {
        console.log("[MIRROS] 🏅 round-scored (SOCIAL)", { roundId: data.roundId, answer: data.answer, answererId: data.answererId, hasNextRound: !!data.nextRound, nextRoundId: data.nextRound?.id });
        setAnswererId(data.answererId ?? null);
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
          console.log("[MIRROS] ✅ nextRoundData set:", { id: data.nextRound.id, number: data.nextRound.number });
        } else {
          console.warn("[MIRROS] ⚠️ round-scored: nextRound yok → son tur veya advanceGame hatası");
        }

        // Sadece skor aşamasına geç, yeni round verisi olsa bile (host başlatacak)
        setGameState("SCORING");
      } catch (err) {
        console.error("[MIRROS] ❌ round-scored handler error:", err);
      }
    });

    channel.bind("game-finished", (data: GameFinishedPayload) => {
      try {
        console.log("[MIRROS] 🎉 game-finished", { gameId: data.gameId });
        setPlayerScores(data.playerScores);
        setGameState("END");
        // Mobil cihazda geçiş reklamı göster
        if (Capacitor.isNativePlatform()) {
          AdMobService.showInterstitial();
        }
        router.push(`/results/${data.gameId}`);
      } catch (err) {
        console.error("[MIRROS] ❌ game-finished handler error:", err);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${gameId}`);
    };
  // myUserId kasıtlı olarak dep array dışında — ref üzerinden okunuyor.
  // Böylece /api/me yüklenince Pusher yeniden bağlanmaz, event kaçırılmaz.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, router, setGameState, setQuestion, setMyRole, setCurrentRound,
      setActiveRoundId, setAnswererId, setPlayerScores, setLastRoundScore, setLastQuizResults,
      setGuessProgress, setPlayers, setQuestionOptions, setLastPenalty, setNextRoundData,
      setBluffOptions, setBluffAnswers]);
}

/** Bekleme odası için: oyuncular listesini dinle */
export function useRoomState(roomId: string) {
  const { setPlayers, setGuessProgress } = useGameStore();

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
  }, [roomId, setPlayers, setGuessProgress]);
}
