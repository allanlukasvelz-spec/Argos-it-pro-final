export const AUTH_SESSION_COOKIE = "argos_session";

export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${AUTH_SESSION_COOKIE}=1`);
}
