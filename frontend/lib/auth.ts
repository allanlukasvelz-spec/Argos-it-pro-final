import { create } from "zustand";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export type AuthUser = {
  email?: string;
  company?: string;
  name?: string;
  clientVerified?: boolean;
};

interface AuthState {
  authenticated: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: typeof document !== "undefined"
    ? document.cookie.includes("argos_session=1")
    : false,
  user: null,

  login: (user) => {
    set({ authenticated: true, user });
  },

  logout: () => {
    set({ authenticated: false, user: null });

    (async () => {
      try {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // Network error — cookies may already be cleared by server
      }
    })();
  },
}));
