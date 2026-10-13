function contactText(payload) {
  return [
    "Nueva consulta desde el formulario de ARGOS-IT.",
    `Nombre: ${payload.name}`,
    `Correo: ${payload.email}`,
    `Telefono: ${payload.phone}`,
    `Empresa: ${payload.company}`,
    `Servicio: ${payload.service}`,
    "",
    String(payload.message || "")
  ].join("\n");
}

function responseForSmtp(result = {}) {
  const reason = result.reason || "SMTP_REJECTED";
  if (reason === "SMTP_ACCEPTED") {
    return {
      status: 202,
      body: {
        message: "Consulta aceptada por el transporte. La entrega al buzón no está confirmada.",
        dispatch: "smtp",
        delivered: false,
        accepted: true
      }
    };
  }
  if (reason === "SMTP_CONFIG_INVALID") {
    return {
      status: 503,
      body: {
        error: "Consulta validada. El transporte de correo no está configurado, así que no se ha enviado.",
        code: reason,
        delivered: false
      }
    };
  }
  if (reason === "SMTP_TIMEOUT" || reason === "SMTP_OUTCOME_UNKNOWN") {
    return {
      status: 504,
      body: {
        error: "Consulta validada. El resultado del envío no está confirmado y no se ha reintentado.",
        code: reason,
        delivered: false
      }
    };
  }
  return {
    status: 502,
    body: {
      error: "No se pudo enviar la consulta.",
      code: reason,
      delivered: false
    }
  };
}

module.exports = {
  contactText,
  responseForSmtp
};
