export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
export type DeliveryStatus = "NONE" | "PENDING" | "SENT" | "FAILED";

export const INVITE_GENERIC_INVALID = "Esta invitación no es válida o ha caducado.";
export const INVITE_WRONG_ACCOUNT =
  "Esta invitación pertenece a otra cuenta. Cierra sesión e inicia con el correo invitado.";
export const INVITE_LANDING_TITLE = "Prepara con ARGOS tu proyecto web";
export const INVITE_LANDING_BODY =
  "Te guiaremos paso a paso para reunir toda la información necesaria. Puedes guardar el progreso y continuar cuando quieras.";
export const INVITE_CTA = "Comenzar";

export function invitationStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "ACCEPTED":
      return "Aceptada";
    case "EXPIRED":
      return "Caducada";
    case "REVOKED":
      return "Revocada";
    default:
      return "Desconocido";
  }
}

export function deliveryStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "SENT":
      return "Enviada";
    case "FAILED":
      return "Error de envío";
    case "PENDING":
      return "Envío pendiente";
    default:
      return "Envío no disponible";
  }
}

export function invitationCreatedMessage(delivery?: { delivered?: boolean; reason?: string | null }): string {
  if (delivery?.delivered) return "Invitación enviada";
  return "Invitación creada; envío pendiente/no disponible";
}

export function projectRedirectPath(projectId: number): string {
  if (!Number.isInteger(projectId) || projectId <= 0) return "/dashboard/proyectos";
  return `/dashboard/proyectos/${projectId}`;
}

export function isSafeInviteRedirect(path: string | null | undefined): boolean {
  const value = String(path || "");
  return /^\/dashboard\/proyectos\/\d+$/.test(value);
}

export function invitationShowsToken(payload: unknown): boolean {
  return /wpi_|token_hash/i.test(JSON.stringify(payload || {}));
}

export function inviteLoginReturnFlag(): string {
  return "wp_invite_return";
}

export function inviteTokenStorageKey(): string {
  return "wp_invite_token";
}

export function technicalInviteTermsLeak(text: string): boolean {
  return /\b(tenant|membership|INTAKE|RBAC|provision|workflow_status)\b/i.test(text);
}
