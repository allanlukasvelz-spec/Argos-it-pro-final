import type {
  DemoAlert,
  DemoAsset,
  DemoIncident,
  DemoOrganization,
  HonestyLabel,
  RemediationAction,
  VerifiedItem
} from "./types";

export const PLATFORM_MAP_BASE = "/platform-map";

export const MASTER_TAGLINE = "Una plataforma. Tres experiencias. Un núcleo. Un Postgres.";

export const CROSSING_RULE = [
  "El visitante no entra al portal operativo.",
  "El cliente no entra al Control Center.",
  "El staff no se hace pasar por el cliente."
] as const;

export const METHOD_PHASES = [
  { slug: "analizar", name: "Analizar", letter: "A" },
  { slug: "reforzar", name: "Reforzar", letter: "R" },
  { slug: "guiar", name: "Guiar", letter: "G" },
  { slug: "optimizar", name: "Optimizar", letter: "O" },
  { slug: "supervisar", name: "Supervisar", letter: "S" }
] as const;

export const COMMERCIAL_MOVEMENTS = ["Analizamos", "Ordenamos", "Protegemos", "Acompañamos"] as const;

export const PUBLIC_SERVICES = [
  {
    slug: "consultoria-it",
    name: "Consultoría IT",
    summary: "Lectura externa del entorno digital: qué está frágil, qué puede esperar y qué conviene decidir ahora."
  },
  {
    slug: "mantenimiento-informatico",
    name: "Mantenimiento informático",
    summary: "Continuidad operativa: actualizaciones, copias, incidencias y un ritmo que no depende de urgencias."
  },
  {
    slug: "seguridad-informatica",
    name: "Seguridad informática",
    summary: "Reducir superficie de riesgo: accesos, exposición, copias verificables y criterios claros de respuesta."
  },
  {
    slug: "web-wordpress",
    name: "Web y WordPress",
    summary: "Presencia corporativa estable: claridad, rendimiento percibido y un sitio que se puede mantener."
  },
  {
    slug: "automatizacion-ia",
    name: "Automatización e IA",
    summary: "Automatizar solo donde reduce fricción real, con control humano en los puntos de riesgo."
  },
  {
    slug: "auditoria-digital",
    name: "Auditoría digital",
    summary: "Fotografía ordenada del estado actual: hallazgos priorizados, no un informe ornamental."
  }
] as const;

export const HOME_SECTIONS = [
  { id: "hero", title: "Hero + diagnóstico" },
  { id: "realidad", title: "Realidad del cliente" },
  { id: "filosofia", title: "Filosofía" },
  { id: "principios", title: "Principios" },
  { id: "metodo", title: "Método" },
  { id: "servicios", title: "Seis servicios" },
  { id: "estabilidad", title: "Estabilidad" },
  { id: "confianza", title: "Confianza humana" },
  { id: "cta", title: "CTA final" }
] as const;

export const CLIENT_NAV = [
  { href: "/platform-map/client", label: "Resumen", slug: "" },
  { href: "/platform-map/client/activos", label: "Mis activos", slug: "activos" },
  { href: "/platform-map/client/monitorizacion", label: "Monitorización", slug: "monitorizacion" },
  { href: "/platform-map/client/seguridad", label: "Seguridad", slug: "seguridad" },
  { href: "/platform-map/client/alertas", label: "Alertas", slug: "alertas" },
  { href: "/platform-map/client/incidentes", label: "Incidentes", slug: "incidentes" },
  { href: "/platform-map/client/prevencion", label: "Prevención", slug: "prevencion" },
  { href: "/platform-map/client/auditorias", label: "Auditorías", slug: "auditorias" },
  { href: "/platform-map/client/informes", label: "Informes", slug: "informes" },
  { href: "/platform-map/client/soporte", label: "Soporte", slug: "soporte" },
  { href: "/platform-map/client/cuenta", label: "Cuenta", slug: "cuenta" }
] as const;

export const CLIENT_ASSET_TYPES = [
  { slug: "dominios", type: "domain", label: "Dominios" },
  { slug: "websites", type: "website", label: "Websites" },
  { slug: "servidores", type: "server", label: "Servidores" },
  { slug: "apis", type: "api", label: "APIs" },
  { slug: "bases-de-datos", type: "database", label: "Bases de datos" },
  { slug: "servicios", type: "service", label: "Servicios" },
  { slug: "certificados-tls", type: "tls", label: "Certificados TLS" }
] as const;

