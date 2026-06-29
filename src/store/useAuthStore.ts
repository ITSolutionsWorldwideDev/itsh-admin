//  src/store/useAuthStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setUser: (user: User, token: string) => void;
  syncFromSession: () => Promise<void>;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      setUser: (user, token) => set({ user, token, isAuthenticated: true }),

      syncFromSession: async () => {
        try {
          const res = await fetch("/api/auth/session", {
            credentials: "include",
          });

          if (res.ok) {
            const data = await res.json();
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              hasHydrated: true,
            });
            return;
          }
        } catch {
          // fall through
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          hasHydrated: true,
        });
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        // this runs once rehydration finishes
        state?.setHasHydrated(true);
      },
    },
  ),
);
