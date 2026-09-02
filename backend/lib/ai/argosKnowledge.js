/**
 * Compact verified ARGOS knowledge for public assistant (server-side only).
 * Sources: Content Freeze v1.0 + approved runtime service catalog.
 * Excludes: B12, research notebooks, QA reports, unverified claims.
 */

const ARGOS_KNOWLEDGE = Object.freeze({
  version: "1.0",
  identity: {
    name: "ARGOS-IT",
    positioningExact: "Sistemas que no fallen cuando no deben.",
    supportingExact:
      "Primero entendemos cómo trabaja tu empresa y de qué depende su operativa. Después ponemos orden, reducimos riesgos y mantenemos bajo control la tecnología que necesita para funcionar.",
    primaryCta: "Iniciar diagnóstico ARGOS",
    secondaryCta: "Conocer cómo trabajamos",
    nature:
      "Socio tecnológico externo para empresas: criterio, orden, protección y acompañamiento — sin hype ni promesas absolutas."
  },
  method: {
    dualBridge:
      "Cuatro movimientos, cinco fases. Resumimos nuestro trabajo en Analizamos, Ordenamos, Protegemos y Acompañamos. El detalle operativo vive en el método ARGOS: Analizar, Reforzar, Guiar, Optimizar y Supervisar. No son dos métodos distintos: es la misma lógica, con distinto nivel de detalle.",
    publicPhases: [
      { name: "Analizamos", idea: "Mapear dependencias reales antes de cambiar." },
      { name: "Ordenamos", idea: "Claridad frente a decisiones heredadas o desconectadas." },
      { name: "Protegemos", idea: "Refuerzo estructural y copias verificables; sin vendor absolutos." },
      { name: "Acompañamos", idea: "Supervisión continua; no afirmar disponibilidad 24/7 absoluta." }
    ],
    operationalPhases: ["Analizar", "Reforzar", "Guiar", "Optimizar", "Supervisar"],
    forcedOneToOne: false
  },
  pillars: ["Infraestructura", "Sistemas", "Seguridad", "Continuidad"],
  services: [
    {
      slug: "consultoria-it",
      title: "Consultoría IT premium",
      summary:
        "Criterio tecnológico externo para ordenar infraestructura, riesgos, soporte, web, herramientas y prioridades."
    },
    {
      slug: "mantenimiento-informatico",
      title: "Mantenimiento informático para empresas",
      summary:
        "Soporte preventivo y correctivo para equipos, usuarios, sistemas y documentación técnica."
    },
    {
      slug: "seguridad-informatica",
      title: "Seguridad informática y protección digital",
      summary: "Revisión y refuerzo de accesos, copias, plataforma web, usuarios y sistemas críticos."
    },
    {
      slug: "web-wordpress",
      title: "Web y presencia digital",
      summary: "Diseño web profesional, mantenimiento, alojamiento y SEO técnico."
    },
    {
      slug: "automatizacion-ia",
      title: "Automatización con IA",
      summary: "Automatización de tareas repetitivas y procesos con enfoque seguro y controlado."
    },
    {
      slug: "auditoria-digital",
      title: "Auditoría digital continua",
      summary: "Revisión periódica de web, seguridad, rendimiento y oportunidades de mejora."
    }
  ],
  diagnostic: {
    role: "Evaluación estructurada (preguntas, puntuación, recomendación).",
    assistantRole: "Conversación, explicación y orientación — no sustituye al diagnóstico.",
    ctaLabel: "Iniciar diagnóstico ARGOS",
    inventScores: false
  },
  mascots: {
    dumbo: "guía",
    chico: "protege",
    note: "Los mascotas no son el asistente de IA; acompañan visualmente la marca."
  },
  contact: {
    path: "/contacto",
    formNote:
      "El contacto humano se gestiona mediante el formulario del sitio. No inventes teléfonos, emails ni horarios.",
    responseHintPublic:
      "El sitio menciona respuesta inicial en menos de 24 horas laborables como orientación de contacto — no es un SLA contractual ni disponibilidad 24/7."
  },
  blockedClaims: [
    "Acronis",
    "24/7",
    "garantía de uptime",
    "cero fallos",
    "protección total",
    "SLA / RPO / RTO específicos no verificados",
    "precios no publicados",
    "certificaciones o partnerships no verificados"
  ],
  escalationTriggers: [
    "presupuesto o precio",
    "compromiso contractual",
    "información no presente en el conocimiento verificado",
    "incidente urgente aparente",
    "petición explícita de hablar con una persona",
    "condiciones comerciales",
    "investigación de cuenta o infraestructura privada"
  ]
});

function buildKnowledgeContextBlock() {
  const k = ARGOS_KNOWLEDGE;
  const services = k.services
    .map((s) => `- ${s.title} (${s.slug}): ${s.summary}`)
    .join("\n");
  const publicPhases = k.method.publicPhases
    .map((p) => `- ${p.name}: ${p.idea}`)
    .join("\n");
  return [
    `Identidad: ${k.identity.name}. Posicionamiento exacto: «${k.identity.positioningExact}»`,
    `Naturaleza: ${k.identity.nature}`,
    `Puente método: ${k.method.dualBridge}`,
    `Fases públicas:\n${publicPhases}`,
    `Fases operativas A.R.G.O.S.: ${k.method.operationalPhases.join(" → ")}`,
    `Pilares: ${k.pillars.join(", ")}`,
    `Servicios:\n${services}`,
    `Diagnóstico: ${k.diagnostic.role} Asistente: ${k.diagnostic.assistantRole}`,
    `Mascotas: Dumbo=${k.mascots.dumbo}, Chico=${k.mascots.chico}. ${k.mascots.note}`,
    `Contacto: ruta ${k.contact.path}. ${k.contact.formNote}`,
    `Claims bloqueados: ${k.blockedClaims.join("; ")}`,
    `Escalar a humano cuando: ${k.escalationTriggers.join("; ")}.`
  ].join("\n\n");
}

module.exports = {
  ARGOS_KNOWLEDGE,
  buildKnowledgeContextBlock
};
