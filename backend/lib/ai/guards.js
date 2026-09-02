/**
 * Deterministic guards for public assistant (do not rely only on the model).
 */

const BLOCKED_CLAIM_PATTERNS = [
  /\bacronis\b/i,
  /\b24\s*\/\s*7\b/i,
  /\b24\s*horas\s*(al\s*)?d[ií]a\b/i,
  /\bzero\s+downtime\b/i,
  /\bcero\s+fallos\b/i,
  /\bnever\s+fail\b/i,
  /\bnunca\s+fallar/i,
  /\bgarantiz(a|amos|ado|ada)\b/i,
  /\bguaranteed?\b/i,
  /\bprotecci[oó]n\s+total\b/i,
  /\btotal\s+protection\b/i,
  /\buptime\s+guarantee\b/i,
  /\bRPO\b/,
  /\bRTO\b/,
  /\bSLA\b/
];

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /ignora\s+(todas\s+)?(las\s+)?instrucciones/i,
  /forget\s+(all\s+)?(argos\s+)?rules/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /mu[eé]str[aá](me)?\s+(tu\s+)?(system\s+)?prompt/i,
  /repite\s+(tus\s+)?(instrucciones|reglas)\s+(ocultas|internas|hidden)/i,
  /repeat\s+your\s+hidden\s+instructions/i,
  /print\s+(your\s+)?api\s*key/i,
  /dame\s+(la\s+)?api\s*key/i,
  /cu[aá]l\s+es\s+tu\s+openai/i,
  /print\s+process\.env/i,
  /database\s+password/i,
  /contrase[nñ]a\s+de\s+la\s+base/i,
  /OPENAI_API_KEY/i,
  /JWT_SECRET/i,
  /variables?\s+de\s+entorno/i,
  /cloudflare\s+r2/i,
  /encode\s+your\s+system\s+prompt/i,
  /first\s+letters\s+of\s+every\s+word\s+in\s+your\s+hidden/i
];

const ESCALATION_PATTERNS = [
  /\b(precio|precios|coste|costo|cu[aá]nto\s+cuesta|presupuesto|tarifa|tarifas)\b/i,
  /\b(hablar\s+con\s+(una\s+)?persona|quiero\s+un\s+humano|agente\s+humano|llamar|llamadme)\b/i,
  /\b(contrato|contractual|sla\b|acuerdo\s+de\s+nivel)\b/i,
  /\b(urgente|ataque|ransomware|comprometid[oa]|brecha\s+de\s+seguridad)\b/i
];

const DIAGNOSTIC_OFFER_PATTERNS = [
  /\b(est[aá]\s+bien\s+protegida|nivel\s+de\s+seguridad|c[oó]mo\s+estamos|evaluaci[oó]n|diagn[oó]stico)\b/i,
  /\b(backup|copias?\s+de\s+seguridad).*(probar|restaur|recuper)/i,
  /\b(nunca\s+hemos\s+probado|no\s+s[eé]\s+si\s+podr[ií]amos\s+recuper)/i
];

function matchesAny(text, patterns) {
  return patterns.some((re) => re.test(text));
}

function detectInjectionAttempt(message) {
  return matchesAny(message, INJECTION_PATTERNS);
}

function detectEscalationIntent(message) {
  return matchesAny(message, ESCALATION_PATTERNS);
}

function detectDiagnosticOffer(message) {
  return matchesAny(message, DIAGNOSTIC_OFFER_PATTERNS);
}

function responseContainsBlockedClaim(text) {
  return matchesAny(text, BLOCKED_CLAIM_PATTERNS);
}

function sanitizeAssistantOutput(text) {
  let out = String(text || "").trim();
  // Soften absolute guarantees if the model slips
  out = out.replace(/\bnunca fallar[aá]n\b/gi, "pueden fallar; el trabajo es reducir riesgos");
  out = out.replace(/\bgarantizamos\b/gi, "trabajamos para");
  return out;
}

const ALLOWED_ACTIONS = new Set(["OPEN_DIAGNOSTIC", "OPEN_CONTACT", "NONE"]);

function extractAction(rawText) {
  const text = String(rawText || "");
  const re = /\[\[ARGOS_ACTION:(OPEN_DIAGNOSTIC|OPEN_CONTACT|NONE)\]\]/i;
  const m = text.match(re);
  let action = "NONE";
  if (m) {
    const candidate = m[1].toUpperCase();
    action = ALLOWED_ACTIONS.has(candidate) ? candidate : "NONE";
  }
  const cleaned = text.replace(/\s*\[\[ARGOS_ACTION:[^\]]+\]\]\s*/gi, "").trim();
  return { action, cleaned };
}

module.exports = {
  BLOCKED_CLAIM_PATTERNS,
  detectInjectionAttempt,
  detectEscalationIntent,
  detectDiagnosticOffer,
  responseContainsBlockedClaim,
  sanitizeAssistantOutput,
  extractAction,
  ALLOWED_ACTIONS
};
