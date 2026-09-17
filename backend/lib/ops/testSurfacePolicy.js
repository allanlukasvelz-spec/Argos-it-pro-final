/**
 * Fail-closed policy for destructive / test-only surfaces.
 * Staging and production never mount test helpers even if flags are set by mistake.
 */
function isStagingOrProductionRuntime() {
  const argosEnv = String(process.env.ARGOS_ENVIRONMENT || "")
    .trim()
    .toLowerCase();
  if (argosEnv === "staging" || argosEnv === "production") return true;
  if (process.env.NODE_ENV === "production") return true;
  return false;
}

/**
 * Rate-limit reset + /api/test require BOTH:
 * - non-staging/non-production runtime
 * - NODE_ENV in {test, development} (explicit; undefined fails closed)
 * - ARGOS_ALLOW_RATE_LIMIT_RESET=1
 *
 * CI/Playwright use NODE_ENV=test + flag. Local docker-compose may use development.
 */
function isRateLimitResetAllowed() {
  if (isStagingOrProductionRuntime()) return false;
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== "test" && nodeEnv !== "development") return false;
  return process.env.ARGOS_ALLOW_RATE_LIMIT_RESET === "1";
}

/** PDF stub forbidden outside unit tests */
function isReportPdfStubAllowed() {
  if (isStagingOrProductionRuntime()) return false;
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ARGOS_REPORT_PDF_STUB === "1";
}

/** NOC self-approval never in staging/production */
function isNocSelfApprovalAllowed() {
  if (isStagingOrProductionRuntime()) return false;
  return process.env.ALLOW_NOC_SELF_APPROVAL === "1";
}

module.exports = {
  isStagingOrProductionRuntime,
  isRateLimitResetAllowed,
  isReportPdfStubAllowed,
  isNocSelfApprovalAllowed
};
