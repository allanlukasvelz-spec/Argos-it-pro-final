/**
 * Short-lived in-memory conversation store (no permanent surveillance).
 * Bounds: per-conversation message window, TTL eviction, global conversation cap.
 * Not durable across process restarts / multi-instance.
 */

const crypto = require("crypto");

const MAX_MESSAGES = Number(process.env.AI_CONVERSATION_MAX_MESSAGES || 12);
const TTL_MS = Number(process.env.AI_CONVERSATION_TTL_MS || 30 * 60 * 1000);
const MAX_CONVERSATIONS = Number(process.env.AI_CONVERSATION_MAX_TOTAL || 500);

/** @type {Map<string, { updatedAt: number, messages: Array<{role:string,content:string}> }>} */
const store = new Map();

function newConversationId() {
  return crypto.randomUUID();
}

function isValidConversationId(id) {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  );
}

function pruneExpired() {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (now - entry.updatedAt > TTL_MS) store.delete(id);
  }
}

/** Evict oldest conversations when global cap exceeded (LRU by updatedAt). */
function enforceGlobalCap() {
  if (store.size <= MAX_CONVERSATIONS) return;
  const ranked = [...store.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
  const overflow = store.size - MAX_CONVERSATIONS;
  for (let i = 0; i < overflow; i++) {
    store.delete(ranked[i][0]);
  }
}

function getOrCreate(conversationId) {
  pruneExpired();
  let id = conversationId;
  if (!isValidConversationId(id)) {
    id = newConversationId();
  }
  let entry = store.get(id);
  if (!entry) {
    entry = { updatedAt: Date.now(), messages: [] };
    store.set(id, entry);
    enforceGlobalCap();
  }
  return { id, entry };
}

/**
 * @param {string|undefined} conversationId
 * @param {"user"|"assistant"} role
 * @param {string} content
 */
function appendMessage(conversationId, role, content) {
  const { id, entry } = getOrCreate(conversationId);
  entry.messages.push({ role, content });
  if (entry.messages.length > MAX_MESSAGES) {
    entry.messages = entry.messages.slice(-MAX_MESSAGES);
  }
  entry.updatedAt = Date.now();
  // Touch ordering for LRU after update
  store.delete(id);
  store.set(id, entry);
  enforceGlobalCap();
  return { conversationId: id, messages: entry.messages.slice() };
}

function getMessages(conversationId) {
  pruneExpired();
  if (!isValidConversationId(conversationId)) return [];
  const entry = store.get(conversationId);
  return entry ? entry.messages.slice() : [];
}

function conversationCount() {
  pruneExpired();
  return store.size;
}

/** Test helper */
function _resetStoreForTests() {
  store.clear();
}

module.exports = {
  MAX_MESSAGES,
  TTL_MS,
  MAX_CONVERSATIONS,
  newConversationId,
  isValidConversationId,
  appendMessage,
  getMessages,
  getOrCreate,
  conversationCount,
  _resetStoreForTests
};
