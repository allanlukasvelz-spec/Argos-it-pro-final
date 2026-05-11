import { create } from "zustand";
import {
  clearAuthSessionCookie,
  setAuthSessionCookie,
  syncAuthSessionCookieFromStorage
} from "@/lib/auth-session";

const REFRESH_STORAGE_KEY = "refreshToken";

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
    localStorage.removeItem("token");
    localStorage.removeItem(REFRESH_STORAGE_KEY);
    clearAuthSessionCookie();
    set({ token: null, user: null });
  }
}));

if (typeof window !== "undefined") {
  syncAuthSessionCookieFromStorage();
}
