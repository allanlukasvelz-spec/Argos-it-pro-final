/**
 * Playwright global setup — reset auth rate-limit counters before E2E when available.
 * Staging intentionally omits the endpoint; soft-skip (see E2E_STAGING=1).
 */
async function globalSetup() {
  const backend = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3000";
  try {
    const res = await fetch(`${backend}/api/test/reset-rate-limits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin }
    });
    if (res.status === 404) {
      console.warn(
        "[e2e] rate-limit reset unavailable (staging fail-closed or flag unset)"
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
