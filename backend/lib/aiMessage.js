const AI_MESSAGE_MAX_LEN = Number(process.env.AI_MESSAGE_MAX_LEN || 2000);

function normalizeChatMessage(raw) {
  if (raw === null || typeof raw === "undefined") {
    return { ok: false, error: "El campo message es obligatorio.", message: "" };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "El campo message debe ser texto.", message: "" };
  }
  const message = raw.trim();
  if (!message) {
    return { ok: false, error: "El campo message no puede estar vacio.", message: "" };
  }
  if (message.length > AI_MESSAGE_MAX_LEN) {
    return {
      ok: false,
      error: `El mensaje supera el maximo de ${AI_MESSAGE_MAX_LEN} caracteres.`,
      message: ""
    };
  }
  return { ok: true, message };
}

module.exports = { AI_MESSAGE_MAX_LEN, normalizeChatMessage };