export const CLIENT_QUESTIONS = [
  "¿Estoy protegido?",
  "¿Hay riesgo?",
  "¿Hay incidentes?",
  "¿Qué se ha prevenido?",
  "¿Necesito hacer algo?",
  "¿Qué servicios están protegidos?"
] as const;

export const NOC_NAV = [
  {
    group: "Operaciones",
    items: [
      { href: "/platform-map/noc", label: "Command Center" },
      { href: "/platform-map/noc/organizations", label: "Organizations" },
      { href: "/platform-map/noc/assets", label: "Assets" },
      { href: "/platform-map/noc/health", label: "Global Health" },
      { href: "/platform-map/noc/monitoring", label: "Monitoring" },
      { href: "/platform-map/noc/alerts", label: "Alerts" },
      { href: "/platform-map/noc/incidents", label: "Incidents" }
    ]
  },
  {
    group: "Infra",
    items: [
      { href: "/platform-map/noc/tls", label: "TLS" },
      { href: "/platform-map/noc/servers", label: "Servers" },
      { href: "/platform-map/noc/databases", label: "Databases" },
      { href: "/platform-map/noc/dns", label: "DNS" },
      { href: "/platform-map/noc/backups", label: "Backups" }
    ]
  },
  {
    group: "Automatización",
    items: [
      { href: "/platform-map/noc/predicted-risks", label: "Predicted Risks" },
      { href: "/platform-map/noc/preventive-actions", label: "Preventive Actions" },
      { href: "/platform-map/noc/agents", label: "Agents" },
      { href: "/platform-map/noc/runbooks", label: "Runbooks" },
      { href: "/platform-map/noc/remediations", label: "Remediations" },
      { href: "/platform-map/noc/reports", label: "Reports" }
    ]
  },
  {
    group: "Plataforma",
    items: [
      { href: "/platform-map/noc/audit", label: "Audit Log" },
      { href: "/platform-map/noc/platform-health", label: "Platform Health" },
      { href: "/platform-map/noc/support", label: "Support" }
    ]
  }
] as const;

export const AUTOMATION_LEVELS = [
  {
    id: "L0" as const,
    name: "Observar",
    meaning: "Solo lectura. Ninguna acción automática ni sugerida se ejecuta.",
    auto: false
  },
  {
    id: "L1" as const,
    name: "Sugerir",
    meaning: "ARGOS propone. Un humano decide y ejecuta.",
    auto: false
  },
  {
    id: "L2" as const,
    name: "Asistir",
    meaning: "Puede preparar la acción. La ejecución sigue siendo humana.",
    auto: false
  },
  {
    id: "L3" as const,
    name: "ApprovalGate",
    meaning: "Nunca AUTO FIX. Requiere aprobación humana explícita antes de ejecutar.",
    auto: false,
    gate: true
  },
  {
    id: "L4" as const,
    name: "Intervención humana",
    meaning: "Nunca automático. Intervención humana obligatoria. Sin atajos.",
    auto: false,
    humanOnly: true
  }
];

export const DEMO_ORGANIZATIONS: DemoOrganization[] = [
  {
    id: "org-a",
    name: "DEMO Organization A",
    slug: "demo-org-a",
    domain: "demo-org-a.example",
    protection: "WARNING",
    protectionNote: "PROTECTED no se afirma: hay evidencia DEMO de un certificado con desajuste. UNKNOWN no se pinta como HEALTHY."
  },
  {
    id: "org-b",
    name: "DEMO Organization B",
    slug: "demo-org-b",
    domain: "demo-org-b.example",
    protection: "UNKNOWN",
    protectionNote: "Sin evidencia suficiente. UNKNOWN. No se muestra como protegido ni como sano."
  }
];

