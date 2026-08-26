/**
 * E2E environment helpers — staging-safe (does not enable dangerous API flags).
 */
export const BACKEND = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";
export const ORIGIN = process.env.E2E_ORIGIN || "http://127.0.0.1:3000";
export const isStagingE2e = process.env.E2E_STAGING === "1";

let fwdCounter = 0;

/** Unique X-Forwarded-For for staging E2E auth isolation without enabling /api/test reset. */
export function e2eAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { Origin: ORIGIN, ...extra };
  if (isStagingE2e) {
    fwdCounter = (fwdCounter % 250) + 1;
    headers["X-Forwarded-For"] = `203.0.113.${fwdCounter}`;
  }
  return headers;
}
