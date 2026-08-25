/**
 * Playwright global setup — reset auth rate-limit counters before E2E.
 * Requires backend with ARGOS_ALLOW_RATE_LIMIT_RESET=1 (see playwright.config.ts).
 */
async function globalSetup() {
  const backend = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";
  try {
    const res = await fetch(`${backend}/api/test/reset-rate-limits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:3000" }
    });
    if (res.status === 404) {
      console.warn(
        "[e2e] rate-limit reset unavailable (start backend with ARGOS_ALLOW_RATE_LIMIT_RESET=1)"
      );
      return;
    }
    if (!res.ok) {
      console.warn(`[e2e] rate-limit reset HTTP ${res.status}`);
      return;
    }
    const body = await res.json();
    console.log("[e2e] rate-limit stores reset:", body.storesReset);
  } catch (err) {
    console.warn("[e2e] rate-limit reset skipped:", (err as Error).message);
  }
}

export default globalSetup;