export const DEMO_ASSETS: DemoAsset[] = [
  {
    id: "asset-a-web",
    organizationId: "org-a",
    type: "website",
    name: "www.demo-org-a.example",
    status: "WARNING",
    summary: "Sitio corporativo DEMO. El certificado no coincide con el hostname canónico."
  },
  {
    id: "asset-a-domain",
    organizationId: "org-a",
    type: "domain",
    name: "demo-org-a.example",
    status: "UNKNOWN",
    summary: "Dominio DEMO. Cobertura DNS observada de forma incompleta."
  },
  {
    id: "asset-a-tls",
    organizationId: "org-a",
    type: "tls",
    name: "TLS demo-org-a.example",
    status: "WARNING",
    summary: "Hostname mismatch DEMO. No se afirma PROTECTED."
  },
  {
    id: "asset-a-api",
    organizationId: "org-a",
    type: "api",
    name: "api.demo-org-a.example",
    status: "UNKNOWN",
    summary: "API DEMO. Último check sin evidencia suficiente."
  },
  {
    id: "asset-a-db",
    organizationId: "org-a",
    type: "database",
    name: "db-demo-a",
    status: "UNKNOWN",
    summary: "Base DEMO. Sin observación reciente verificable."
  },
  {
    id: "asset-a-srv",
    organizationId: "org-a",
    type: "server",
    name: "srv-demo-a-01",
    status: "UNKNOWN",
    summary: "Servidor DEMO. Heartbeat de agente no presente."
  },
  {
    id: "asset-a-svc",
    organizationId: "org-a",
    type: "service",
    name: "correo-demo-a",
    status: "UNKNOWN",
    summary: "Servicio DEMO. Fuera de cobertura afirmada."
  },
  {
    id: "asset-b-web",
    organizationId: "org-b",
    type: "website",
    name: "www.demo-org-b.example",
    status: "UNKNOWN",
    summary: "Sitio DEMO de otra organización. Sin mezclar con Organization A."
  },
  {
    id: "asset-b-tls",
    organizationId: "org-b",
    type: "tls",
    name: "TLS demo-org-b.example",
    status: "UNKNOWN",
    summary: "Sin evidencia. UNKNOWN."
  }
];

export const DEMO_ALERTS: DemoAlert[] = [
  {
    id: "alert-a-tls",
    organizationId: "org-a",
    title: "TLS hostname mismatch",
    severity: "WARNING",
    status: "OPEN",
    assetId: "asset-a-tls"
  },
  {
    id: "alert-b-unknown",
    organizationId: "org-b",
    title: "Coverage gap — no recent check",
    severity: "WARNING",
    status: "OPEN",
    assetId: "asset-b-web"
  }
];

export const DEMO_INCIDENTS: DemoIncident[] = [
  {
    id: "inc-a-tls",
    organizationId: "org-a",
    title: "Protección HTTPS desalineada en demo-org-a.example",
    severity: "WARNING",
    status: "INVESTIGATING",
    alertId: "alert-a-tls"
  }
];

export const DEMO_REMEDIATION: RemediationAction[] = [
  {
    id: "A",
    title: "Reemitir certificado para el hostname canónico",
    level: "L2",
    evidence: "El certificado presentado cubre un SAN distinto al hostname canónico demo-org-a.example.",
    hypothesis: "El origen sirve un certificado residual de un alias anterior.",
    confidence: "MEDIUM",
    alternatives: ["Acción B: corregir el vhost / SNI", "Acción C: intervención humana en el emisor"],
    expectedResult: "El hostname canónico presenta un certificado coincidente en el próximo check TLS.",
    risk: "Puede interrumpir HTTPS durante la reemisión si el emisor no está preparado.",
    failureSignal: "El siguiente check TLS sigue reportando hostname mismatch.",
    actionB: "Alinear SNI/vhost al certificado ya emitido.",
    actionC: "Escalar a intervención humana L3/L4 con ApprovalGate.",
    rollback: "Restaurar el certificado anterior documentado. No borrar el residual hasta verificar."
  },
  {
    id: "B",
    title: "Alinear SNI y virtual host al certificado vigente",
    level: "L3",
    evidence: "Tras A, el mismatch persiste. El handshake sigue ofreciendo el SAN residual.",
    hypothesis: "El origen responde con un vhost incorrecto para el SNI canónico.",
    confidence: "MEDIUM",
    alternatives: ["Acción C: intervención humana en el emisor y DNS"],
    expectedResult: "SNI canónico sirve el certificado correcto.",
    risk: "Cambio de vhost puede afectar a un alias todavía en uso.",
    failureSignal: "El check TLS posterior a B sigue en mismatch.",
    actionC: "ApprovalGate L3 + intervención humana. Nunca AUTO FIX.",
    rollback: "Revertir el vhost al estado capturado en evidencia."
  },
  {
    id: "C",
    title: "Intervención humana: emisor, DNS y corte controlado",
    level: "L4",
    evidence: "A y B fallaron. La evidencia apunta a un corte entre emisor, DNS y origen.",
    hypothesis: "Hay un desajuste operativo que no se resuelve con una sola acción remota.",
    confidence: "LOW",
    alternatives: ["Safe Stop", "Rollback", "Escalate"],
    expectedResult: "Un operador cierra el desajuste con evidencia nueva. No hay ejecución automática.",
    risk: "Intervención más amplia. Requiere ApprovalGate y presencia humana.",
    failureSignal: "Cualquier automatismo intentado en L4. Eso está prohibido.",
    rollback: "Safe Stop inmediato. No continuar la cadena."
  }
];

