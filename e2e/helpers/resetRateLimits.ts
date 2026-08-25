const BACKEND = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";

/**
 * Clears in-memory rate-limit counters on the local/test backend.
 * No-op (with warning) if the test-only endpoint is not mounted.
 */
export async function resetAuthRateLimits(): Promise<void> {
  const res = await fetch(`${BACKEND}/api/test/reset-rate-limits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://127.0.0.1:3000"
    }
  });
  if (res.status === 404) {
    throw new Error(
      "Rate-limit reset endpoint missing. Restart backend with ARGOS_ALLOW_RATE_LIMIT_RESET=1 and NODE_ENV!=production."
    );
  }
  if (!res.ok) {
    throw new Error(`Rate-limit reset failed: HTTP ${res.status}`);
  }
}
