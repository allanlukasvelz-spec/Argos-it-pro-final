/**
 * E2E environment helpers — staging-safe (does not enable dangerous API flags).
 */
export const BACKEND = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";
export const ORIGIN = process.env.E2E_ORIGIN || "http://127.0.0.1:3000";
export const isStagingE2e = process.env.E2E_STAGING === "1";

let fwdCounter = 0;

/**
 * Staging E2E auth isolation without /api/test reset.
 * Traefik overwrites X-Forwarded-For with the real client IP, so we also send
 * X-Argos-Staging-E2E-Fwd (TEST-NET). Staging API authLimiter keys on that header.
 */
export function e2eAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { Origin: ORIGIN, ...extra };
  if (isStagingE2e) {
    fwdCounter = (fwdCounter % 250) + 1;
    const testNetIp = `203.0.113.${fwdCounter}`;
    headers["X-Forwarded-For"] = testNetIp;
    headers["X-Argos-Staging-E2E-Fwd"] = testNetIp;
  }
  return headers;
}