export const PUBLIC_APIS: VerifiedItem[] = [
  { id: "contact", name: "/api/contact", label: "CURRENT", verifiedIn: "backend/server.js + routes/contact" },
  { id: "ai-public", name: "/api/ai/public", label: "CURRENT", verifiedIn: "backend/server.js + routes/ai-public" },
  { id: "assistant", name: "/api/assistant", label: "CURRENT", verifiedIn: "backend/server.js + routes/assistant" },
  { id: "live", name: "/api/live", label: "CURRENT", verifiedIn: "backend/server.js GET /api/live" },
  { id: "ready", name: "/api/ready", label: "CURRENT", verifiedIn: "backend/server.js GET /api/ready" },
  { id: "health", name: "/api/health", label: "CURRENT", verifiedIn: "backend/server.js GET /api/health" }
];

export const CLIENT_APIS: VerifiedItem[] = [
  { id: "portal", name: "/api/client/portal", label: "CURRENT", verifiedIn: "routes/client.js GET /portal", note: "TENANT_REQUIRED" },
  { id: "assets", name: "/api/client/assets", label: "CURRENT", verifiedIn: "routes/clientAssets.js", note: "TENANT_REQUIRED" },
  { id: "discover", name: "/api/client/domains/discover", label: "CURRENT", verifiedIn: "routes/clientAssets.js POST /domains/discover", note: "TENANT_REQUIRED" },
  { id: "tls", name: "/api/client/tls", label: "CURRENT", verifiedIn: "routes/clientAssets.js", note: "TENANT_REQUIRED" },
  { id: "monitoring", name: "/api/client/monitoring", label: "CURRENT", verifiedIn: "routes/clientMonitoring.js", note: "TENANT_REQUIRED" },
  { id: "health", name: "/api/client/health", label: "CURRENT", verifiedIn: "routes/clientMonitoring.js", note: "TENANT_REQUIRED" },
  { id: "monitors", name: "/api/client/monitors", label: "CURRENT", verifiedIn: "routes/clientMonitoring.js", note: "TENANT_REQUIRED" },
  { id: "alerts", name: "/api/client/alerts", label: "CURRENT", verifiedIn: "routes/clientMonitoring.js", note: "TENANT_REQUIRED" },
  { id: "incidents", name: "/api/client/incidents", label: "CURRENT", verifiedIn: "routes/clientMonitoring.js", note: "TENANT_REQUIRED" },
  { id: "improvements", name: "/api/client/improvements", label: "CURRENT", verifiedIn: "routes/client.js POST /improvements", note: "TENANT_REQUIRED" },
  { id: "messages", name: "/api/client/messages", label: "CURRENT", verifiedIn: "routes/client.js POST /messages", note: "TENANT_REQUIRED" },
  { id: "diagnostics", name: "/api/client/diagnostics", label: "CURRENT", verifiedIn: "routes/clientDiagnostics.js", note: "TENANT_REQUIRED" },
  { id: "notifications", name: "/api/client/notifications", label: "CURRENT", verifiedIn: "routes/clientNotifications.js", note: "TENANT_REQUIRED" },
  { id: "evidence", name: "/api/client/evidence", label: "CURRENT", verifiedIn: "routes/clientEvidence.js", note: "TENANT_REQUIRED" },
  { id: "guardian", name: "/api/client/guardian", label: "CURRENT", verifiedIn: "routes/clientGuardian.js", note: "TENANT_REQUIRED" },
  { id: "reports", name: "/api/client/reports", label: "CURRENT", verifiedIn: "routes/clientReports.js", note: "TENANT_REQUIRED" },
  {
    id: "client-ai",
    name: "/api/client/ai",
    label: "TARGET",
    note: "No existe bajo /api/client. El AI autenticado actual vive en /api/ai, no en este path.",
    verifiedIn: "backend/server.js (ausencia verificada)"
  }
];

