export type DiagnosticAnswerValue = 0 | 1 | 2;

export type DiagnosticQuestion = {
  id: string;
  /** Una de las áreas del informe ARGOS */
  area: string;
  /** Texto de la pregunta */
  text: string;
  /** Pie corto para listas derivadas del resultado */
  shortLabel: string;
};

/** Opciones fijas — el índice (0–2) son puntos de riesgo sumados al total. */
export const DIAGNOSTIC_OPTION_LABELS = [
  "Sí, está controlado",
  "Parcialmente / No estoy seguro",
  "No / No lo tenemos"
] as const;

export type DiagnosticOptionIndex = 0 | 1 | 2;

export const DIAGNOSTIC_CONTACT_HREF_AFTER = "/contacto?source=diagnostico-argos";

export const DIAGNOSTIC_REGISTER_HREF_AFTER = "/auth/register?source=diagnostico-argos";

/** Origen estable para persistencia y analíticas en backend */
export const DIAGNOSTIC_SOURCE = "diagnostico-argos" as const;

export const diagnosticQuestions: readonly DiagnosticQuestion[] = [
  {
    id: "continuity",
    area: "Continuidad del negocio",
    text: "Si el sistema informático de tu empresa cae hoy, ¿sabrías cómo actuar sin perder datos, clientes ni tiempo?",
    shortLabel: "Plan de actuación ante caída o parada crítica"
  },
  {
    id: "web",
    area: "Web",
    text: "¿La web de tu empresa se revisa y actualiza de forma periódica?",
    shortLabel: "Revisión y actualización periódica de la web"
  },
  {
    id: "backups",
    area: "Copias de seguridad",
    text: "¿Dispones de copias de seguridad automáticas y has comprobado que se pueden restaurar correctamente?",
    shortLabel: "Copias automáticas y restauración comprobada"
  },
  {
    id: "security-auth",
    area: "Seguridad",
    text: "¿Las cuentas críticas de tu empresa utilizan contraseñas seguras y doble verificación?",
    shortLabel: "Contraseñas seguras y doble verificación en cuentas críticas"
  },
  {
    id: "access",
    area: "Accesos",
    text: "¿Tienes controlado quién puede acceder a tu web, servidor, correos y herramientas digitales?",
    shortLabel: "Control de accesos a web, servidor, correo y herramientas"
  },
  {
    id: "forms-mail",
    area: "Formularios",
    text: "¿Has comprobado recientemente que recibes correctamente por correo electrónico los datos enviados desde tus formularios de contacto?",
    shortLabel: "Datos de formularios de contacto recibidos en el correo"
  },
  {
    id: "mobile-perf",
    area: "Rendimiento",
    text: "¿Tu web carga rápido y ofrece una buena experiencia en dispositivos móviles?",
    shortLabel: "Velocidad y experiencia en móvil"
  },
  {
    id: "updates",
    area: "Actualizaciones",
    text: "¿Mantienes actualizada la base de datos y actualizados todos los elementos necesarios para que tu web funcione correctamente?",
    shortLabel: "Base de datos y soporte técnico de la web al día"
  },
  {
    id: "incidents",
    area: "Incidencias",
    text: "¿Tu empresa tiene un procedimiento claro para gestionar incidencias técnicas?",
    shortLabel: "Procedimiento ante incidencias técnicas"
  },
  {
    id: "automation",
    area: "Automatización",
    text: "¿Utilizas automatizaciones o herramientas digitales para reducir tareas manuales y repetitivas?",
    shortLabel: "Automatización para reducir trabajo manual repetitivo"
  },
  {
    id: "legal",
    area: "Documentos legales",
    text: "¿Tu web cuenta con aviso legal, política de privacidad y política de cookies, correctamente configurados?",
    shortLabel: "Aviso legal, privacidad y cookies"
  },
  {
    id: "maintenance",
    area: "Mantenimiento",
    text: "¿Tu empresa realiza mantenimiento preventivo o solo actúa cuando surge un problema?",
    shortLabel: "Mantenimiento preventivo frente a actuar solo ante urgencias"
  }
];
