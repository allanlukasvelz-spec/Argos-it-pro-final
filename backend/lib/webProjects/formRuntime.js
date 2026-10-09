const { NO_APLICA } = require("./constants");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{5,24}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
  "drive.google.com",
  "docs.google.com"
]);

function unwrapValue(value) {
  if (value && typeof value === "object" && !Array.isArray(value) && "text" in value) {
    return value.text;
  }
  return value;
}

function asList(value) {
  const raw = unwrapValue(value);
  if (raw === undefined || raw === null || raw === "") return [];
  if (Array.isArray(raw)) return raw.map((item) => String(item));
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((item) => String(item));
      } catch {
        /* fall through */
      }
    }
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [String(raw)];
}

function isNoAplica(value) {
  return unwrapValue(value) === NO_APLICA;
}

function isFilled(value) {
  const raw = unwrapValue(value);
  if (raw === undefined || raw === null) return false;
  if (Array.isArray(raw)) return raw.length > 0;
  if (typeof raw === "string") return raw.trim().length > 0;
  return true;
}

function isValidUrlValue(value, { video } = {}) {
  const text = String(unwrapValue(value) || "").trim();
  if (!text) return false;
  try {
    const parsed = new URL(text.includes("://") ? text : `https://${text}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (!video) return true;
    const host = parsed.hostname.toLowerCase();
    return VIDEO_HOSTS.has(host) || host.endsWith(".google.com");
  } catch {
    return false;
  }
}

function isValidEmailValue(value) {
  const text = String(unwrapValue(value) || "").trim();
  return EMAIL_RE.test(text);
}

function isValidPhoneValue(value) {
  const text = String(unwrapValue(value) || "").trim();
  return PHONE_RE.test(text);
}

function isValidDateValue(value) {
  const text = String(unwrapValue(value) || "").trim();
  if (!DATE_RE.test(text)) return false;
  const time = Date.parse(`${text}T00:00:00Z`);
  return Number.isFinite(time);
}

function isValidNumberValue(value) {
  const raw = unwrapValue(value);
  if (raw === "" || raw === undefined || raw === null) return false;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  return Number.isFinite(n);
}

function matchRule(rule, values, context = {}) {
  if (!rule) return true;
  if (Array.isArray(rule.all)) return rule.all.every((part) => matchRule(part, values, context));
  if (Array.isArray(rule.any)) return rule.any.some((part) => matchRule(part, values, context));
  if (rule.projectType) {
    const pt = context.projectType;
    if (rule.projectType.equals !== undefined) return pt === rule.projectType.equals;
    if (Array.isArray(rule.projectType.in)) return rule.projectType.in.includes(pt);
  }
  if (rule.field) {
    const current = unwrapValue(values.get(rule.field));
    const list = asList(current);
    if (rule.equals !== undefined) return current === rule.equals;
    if (rule.notEquals !== undefined) return current !== rule.notEquals;
    if (Array.isArray(rule.in)) {
      if (list.length) return list.some((item) => rule.in.includes(item));
      return rule.in.includes(current);
    }
    if (rule.contains !== undefined) return list.includes(rule.contains);
    if (rule.minLength) return list.length >= rule.minLength;
  }
  return true;
}

function isApplicable(field, values, context = {}) {
  return matchRule(field.applicableIf || field.requiredIf, values, context);
}

function responseMap(responses, schemaVersion) {
  const map = new Map();
  for (const row of responses || []) {
    if (row.schema_version && schemaVersion && row.schema_version !== schemaVersion) continue;
    if (row.schemaVersion && schemaVersion && row.schemaVersion !== schemaVersion) continue;
    map.set(row.field_key || row.fieldKey, row.value);
  }
  return map;
}

module.exports = {
  unwrapValue,
  asList,
  isNoAplica,
  isFilled,
  isValidUrlValue,
  isValidEmailValue,
  isValidPhoneValue,
  isValidDateValue,
  isValidNumberValue,
  matchRule,
  isApplicable,
  responseMap,
  VIDEO_HOSTS
};
