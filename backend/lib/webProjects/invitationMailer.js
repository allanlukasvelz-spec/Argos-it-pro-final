/**
 * Honest invitation delivery. CURRENT has no SMTP channel.
 * Does not pretend Formspree is an invite mailer.
 */
const PUBLIC_INVITE_PATH = "/auth/invite";

function frontendBaseUrl(env = process.env) {
  return String(env.FRONTEND_URL || env.CORS_ORIGINS || "http://127.0.0.1:3000")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
}

function buildInviteUrl(token, env = process.env) {
  return `${frontendBaseUrl(env)}${PUBLIC_INVITE_PATH}?token=${encodeURIComponent(token)}`;
}

function canRevealInviteUrl(env = process.env) {
  return env.NODE_ENV !== "production";
}

function invitationEmailCopy({ displayName, expiresAt }) {
  const when = expiresAt instanceof Date ? expiresAt.toISOString().slice(0, 10) : String(expiresAt || "");
  return {
    subject: "ARGOS-IT — Invitación para preparar tu proyecto web",
    text: [
      "ARGOS-IT te ha invitado a preparar la información necesaria para tu proyecto web.",
      "",
      `Hola${displayName ? ` ${displayName}` : ""}.`,
      "Hemos preparado un espacio privado donde podrás facilitarnos progresivamente los datos, textos, servicios, fotografías y documentación necesaria.",
      "No es necesario completarlo todo de una vez. Podrás guardar el progreso y continuar más adelante.",
      "",
      "El enlace caduca el " + when + ".",
      "",
      "No incluimos contraseña en este mensaje."
    ].join("\n")
  };
}

function createInvitationMailer(env = process.env) {
  return {
    canRevealInviteUrl: () => canRevealInviteUrl(env),
    buildInviteUrl: (token) => buildInviteUrl(token, env),
    async send() {
      return { delivered: false, reason: "NO_EMAIL_CHANNEL" };
    }
  };
}

module.exports = {
  PUBLIC_INVITE_PATH,
  frontendBaseUrl,
  buildInviteUrl,
  canRevealInviteUrl,
  invitationEmailCopy,
  createInvitationMailer
};