export const INTERNAL_APIS: VerifiedItem[] = [
  { id: "noc-root", name: "/api/noc/...", label: "CURRENT", note: "requireNocAccess", verifiedIn: "backend/server.js + routes/noc.js" },
  { id: "noc-remediation", name: "/api/noc remediations / runbooks / approvals", label: "CURRENT", note: "requireNocAccess", verifiedIn: "routes/nocRemediation.js" },
  { id: "noc-agents", name: "/api/noc agents", label: "CURRENT", note: "requireNocAccess", verifiedIn: "routes/nocAgents.js" },
  { id: "noc-evidence", name: "/api/noc/evidence", label: "CURRENT", note: "requireNocAccess", verifiedIn: "routes/nocEvidence.js" },
  { id: "noc-reports", name: "/api/noc reports", label: "CURRENT", note: "requireNocAccess", verifiedIn: "routes/nocReports.js" }
];

export const AGENT_APIS: VerifiedItem[] = [
  { id: "enroll", name: "/api/agent/v1/enroll", label: "CURRENT", verifiedIn: "routes/agentV1.js POST /enroll" },
  { id: "heartbeat", name: "/api/agent/v1/heartbeat", label: "CURRENT", verifiedIn: "routes/agentV1.js POST /heartbeat" },
  { id: "observations", name: "/api/agent/v1/observations", label: "CURRENT", verifiedIn: "routes/agentV1.js POST /observations" },
  { id: "rotate", name: "/api/agent/v1/rotate", label: "CURRENT", verifiedIn: "routes/agentV1.js POST /rotate", note: "Rotación de credencial. No está en el árbol canónico mínimo." }
];

export const OUTSIDE_PRODUCT: VerifiedItem[] = [
  { id: "explainer", name: "/explainer", label: "CURRENT", note: "OUTSIDE PRODUCT — lab de explicación, no marketing ni portal." },
  { id: "mascot-lab", name: "/mascot-motion-lab", label: "CURRENT", note: "OUTSIDE PRODUCT — laboratorio de motion. No es producto." },
  { id: "api-test", name: "/api/test", label: "CURRENT", note: "OUTSIDE PRODUCT — solo entorno de desarrollo.", verifiedIn: "backend/server.js (dev only)" },
  { id: "staging-harness", name: "/api/staging-harness", label: "CURRENT", note: "OUTSIDE PRODUCT — solo staging.", verifiedIn: "backend/server.js (staging only)" }
];

