import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type GameState =
  | "WAITING"
  | "ANSWERING"
  | "GUESSING"
  | "SCORING"
  | "END";

export type GameTheme = "purple" | "love" | "warm" | "intel" | "neon";

export type MatchLevel = "EXACT" | "CLOSE" | "WRONG";

export interface Player {
  id:        string;
  username:  string;
  avatarUrl?: string | null;
  role:      "PLAYER" | "SPECTATOR";
  streak:    number;
}

export interface GuessResult {
  userId:    string;
  username:  string;
  guess:     string;
  reason:    string | null;
  matchLevel: MatchLevel;
  points:    number;
}

export interface RoundScore {
  roundId:     string;
  answererId:  string;
  answer:      string;
  winnerId?:   string | null;
  guessResults: GuessResult[];
}

export interface QuizResult {
  userId:   string;
  username: string;
  answer:   string;
  correct:  boolean;
  points:   number;
}

interface GameStore {
  gameId:        string | null;
  roomId:        string | null;
  roomCode:      string | null;
  isHostPlayer:  boolean | null;
  currentRound:  number;
  totalRounds:   number;
  state:         GameState;
  question:      { id: string; text: string; category: string; options: string[] | null } | null;
  myRole:        "answerer" | "guesser" | "spectator" | null;
  activeRoundId: string | null;
  answererId:    string | null;
  gameMode:      "SOCIAL" | "QUIZ" | "EXPOSE" | null;
  theme:         GameTheme;

  // Oyuncular
  players:       Player[];
  playerScores:  Record<string, number>;

  // Round sonuçları
  lastRoundScore:    RoundScore | null;
  lastQuizResults:   { correctAnswer: string; results: QuizResult[] } | null;
  lastPenalty:       string | null;
  nextRoundData:     GameStore["question"] & { id: string; number: number; answererId: string | null } | null;

  // Tahmin durumu
  guessCount:    number;
  totalGuessers: number;

  // Actions
  setGameId:          (id: string) => void;
  setRoomId:          (id: string) => void;
  setRoomCode:        (code: string) => void;
  setIsHostPlayer:    (v: boolean) => void;
  setGameState:       (state: GameState) => void;
  setCurrentRound:    (n: number) => void;
  setTotalRounds:     (n: number) => void;
  setActiveRoundId:   (id: string) => void;
  setQuestion:        (q: GameStore["question"]) => void;
  setMyRole:          (role: GameStore["myRole"]) => void;
  setAnswererId:      (id: string | null) => void;
  setPlayers:         (players: Player[]) => void;
  setPlayerScores:    (scores: Record<string, number>) => void;
  setLastRoundScore:  (score: RoundScore | null) => void;
  setLastQuizResults: (r: GameStore["lastQuizResults"]) => void;
  setLastPenalty:     (p: string | null) => void;
  setGuessProgress:    (count: number, total: number) => void;
  setGameMode:         (mode: "SOCIAL" | "QUIZ" | "EXPOSE") => void;
  setQuestionOptions:  (options: string[]) => void;
  setTheme:            (theme: GameTheme) => void;
  setNextRoundData:    (data: GameStore["nextRoundData"]) => void;
  hydrate:             (data: Partial<GameStore>) => void;
  reset:               () => void;
}

const initialState = {
  gameId:           null,
  roomId:           null,
  roomCode:         null,
  isHostPlayer:     null,
  currentRound:     0,
  totalRounds:      10,
  activeRoundId:    null,
  answererId:       null,
  state:            "WAITING" as GameState,
  question:         null,
  myRole:           null,
  players:          [],
  playerScores:     {},
  lastRoundScore:   null,
  lastQuizResults:  null,
  lastPenalty:      null,
  nextRoundData:    null,
  guessCount:       0,
  totalGuessers:    0,
  gameMode:         null,
  theme:            "purple" as GameTheme,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,
      setGameId:         (gameId) => set({ gameId }),
      setRoomId:         (roomId) => set({ roomId }),
      setRoomCode:       (roomCode) => set({ roomCode }),
      setIsHostPlayer:   (isHostPlayer) => set({ isHostPlayer }),
      setGameState:      (state) => set({ state }),
      setCurrentRound:   (currentRound) => set({ currentRound }),
      setTotalRounds:    (totalRounds) => set({ totalRounds }),
      setActiveRoundId:  (activeRoundId) => set({ activeRoundId }),
      setQuestion:       (question) => set({ question }),
      setMyRole:         (myRole) => set({ myRole }),
      setAnswererId:     (answererId) => set({ answererId }),
      setPlayers:        (players) => set({ players }),
      setPlayerScores:   (playerScores) => set({ playerScores }),
      setLastRoundScore:  (lastRoundScore) => set({ lastRoundScore }),
      setLastQuizResults: (lastQuizResults) => set({ lastQuizResults }),
      setLastPenalty:     (lastPenalty) => set({ lastPenalty }),
      setGuessProgress:   (guessCount, totalGuessers) => set({ guessCount, totalGuessers }),
      setGameMode:        (gameMode) => set({ gameMode }),
      setQuestionOptions: (options) => set((s) => s.question ? { question: { ...s.question, options } } : {}),
      setTheme:           (theme) => set({ theme }),
      setNextRoundData:   (nextRoundData) => set({ nextRoundData }),
      hydrate:           (data) => set((s) => ({ ...s, ...data })),
      reset:             () => set(initialState),
    }),
    {
      name:    "mirros-game",
      storage: createJSONStorage(() => localStorage),
      // Geçici/türetilebilir alanları persist etme
      partialize: (s) => ({
        gameId:       s.gameId,
        roomId:       s.roomId,
        roomCode:     s.roomCode,
        isHostPlayer: s.isHostPlayer,
        gameMode:     s.gameMode,
        players:      s.players,
        currentRound: s.currentRound,
        totalRounds:  s.totalRounds,
        activeRoundId:s.activeRoundId,
        answererId:   s.answererId,
        state:        s.state,
        playerScores: s.playerScores,
        theme:        s.theme,
        question:     s.question,
        myRole:       s.myRole,
        guessCount:   s.guessCount,
        totalGuessers:s.totalGuessers,
      }),
    }
  )
);
