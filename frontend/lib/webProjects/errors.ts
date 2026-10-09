import axios from "axios";

export type ClientApiError = {
  status: number;
  code?: string;
  message: string;
};

const FRIENDLY: Record<string, string> = {
  STORAGE_UNAVAILABLE:
    "No podemos acceder al almacenamiento de documentos en este momento. Inténtalo de nuevo más tarde.",
  DOCUMENT_INVALID: "No ha sido posible guardar el documento.",
  PROJECT_ARCHIVED: "Este proyecto está archivado y no admite cambios.",
  PROJECT_COMPLETED: "Este proyecto está finalizado y no admite cambios operativos.",
  ARCHIVE_NOT_ELIGIBLE: "Solo se puede archivar un proyecto completado.",
  SECRET_REJECTED:
    "Por seguridad, no incluyas contraseñas, claves privadas ni tokens en los comentarios.",
  VALIDATION_ERROR: "Revisa los datos introducidos.",
  INVALID_FORM_FIELD: "Esa pregunta no forma parte del cuestionario actual.",
  INVALID_FORM_VALUE: "El valor no es válido para esta pregunta.",
  FORBIDDEN: "No tienes permiso para esta acción.",
  NOT_FOUND: "No hemos encontrado este proyecto.",
  TENANT_REQUIRED: "Falta el contexto de la organización.",
  INVALID_TRANSITION: "Esa transición de fase no está permitida.",
  REVIEW_TARGET_INVALID: "Ese elemento no se puede revisar en este expediente.",
  REVIEW_ALREADY_RESOLVED: "Esta revisión ya está resuelta.",
  CORRECTION_MESSAGE_REQUIRED: "Explica qué debe corregir el cliente.",
  REPLACEMENT_INVALID: "No se puede reemplazar ese documento.",
  INVITATION_INVALID: "Esta invitación no es válida o ha caducado.",
  WRONG_ACCOUNT: "Esta invitación pertenece a otra cuenta. Cierra sesión e inicia con el correo invitado.",
  LOGIN_REQUIRED: "Inicia sesión o crea tu acceso para continuar.",
  SETUP_REQUIRED: "Crea tu acceso para continuar.",
  ORG_SELECTION_REQUIRED: "Elige para qué empresa quieres crear este proyecto.",
  INACTIVE_ORGANIZATION: "Ese espacio no está disponible.",
  SELF_SERVICE_FAILED: "No hemos podido iniciar el proyecto. Inténtalo de nuevo.",
  INCOMPLETE_SUBMISSION: "Falta información mínima para enviar a revisión.",
  FORM_LOCKED: "El cuestionario no admite ese cambio en esta fase.",
  ARCHITECTURE_NOT_READY: "Todavía no se puede iniciar la arquitectura. Revisa los bloqueos del brief.",
  ARCHITECTURE_OVERRIDE_REQUIRED: "Hay avisos abiertos. Confirma explícitamente para iniciar arquitectura.",
  BRIEF_NOTE_INVALID: "No se ha podido guardar la nota interna."
};

const DOCUMENT_HINTS: { test: RegExp; message: string }[] = [
  { test: /demasiado grande|too large|20/i, message: "El archivo supera los 20 MB." },
  { test: /vacío|empty/i, message: "El archivo está vacío." },
  { test: /no permitido|extensión|tipo de archivo|mime/i, message: "Formato no admitido." }
];

function fromResponse(err: unknown): ClientApiError | null {
  const candidate = axios.isAxiosError(err)
    ? err
    : err && typeof err === "object" && "response" in err
      ? (err as { response?: { status?: number; data?: { code?: string; error?: string } }; message?: string })
      : null;
  const response = candidate?.response;
  if (!response?.status) return null;
  const data = response.data;
  return {
    status: response.status,
    code: data?.code,
    message: data?.error || ("message" in (candidate || {}) ? String(candidate?.message || "Error") : "Error")
  };
}

export function readClientApiError(err: unknown): ClientApiError {
  const fromHttp = fromResponse(err);
  if (fromHttp) return fromHttp;
  if (err instanceof Error) {
    return { status: 0, message: err.message };
  }
  return { status: 0, message: "Error inesperado" };
}

export function webProjectErrorMessage(err: unknown): string {
  const parsed = readClientApiError(err);
  if (parsed.code === "DOCUMENT_INVALID") {
    const hinted = DOCUMENT_HINTS.find((row) => row.test.test(parsed.message));
    if (hinted) return hinted.message;
  }
  if (parsed.code && FRIENDLY[parsed.code]) return FRIENDLY[parsed.code];
  if (parsed.status === 401) return "Tu sesión ha caducado. Vuelve a iniciar sesión.";
  if (parsed.status === 403) return FRIENDLY.FORBIDDEN;
  if (parsed.status === 404) return FRIENDLY.NOT_FOUND;
  if (parsed.status === 409) {
    if (parsed.code === "INVALID_TRANSITION") return FRIENDLY.INVALID_TRANSITION;
    if (parsed.code === "PROJECT_ARCHIVED") return FRIENDLY.PROJECT_ARCHIVED;
    if (parsed.code === "WRONG_ACCOUNT") return FRIENDLY.WRONG_ACCOUNT;
    if (parsed.code === "LOGIN_REQUIRED") return FRIENDLY.LOGIN_REQUIRED;
    if (parsed.code === "ORG_SELECTION_REQUIRED") return FRIENDLY.ORG_SELECTION_REQUIRED;
    return parsed.message || FRIENDLY.VALIDATION_ERROR;
  }
  if (parsed.status === 503) return FRIENDLY.STORAGE_UNAVAILABLE;
  if (parsed.status === 400) return parsed.message || FRIENDLY.VALIDATION_ERROR;
  return "No se ha podido completar la acción. Inténtalo de nuevo.";
}

export function webProjectPageErrorTitle(err: unknown): string {
  const parsed = readClientApiError(err);
  if (parsed.status === 404) return "Este proyecto no existe o no pertenece a tu organización.";
  if (parsed.status === 403) return "No tienes acceso a este proyecto.";
  if (parsed.status === 401) return "Necesitas iniciar sesión para ver los proyectos.";
  if (parsed.status === 503) return FRIENDLY.STORAGE_UNAVAILABLE;
  return "No se ha podido cargar el proyecto.";
}
