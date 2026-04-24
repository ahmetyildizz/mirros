import { create } from "zustand";

interface SocialState {
  onlineUsers: string[]; // List of user IDs
  setOnlineUsers: (users: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
}

export const useSocialStore = create<SocialState>((set) => ({
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (userId) => set((state) => ({ 
    onlineUsers: state.onlineUsers.includes(userId) ? state.onlineUsers : [...state.onlineUsers, userId] 
  })),
  removeOnlineUser: (userId) => set((state) => ({ 
    onlineUsers: state.onlineUsers.filter(id => id !== userId) 
  })),
}));
