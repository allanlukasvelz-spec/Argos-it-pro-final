const crypto = require("crypto");

const store = new Map();
const TTL_MS = Number(process.env.CONTACT_CAPTCHA_TTL_MS || 10 * 60 * 1000);
const MAX_ATTEMPTS = Number(process.env.CONTACT_CAPTCHA_MAX_ATTEMPTS || 5);

function purgeExpired() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) store.delete(id);
  }
}

function randomOperand() {
  return 2 + Math.floor(Math.random() * 8);
}

function createChallenge() {
  purgeExpired();
  const left = randomOperand();
  const right = randomOperand();
  const challengeId = crypto.randomBytes(16).toString("hex");
  store.set(challengeId, {
    answer: left + right,
    expiresAt: Date.now() + TTL_MS,
    attempts: 0
  });
  return {
    challengeId,
    question: `${left} + ${right}`
  };
}

function verifyChallenge(challengeId, rawAnswer) {
  purgeExpired();
  if (!challengeId || typeof challengeId !== "string") {
    return { ok: false, reason: "missing" };
  }

  const entry = store.get(challengeId);
  if (!entry) {
    return { ok: false, reason: "expired" };
  }

  if (entry.expiresAt <= Date.now()) {
    store.delete(challengeId);
    return { ok: false, reason: "expired" };
  }

  entry.attempts += 1;
  const answer = Number.parseInt(String(rawAnswer ?? "").trim(), 10);
  if (!Number.isFinite(answer)) {
    if (entry.attempts >= MAX_ATTEMPTS) store.delete(challengeId);
    return { ok: false, reason: "invalid" };
  }

  if (answer !== entry.answer) {
    if (entry.attempts >= MAX_ATTEMPTS) store.delete(challengeId);
    return { ok: false, reason: "wrong" };
  }

  store.delete(challengeId);
  return { ok: true };
}

function __resetStoreForTests() {
  store.clear();
}

module.exports = {
  createChallenge,
  verifyChallenge,
  __resetStoreForTests
};
