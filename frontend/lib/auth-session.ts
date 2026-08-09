export const AUTH_SESSION_COOKIE = "argos_session";

const MAX_AGE_S = 60 * 60 * 24 * 7;

export function setAuthSessionCookie(): void {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${AUTH_SESSION_COOKIE}=1; path=/; max-age=${MAX_AGE_S}; samesite=lax${secure}`;
}

export function clearAuthSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0`;
}

export function syncAuthSessionCookieFromStorage(): void {
  if (typeof window === "undefined") return;
  const token = window.localStorage.getItem("token");
  if (token) setAuthSessionCookie();
  else clearAuthSessionCookie();
}
