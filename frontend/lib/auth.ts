import { create } from "zustand";
import {
  clearAuthSessionCookie,
  setAuthSessionCookie,
  syncAuthSessionCookieFromStorage
} from "@/lib/auth-session";

export type AuthUser = {
  email?: string;
  company?: string;
  name?: string;
};

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  login: (token, user) => {
    localStorage.setItem("token", token);
    setAuthSessionCookie();
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    clearAuthSessionCookie();
    set({ token: null, user: null });
  }
}));

if (typeof window !== "undefined") {
  syncAuthSessionCookieFromStorage();
}
