import { create } from "zustand";
import {
  clearAuthSessionCookie,
  setAuthSessionCookie,
  syncAuthSessionCookieFromStorage
} from "@/lib/auth-session";

const REFRESH_STORAGE_KEY = "refreshToken";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export type AuthUser = {
  email?: string;
  company?: string;
  name?: string;
  clientVerified?: boolean;
};

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser, refreshToken?: string | null) => void;
  /** Tras POST /api/auth/refresh: actualiza access (y refresh rotado si viene en la respuesta). */
  applyTokenRefresh: (accessToken: string, newRefreshToken?: string) => void;
  logout: () => void;
}

function clearLocal() {
  localStorage.removeItem("token");
  localStorage.removeItem(REFRESH_STORAGE_KEY);
  clearAuthSessionCookie();
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  login: (token, user, refreshToken) => {
    localStorage.setItem("token", token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_STORAGE_KEY);
    }
    setAuthSessionCookie();
    set({ token, user });
  },
  applyTokenRefresh: (accessToken, newRefreshToken) => {
    localStorage.setItem("token", accessToken);
    if (newRefreshToken) {
      localStorage.setItem(REFRESH_STORAGE_KEY, newRefreshToken);
    }
    setAuthSessionCookie();
    set({ token: accessToken });
  },
  logout: () => {
    const rt = localStorage.getItem(REFRESH_STORAGE_KEY);
    clearLocal();
    set({ token: null, user: null });

    if (rt) {
      fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt })
      }).catch(() => {});
    }
  }
}));

if (typeof window !== "undefined") {
  syncAuthSessionCookieFromStorage();
}
