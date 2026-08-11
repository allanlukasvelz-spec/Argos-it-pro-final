import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const API = axios.create({
  baseURL,
  withCredentials: true,
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        await axios.post(
          `${baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

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
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        const { useAuthStore } = await import("@/lib/auth");
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
      return API(orig);
    } catch {
      const { useAuthStore } = await import("@/lib/auth");
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }
  }
);

export default API;
