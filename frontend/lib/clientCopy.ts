/** Client-facing copy for technical facts (Spanish). */

const ERROR_CLASS_COPY: Record<string, string> = {
  TLS_EXPIRED: "El certificado HTTPS ha caducado.",
  TLS_EXPIRING: "El certificado HTTPS caduca pronto.",
  TLS_HOSTNAME_MISMATCH: "Se ha detectado una incompatibilidad en la protección HTTPS.",
  TLS_CHAIN_ERROR: "Hay un problema en la cadena de confianza del certificado HTTPS.",
  HTTP_5XX: "El servicio responde con errores del servidor.",
  HTTP_4XX: "El servicio responde con un error de acceso.",
  TIMEOUT: "No hemos podido confirmar recientemente el estado de este servicio.",
  CONN_REFUSED: "No se ha podido establecer conexión con el servicio.",
  DNS_NXDOMAIN: "El nombre de dominio no resuelve en DNS.",
  DNS_FAILURE: "No hemos podido completar la resolución DNS.",
  SSRF_BLOCKED: "La comprobación no se ha podido ejecutar de forma segura.",
  RUNNER_ERROR: "La comprobación no se ha podido completar. El estado permanece desconocido.",
  REDIRECT_BLOCKED: "La comprobación se detuvo ante una redirección no permitida."
};

export function clientReasonCopy(reason: string | null | undefined): string {
  if (!reason) return "Sin detalle adicional.";
  const key = String(reason).toUpperCase();
  return ERROR_CLASS_COPY[key] || String(reason);
}

export function healthLabelEs(overall: string): string {
  switch (String(overall).toUpperCase()) {
    case "HEALTHY":
      return "Correcto";
    case "WARNING":
      return "Atención";
    case "CRITICAL":
      return "Crítico";
    default:
      return "Desconocido";
  }
}

export function coverageLabelEs(coverage: string): string {
  switch (coverage) {
    case "NONE":
      return "Sin monitors";
    case "PARTIAL":
      return "Parcial";
    case "MONITORED":
      return "Con evidencia fresca";
    default:
      return "Desconocida";
  }
}

export function relativeTimeEs(iso: string | null | undefined): string {
  if (!iso) return "Sin observación";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "Sin observación";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hace menos de 1 min";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}
