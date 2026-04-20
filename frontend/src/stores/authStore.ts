import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (patch: Partial<User>) => void;
  clearAuth: () => void;
  setInitializing: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: true,
      setAuth: (user, token) => {
        localStorage.setItem("free_mentors_token", token);
        set({ user, token, isAuthenticated: true, isInitializing: false });
      },
      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : null,
        })),
      clearAuth: () => {
        localStorage.removeItem("free_mentors_token");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitializing: false,
        });
      },
      setInitializing: (val) => set({ isInitializing: val }),
    }),
    {
      name: "free-mentors-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