export const DATA_MODEL: { group: string; tables: VerifiedItem[] }[] = [
  {
    group: "IDENTIDAD",
    tables: [
      { id: "users", name: "users", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "refresh_sessions", name: "refresh_sessions", label: "CURRENT", verifiedIn: "database/schema.sql" }
    ]
  },
  {
    group: "TENANCY",
    tables: [
      { id: "organizations", name: "organizations", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "organization_members", name: "organization_members", label: "CURRENT", verifiedIn: "database/schema.sql" }
    ]
  },
  {
    group: "INVENTARIO",
    tables: [
      { id: "assets", name: "assets", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "tls_certificates", name: "tls_certificates", label: "CURRENT", verifiedIn: "database/schema.sql" }
    ]
  },
  {
    group: "OBSERVACIÓN",
    tables: [
      { id: "monitors", name: "monitors", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "monitor_checks", name: "monitor_checks", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "observations", name: "observations", label: "CURRENT", verifiedIn: "database/schema.sql" }
    ]
  },
  {
    group: "OPERACIÓN",
    tables: [
      { id: "alerts", name: "alerts", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "incidents", name: "incidents", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "incident_events", name: "incident_events", label: "CURRENT", verifiedIn: "database/schema.sql" }
    ]
  },
  {
    group: "REMEDIACIÓN",
    tables: [
      { id: "runbooks", name: "runbooks", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "runbook_versions", name: "runbook_versions", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "remediation_executions", name: "remediation_executions", label: "CURRENT", verifiedIn: "database/schema.sql" },
      {
        id: "approvals",
        name: "approvals",
        label: "CURRENT",
        note: "En schema.sql el nombre real es remediation_approvals.",
        verifiedIn: "database/schema.sql remediation_approvals"
      },
      {
        id: "events",
        name: "events",
        label: "CURRENT",
        note: "En schema.sql el nombre real es remediation_events.",
        verifiedIn: "database/schema.sql remediation_events"
      }
    ]
  },
  {
    group: "AGENTES",
    tables: [
      { id: "agents", name: "agents", label: "CURRENT", verifiedIn: "database/schema.sql" },
      {
        id: "enrollments",
        name: "enrollments",
        label: "CURRENT",
        note: "Nombre real: agent_enrollments.",
        verifiedIn: "database/schema.sql"
      },
      {
        id: "credentials",
        name: "credentials",
        label: "CURRENT",
        note: "Nombre real: agent_credentials.",
        verifiedIn: "database/schema.sql"
      },
      {
        id: "heartbeats",
        name: "heartbeats",
        label: "CURRENT",
        note: "Nombre real: agent_heartbeats.",
        verifiedIn: "database/schema.sql"
      },
      {
        id: "agent_observations",
        name: "observations",
        label: "CURRENT",
        note: "Nombre real: agent_observations. Distinta de observations de monitorización.",
        verifiedIn: "database/schema.sql"
      },
      {
        id: "security_events",
        name: "security_events",
        label: "CURRENT",
        note: "Nombre real: agent_security_events.",
        verifiedIn: "database/schema.sql"
      }
    ]
  },
  {
    group: "EVIDENCIA",
    tables: [{ id: "evidence_objects", name: "evidence_objects", label: "CURRENT", verifiedIn: "database/schema.sql" }]
  },
  {
    group: "PORTAL",
    tables: [
      { id: "client_services", name: "client_services", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "website_audits", name: "website_audits", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "client_improvements", name: "client_improvements", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "client_messages", name: "client_messages", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "form_submissions", name: "form_submissions", label: "CURRENT", verifiedIn: "database/schema.sql" },
      {
        id: "client_diagnostics",
        name: "client_diagnostics",
        label: "CURRENT",
        note: "No está en schema.sql. Se crea en arranque vía ensureClientDiagnosticsTable.",
        verifiedIn: "backend/lib/ensureClientDiagnosticsTable.js"
      }
    ]
  },
  {
    group: "AUDITORÍA",
    tables: [
      { id: "activity_logs", name: "activity_logs", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "security_logs", name: "security_logs", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "ai_memory", name: "ai_memory", label: "CURRENT", verifiedIn: "database/schema.sql" },
      { id: "services", name: "services", label: "CURRENT", verifiedIn: "database/schema.sql" }
    ]
  }
];

export const GLOBAL_ROLES = ["visitante", "cliente", "admin", "super_admin"] as const;
export const ORG_ROLES = ["org_owner", "org_admin", "org_member", "org_viewer"] as const;

export const AUTH_COOKIES = ["argos_access", "argos_refresh"] as const;

export const OPERATIONS_PIPELINE = [
  "Asset",
  "Monitor",
  "Check",
  "Observation",
  "Health Engine",
  "Alert",
  "Incident",
  "Remediation A/B/C",
  "Verify",
  "Resolve / Safe Stop"
] as const;

export const LEGEND_ITEMS: { id: HonestyLabel; meaning: string }[] = [
  { id: "CURRENT", meaning: "Verificado en código o schema de este repositorio." },
  { id: "TARGET", meaning: "Pertenece al árbol canónico. Todavía no está implementado." },
  { id: "DEMO", meaning: "Dato simulado para recorrer la UX. No es evidencia real." },
  { id: "PLACEHOLDER", meaning: "Pantalla reservada. Sin funcionalidad real." },
  { id: "UNKNOWN", meaning: "No hay evidencia suficiente para clasificarlo." }
];

export function countLabels() {
  const items: VerifiedItem[] = [
    ...PUBLIC_APIS,
    ...CLIENT_APIS,
    ...INTERNAL_APIS,
    ...AGENT_APIS,
    ...OUTSIDE_PRODUCT,
    ...DATA_MODEL.flatMap((group) => group.tables)
  ];
  return {
    current: items.filter((item) => item.label === "CURRENT"),
    target: items.filter((item) => item.label === "TARGET"),
    unknown: items.filter((item) => item.label === "UNKNOWN")
  };
}
