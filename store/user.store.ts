import { create } from "zustand";

interface UserStore {
  userId: string | null;
  username: string | null;
  avatarUrl: string | null;
  setUser: (user: { userId: string; username: string; avatarUrl?: string }) => void;
  clear: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userId: null,
  username: null,
  avatarUrl: null,
  setUser: ({ userId, username, avatarUrl }) =>
    set({ userId, username, avatarUrl: avatarUrl ?? null }),
  clear: () => set({ userId: null, username: null, avatarUrl: null }),
}));
