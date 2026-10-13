/**
 * Transporte de prueba. Acepta mensajes en memoria.
 * No entrega a un buzón real y no se activa en producción.
 */

const messages = [];

function isQaTransport(env = process.env) {
  return String(env.NODE_ENV) !== "production" && String(env.ARGOS_EMAIL_TRANSPORT || "").toLowerCase() === "qa";
}

function acceptQaMessage(message) {
  const record = {
    id: messages.length + 1,
    acceptedAt: new Date().toISOString(),
    channel: "qa",
    dispatched: true,
    delivered: false,
    kind: message.kind,
    to: message.to || null,
    subject: message.subject || null,
    text: message.text || null
  };
  messages.push(record);
  return record;
}

function listQaMessages() {
  return messages.map((item) => ({ ...item }));
}

function clearQaMessages() {
  messages.length = 0;
}

module.exports = {
  isQaTransport,
  acceptQaMessage,
  listQaMessages,
  clearQaMessages
};
