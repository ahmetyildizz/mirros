import { create } from "zustand";

export type GameState =
  | "WAITING"
  | "ANSWERING"
  | "GUESSING"
  | "SCORING"
  | "INSIGHT"
  | "END";

export type MatchLevel = "EXACT" | "CLOSE" | "WRONG";

export interface ScoreResult {
  roundId: string;
  matchLevel: MatchLevel;
  points: number;
}

interface GameStore {
  gameId: string | null;
  roomId: string | null;
  roomCode: string | null;
  isHostPlayer: boolean | null;
  currentRound: number;
  state: GameState;
  question: { id: string; text: string; category: string } | null;
  myRole: "answerer" | "guesser" | null;
  scores: ScoreResult[];
  insight: string | null;
  familiarity: number;

  activeRoundId: string | null;

  setGameId: (id: string) => void;
  setRoomId: (id: string) => void;
  setRoomCode: (code: string) => void;
  setIsHostPlayer: (v: boolean) => void;
  setGameState: (state: GameState) => void;
  setCurrentRound: (n: number) => void;
  setActiveRoundId: (id: string) => void;
  setQuestion: (q: GameStore["question"]) => void;
  setMyRole: (role: GameStore["myRole"]) => void;
  addScore: (score: ScoreResult) => void;
  setInsight: (text: string) => void;
  setFamiliarity: (score: number) => void;
  reset: () => void;
}

const initialState = {
  gameId: null,
  roomId: null,
  roomCode: null,
  isHostPlayer: null,
  currentRound: 0,
  activeRoundId: null,
  state: "WAITING" as GameState,
  question: null,
  myRole: null,
  scores: [],
  insight: null,
  familiarity: 0,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  setGameId:        (gameId) => set({ gameId }),
  setRoomId:        (roomId) => set({ roomId }),
  setRoomCode:      (roomCode) => set({ roomCode }),
  setIsHostPlayer:  (isHostPlayer) => set({ isHostPlayer }),
  setGameState:    (state) => set({ state }),
  setCurrentRound: (currentRound) => set({ currentRound }),
  setActiveRoundId:(activeRoundId) => set({ activeRoundId }),
  setQuestion:     (question) => set({ question }),
  setMyRole:       (myRole) => set({ myRole }),
  addScore:        (score) => set((s) => ({ scores: [...s.scores, score] })),
  setInsight:      (insight) => set({ insight }),
  setFamiliarity:  (familiarity) => set({ familiarity }),
  reset:           () => set(initialState),
}));
