import { BACKEND, ORIGIN, isStagingE2e } from "./e2eEnv";

/**
 * Clears in-memory rate-limit counters when the test-only endpoint is mounted.
 * Staging intentionally omits the endpoint — soft-skip when E2E_STAGING=1.
 */
export async function resetAuthRateLimits(): Promise<void> {
  const res = await fetch(`${BACKEND}/api/test/reset-rate-limits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN
    }
  });
  if (res.status === 404) {
    if (isStagingE2e) {
      console.warn(
        "[e2e] staging: rate-limit reset unavailable (expected). Using X-Forwarded-For isolation."
      );
      return;
    }
    throw new Error(
      "Rate-limit reset endpoint missing. Restart backend with ARGOS_ALLOW_RATE_LIMIT_RESET=1 and NODE_ENV=test|development."
    );
  }
  if (!res.ok) {
    throw new Error(`Rate-limit reset failed: HTTP ${res.status}`);
  }
}
