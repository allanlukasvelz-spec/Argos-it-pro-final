/**
 * Resettable in-memory rate-limit stores for test isolation.
 * Production/staging: reset never allowed (fail closed).
 * Tests/CI: NODE_ENV in {test,development} + ARGOS_ALLOW_RATE_LIMIT_RESET=1.
 */

const { isRateLimitResetAllowed } = require("./ops/testSurfacePolicy");

class ResettableMemoryStore {
  constructor() {
    /** @type {Map<string, { count: number, resetTime: number }>} */
    this.hits = new Map();
    this.windowMs = 60_000;
  }

  /**
   * @param {{ windowMs: number }} options
   */
  init(options) {
    this.windowMs = options.windowMs;
  }

  /**
   * @param {string} key
   */
  async increment(key) {
    const now = Date.now();
    let entry = this.hits.get(key);
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + this.windowMs };
    }
    entry.count += 1;
    this.hits.set(key, entry);
    return {
      totalHits: entry.count,
      resetTime: new Date(entry.resetTime)
    };
  }

  /**
   * @param {string} key
   */
  async decrement(key) {
    const entry = this.hits.get(key);
    if (!entry) return;
    entry.count = Math.max(0, entry.count - 1);
  }

  /**
   * @param {string} key
   */
  async resetKey(key) {
    this.hits.delete(key);
  }

  resetAll() {
    this.hits.clear();
  }
}

/** @type {ResettableMemoryStore[]} */
const stores = [];

function createRegisteredStore() {
  const store = new ResettableMemoryStore();
  stores.push(store);
  return store;
}

function resetAllRateLimitStores() {
  for (const store of stores) {
    store.resetAll();
  }
  return { storesReset: stores.length };
}

module.exports = {
  ResettableMemoryStore,
  createRegisteredStore,
  resetAllRateLimitStores,
  isRateLimitResetAllowed
};
