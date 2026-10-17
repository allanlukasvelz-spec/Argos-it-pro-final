export type ProjectTypeChoice = "create" | "improve";

export const SELF_SERVICE_HOME_INDEX = "01 / Proyecto web";
export const SELF_SERVICE_HOME_TITLE = "Crea o mejora tu web con ARGOS";
export const SELF_SERVICE_HOME_LEAD =
  "Cuéntanos qué necesitas y te guiaremos paso a paso para reunir la información de tu proyecto web. Puedes guardar el progreso y continuar cuando quieras.";
export const SELF_SERVICE_HOME_CTA = "Comenzar mi proyecto";

export const SELF_SERVICE_LANDING_PATH = "/proyecto-web";
export const SELF_SERVICE_START_PATH = "/proyecto-web/comenzar";
export const SELF_SERVICE_LOGIN_PATH = "/auth/login";

export const SELF_SERVICE_LANDING_TITLE = "Crea o mejora tu web con ARGOS";
export const SELF_SERVICE_LANDING_LEAD =
  "Cuéntanos qué necesitas y te guiaremos paso a paso para reunir toda la información necesaria para preparar tu proyecto web. No necesitas tenerlo todo preparado. Podrás guardar el progreso, adjuntar textos, fotografías y documentos y continuar cuando quieras.";
export const SELF_SERVICE_CTA = "Comenzar mi proyecto";
export const SELF_SERVICE_LOGIN_LINK = "Iniciar sesión";
export const SELF_SERVICE_HAS_ACCOUNT = "¿Ya tienes cuenta?";

export const SELF_SERVICE_HOW_TITLE = "Cómo funciona";
export const SELF_SERVICE_HOW_STEPS = [
  "Cuéntanos tu proyecto",
  "Completa la información a tu ritmo",
  "Adjunta textos, imágenes y documentos",
  "ARGOS revisa contigo la información",
  "Preparamos la siguiente fase de tu proyecto"
];

export const SELF_SERVICE_OPTIONS_TITLE = "Dos opciones";
export const SELF_SERVICE_OPTION_CREATE_TITLE = "Crear una web nueva";
export const SELF_SERVICE_OPTION_CREATE_BODY =
  "Partimos de cero y reunimos lo necesario para diseñar y publicar tu presencia digital.";
export const SELF_SERVICE_OPTION_IMPROVE_TITLE = "Mejorar mi web actual";
export const SELF_SERVICE_OPTION_IMPROVE_BODY =
  "Revisamos lo que ya tienes y preparamos las mejoras con un recuento ordenado de contenidos y prioridades.";

export const SELF_SERVICE_PACE_TITLE = "No necesitas tenerlo todo preparado";
export const SELF_SERVICE_PACE_BODY =
  "Puedes empezar con lo esencial, guardar el avance y volver cuando tengas textos, fotografías o documentos. El cuestionario vive en tu área de cliente, no en esta página.";

export const SELF_SERVICE_PRIVACY_TITLE = "Privacidad";
export const SELF_SERVICE_PRIVACY_BODY =
  "Usamos tus datos para crear tu acceso y preparar el proyecto. No pedimos contraseñas de hosting ni claves técnicas en este primer paso.";

export const SELF_SERVICE_START_TITLE = "Empieza tu proyecto web";
export const SELF_SERVICE_NEED_LEGEND = "¿Qué necesitas?";
export const SELF_SERVICE_CONTINUE = "Continuar";
export const SELF_SERVICE_EXISTING_ACCOUNT =
  "Ya existe una cuenta con este correo. Inicia sesión para continuar.";
export const SELF_SERVICE_GENERIC_ERROR = "No hemos podido iniciar el proyecto. Inténtalo de nuevo.";
export const SELF_SERVICE_SESSION_EXPIRED = "Nuestra sesión ha caducado. Vuelve a iniciar sesión.";
export const SELF_SERVICE_ORG_QUESTION = "¿Para qué empresa quieres crear este proyecto?";
export const SELF_SERVICE_NEW_SPACE = "Otro espacio nuevo";
export const SELF_SERVICE_RESUME = "Continuar proyecto";
export const SELF_SERVICE_CREATE_ANOTHER = "Crear otro proyecto";
export const SELF_SERVICE_NAME_LABEL = "Nombre";
export const SELF_SERVICE_EMAIL_LABEL = "Email";
export const SELF_SERVICE_PASSWORD_LABEL = "Contraseña";
export const SELF_SERVICE_TITLE_LABEL = "Título del proyecto (opcional)";
export const SELF_SERVICE_PASSWORD_HINT = "Mínimo 10 caracteres, con mayúsculas, minúsculas y números.";

export const SELF_SERVICE_INTENT_KEY = "wp_self_service_intent";

export type SelfServiceIntent = {
  projectType?: ProjectTypeChoice;
  title?: string;
  organizationName?: string;
  email?: string;
  organizationId?: number | null;
  createOrganization?: boolean;
  idempotencyKey: string;
};

export function selfServiceIntentStorageKey(): string {
  return SELF_SERVICE_INTENT_KEY;
}

export function newSelfServiceIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ss-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readSelfServiceIntent(): SelfServiceIntent | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SELF_SERVICE_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SelfServiceIntent;
    if (!parsed || typeof parsed !== "object") return null;
    const { password: _password, ...safe } = parsed as SelfServiceIntent & { password?: string };
    void _password;
    if (!safe.idempotencyKey) return null;
    return safe;
  } catch {
    return null;
  }
}

export function writeSelfServiceIntent(intent: SelfServiceIntent): void {
  if (typeof sessionStorage === "undefined") return;
  const { password: _password, ...safe } = intent as SelfServiceIntent & { password?: string };
  void _password;
  sessionStorage.setItem(SELF_SERVICE_INTENT_KEY, JSON.stringify(safe));
}

export function clearSelfServiceIntent(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(SELF_SERVICE_INTENT_KEY);
}

export function projectRedirectPath(projectId: number): string {
  if (!Number.isInteger(projectId) || projectId <= 0) return "/dashboard/proyectos";
  return `/dashboard/proyectos/${projectId}`;
}

export function isSafeProjectRedirect(path: string | null | undefined): boolean {
  return /^\/dashboard\/proyectos\/\d+$/.test(String(path || ""));
}

export function technicalSelfServiceTermsLeak(text: string): boolean {
  return /\b(tenant|membership|INTAKE|RBAC|provision|workflow_status|Web Projects)\b/i.test(
    String(text || "")
  );
}

export function selfServicePasswordLooksValid(password: string): boolean {
  return (
    password.length >= 10 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
