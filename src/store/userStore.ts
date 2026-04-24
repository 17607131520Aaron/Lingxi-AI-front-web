import { create } from "zustand";

interface UserState {
  username: string;
  setUser: (username: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  username: "",
  setUser: (username) => set({ username }),
  clearUser: () => set({ username: "" }),
}));
