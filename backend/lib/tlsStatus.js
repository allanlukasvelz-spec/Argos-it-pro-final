/**
 * TLS observation status — explainable, no invented HEALTHY.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {{ notAfter?: Date|string|null, hostnameMatch?: boolean|null, chainError?: boolean|null, hasObservation?: boolean }} input
 * @param {Date} [now]
 */
function deriveTlsObservationStatus(input, now = new Date()) {
  if (input.chainError) {
    return {
      status: "CHAIN_ERROR",
      daysRemaining: null,
      riskHint: null
    };
  }

  if (input.hostnameMatch === false) {
    return {
      status: "HOSTNAME_MISMATCH",
      daysRemaining: null,
      riskHint: null
    };
  }

  if (!input.hasObservation && !input.notAfter) {
    return {
      status: "UNKNOWN",
      daysRemaining: null,
      riskHint: null
    };
  }

  if (!input.notAfter) {
    return {
      status: "UNKNOWN",
      daysRemaining: null,
      riskHint: null
    };
  }

  const notAfter = input.notAfter instanceof Date ? input.notAfter : new Date(input.notAfter);
  if (Number.isNaN(notAfter.getTime())) {
    return {
      status: "UNKNOWN",
      daysRemaining: null,
      riskHint: null
    };
  }

  const daysRemaining = Math.floor((notAfter.getTime() - now.getTime()) / DAY_MS);

  if (daysRemaining < 0) {
    return { status: "EXPIRED", daysRemaining, riskHint: "CRITICAL" };
  }
  if (daysRemaining <= 7) {
    return { status: "EXPIRING", daysRemaining, riskHint: "CRITICAL" };
  }
  if (daysRemaining <= 14) {
    return { status: "EXPIRING", daysRemaining, riskHint: "HIGH" };
  }
  if (daysRemaining <= 30) {
    return { status: "EXPIRING", daysRemaining, riskHint: "MEDIUM" };
  }
  return { status: "VALID", daysRemaining, riskHint: null };
}

/**
 * @param {string[]} sans
 */
function detectWildcard(sans) {
  if (!Array.isArray(sans)) return false;
  return sans.some((s) => typeof s === "string" && s.trim().startsWith("*."));
}

/**
 * Extract provider hint from issuer DN.
 * @param {string|null|undefined} issuer
 */
function providerFromIssuer(issuer) {
  const s = String(issuer || "");
  if (/let'?s encrypt/i.test(s)) return "Let's Encrypt";
  if (/digicert/i.test(s)) return "DigiCert";
  if (/google/i.test(s)) return "Google Trust Services";
  if (/amazon|aws/i.test(s)) return "Amazon";
  if (/cloudflare/i.test(s)) return "Cloudflare";
  if (/sectigo|comodo/i.test(s)) return "Sectigo";
  return null;
}

/**
 * Public serialization — never include private key fields even if present by mistake.
 */
function serializeTlsCertificate(row) {
  if (!row) return null;
  const {
    private_key: _pk1,
    privateKey: _pk2,
    pem: _pem,
    key: _key,
    ...safe
  } = row;
  return {
    id: safe.id,
    organizationId: safe.organization_id,
    assetId: safe.asset_id,
    provider: safe.provider,
    serial: safe.serial,
    fingerprintSha256: safe.fingerprint_sha256,
    issuer: safe.issuer,
    subject: safe.subject,
    notBefore: safe.not_before,
    notAfter: safe.not_after,
    sans: Array.isArray(safe.sans) ? safe.sans : [],
    isWildcard: Boolean(safe.is_wildcard),
    autoRenew: safe.auto_renew,
    renewalMethod: safe.renewal_method,
    lastObservedAt: safe.last_observed_at,
    observationStatus: safe.observation_status || "UNKNOWN",
    hostnameMatch: safe.hostname_match,
    metadata: safe.metadata && typeof safe.metadata === "object" ? safe.metadata : {},
    createdAt: safe.created_at,
    updatedAt: safe.updated_at
  };
}

module.exports = {
  deriveTlsObservationStatus,
  detectWildcard,
  providerFromIssuer,
  serializeTlsCertificate,
  DAY_MS
};
