import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const API = axios.create({
  baseURL
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const rt = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
        if (!rt) return null;
        const res = await axios.post<{ token: string; refreshToken?: string }>(
          `${baseURL}/api/auth/refresh`,
          { refreshToken: rt },
          { headers: { "Content-Type": "application/json" } }
        );
        const { token, refreshToken: newRt } = res.data;
        localStorage.setItem("token", token);
        if (newRt) {
          localStorage.setItem("refreshToken", newRt);
        }
        const { useAuthStore } = await import("@/lib/auth");
        useAuthStore.getState().applyTokenRefresh(token, newRt);
        return token;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const orig = error.config as RetryableConfig | undefined;
    if (!orig || orig._retry) {
      return Promise.reject(error);
    }
    const url = String(orig.url || "");
    if (url.includes("/api/auth/refresh") || url.includes("/api/auth/login")) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401 || typeof window === "undefined") {
      return Promise.reject(error);
    }

    orig._retry = true;
    try {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        const { useAuthStore } = await import("@/lib/auth");
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
      orig.headers.Authorization = `Bearer ${newToken}`;
      return API(orig);
    } catch {
      const { useAuthStore } = await import("@/lib/auth");
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }
  }
);

export default API;
