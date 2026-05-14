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

export const diagnosticQuestions: readonly DiagnosticQuestion[] = [
  {
    id: "web",
    area: "Web",
    text: "¿Tu web está actualizada y revisada recientemente?",
    shortLabel: "Web actualizada y revisada"
  },
  {
    id: "backups",
    area: "Copias de seguridad",
    text: "¿Tienes copias de seguridad automáticas y comprobadas?",
    shortLabel: "Copias automáticas y verificadas"
  },
  {
    id: "security-auth",
    area: "Seguridad",
    text: "¿Usas contraseñas seguras y doble verificación en cuentas críticas?",
    shortLabel: "Contraseñas seguras y 2FA"
  },
  {
    id: "access",
    area: "Usuarios y accesos",
    text: "¿Sabes quién tiene acceso a tu web, hosting, correos y herramientas?",
    shortLabel: "Gestión clara de accesos"
  },
  {
    id: "forms-mail",
    area: "Correos y formularios",
    text: "¿Tus formularios de contacto envían correos correctamente?",
    shortLabel: "Formularios y entrega de correo"
  },
  {
    id: "mobile-perf",
    area: "Rendimiento",
    text: "¿Tu web carga rápido en móvil?",
    shortLabel: "Rendimiento en móvil"
  },
  {
    id: "updates",
    area: "Actualizaciones",
    text: "¿Mantienes plugins, temas y sistemas clave siempre actualizados?",
    shortLabel: "Actualizaciones al día"
  },
  {
    id: "incidents",
    area: "Procesos internos",
    text: "¿Tu empresa tiene un proceso claro para incidencias técnicas?",
    shortLabel: "Proceso ante incidencias"
  },
  {
    id: "automation",
    area: "Automatización",
    text: "¿Usas herramientas o automatizaciones para ahorrar tiempo y reducir errores?",
    shortLabel: "Automatización y herramientas"
  },
  {
    id: "legal",
    area: "Cumplimiento / legal",
    text: "¿Tienes textos legales, privacidad y cookies correctamente configurados?",
    shortLabel: "Legal, privacidad y cookies"
  },
  {
    id: "maintenance",
    area: "Soporte y mantenimiento",
    text: "¿Tienes mantenimiento preventivo o solo actúas cuando algo falla?",
    shortLabel: "Mantenimiento preventivo vs reactivo"
  },
  {
    id: "continuity",
    area: "Continuidad",
    text: "¿Sabes cuánto tardarías en recuperar tu web si hoy dejara de funcionar?",
    shortLabel: "Plan de recuperación y tiempo de recuperación"
  }
];
