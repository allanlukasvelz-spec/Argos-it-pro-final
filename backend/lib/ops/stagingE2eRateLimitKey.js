/**
 * Staging E2E rate-limit key isolation behind Traefik.
 *
 * Traefik overwrites X-Forwarded-For with the real client IP, so Playwright
 * cannot isolate auth buckets via XFF alone. Staging-only: when the request
 * carries a TEST-NET address in X-Argos-Staging-E2E-Fwd, use that as the
 * rate-limit key. Production never reads this header.
 *
 * Does NOT raise AUTH_RATE_LIMIT_MAX.
 */

const TEST_NET =
  /^(203\.0\.113\.([1-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])|198\.51\.100\.([1-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))$/;

function isStagingEnvironment() {
  return String(process.env.ARGOS_ENVIRONMENT || "").trim().toLowerCase() === "staging";
}

/**
 * @param {import('express').Request} req
 * @returns {string|null} TEST-NET IP or null
 */
function stagingE2eFwdIp(req) {
  if (!isStagingEnvironment()) return null;
  const raw = String(req.headers["x-argos-staging-e2e-fwd"] || "")
    .split(",")[0]
    .trim();
  if (!TEST_NET.test(raw)) return null;
  return raw;
}

/**
 * express-rate-limit keyGenerator — staging E2E isolation, else default IP.
 * @param {import('express').Request} req
 * @returns {string}
 */
function authRateLimitKey(req) {
  const e2e = stagingE2eFwdIp(req);
  if (e2e) return `stg-e2e:${e2e}`;
  return req.ip || req.socket?.remoteAddress || "unknown";
}

module.exports = {
  isStagingEnvironment,
  stagingE2eFwdIp,
  authRateLimitKey,
  TEST_NET
};
