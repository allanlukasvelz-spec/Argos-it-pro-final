/** Tipos de acción permitidos vía WebSocket (evita abuso de INSERT arbitrario). */
const WS_ACTION_TYPES = new Set([
  "login_failed",
  "login_success",
  "logout",
  "suspicious_behavior",
  "user_navigation",
  "form_interaction",
  "assistant_open",
  "session_check"
]);

const WS_DETAILS_MAX_JSON = 8192;

function sanitizeWsDetails(details) {
  if (details === null || typeof details === "undefined") return {};
  if (typeof details !== "object" || Array.isArray(details)) return {};
  try {
    const json = JSON.stringify(details);
    if (json.length > WS_DETAILS_MAX_JSON) {
      return { truncated: true, note: "details_exceeded_max" };
    }
    return details;
  } catch {
    return {};
  }
}

function isAllowedWsActionType(type) {
  return typeof type === "string" && type.length > 0 && type.length <= 64 && WS_ACTION_TYPES.has(type);
}

module.exports = {
  WS_ACTION_TYPES,
  WS_DETAILS_MAX_JSON,
  sanitizeWsDetails,
  isAllowedWsActionType
};
