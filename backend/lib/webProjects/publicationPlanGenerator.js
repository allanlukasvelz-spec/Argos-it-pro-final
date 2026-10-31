const { unwrapValue } = require("./formRuntime");

function generatePublicationSteps(input) {
  const {
    projectType,
    formValues,
    publicationHandoffPayload,
    websiteHostname
  } = input;
  const values = formValues || new Map();
  const hasExistingSite = unwrapValue(values.get("has_existing_site")) === "yes";
  const salesMode = unwrapValue(values.get("sales_mode"));
  const legalNotice = unwrapValue(values.get("legal_notice")) === "yes";
  const legalPrivacy = unwrapValue(values.get("legal_privacy")) === "yes";
  const legalCookies = unwrapValue(values.get("legal_cookies")) === "yes";
  const warnings = publicationHandoffPayload?.warnings || [];

  const steps = [];
  let sort = 0;
  const push = (spec) => {
    steps.push({ ...spec, sort_order: sort++ });
  };

  push({
    step_type: "PRELAUNCH_REVIEW",
    title: "Revisión pre-lanzamiento",
    description: "Confirmar handoff de validación, alcance y hostname objetivo.",
    priority: "CRITICAL",
    required: true
  });
  push({
    step_type: "HOSTING_PREP",
    title: "Preparación de hosting",
    description: "Entorno de producción preparado (sin ejecutar deploy desde ARGOS).",
    priority: "HIGH",
    required: true
  });
  push({
    step_type: "DNS_PREP",
    title: "Preparación DNS",
    description: "Registros DNS documentados y listos para cutover controlado.",
    priority: "HIGH",
    required: true
  });
  push({
    step_type: "SSL_CERT",
    title: "Certificado SSL",
    description: "TLS/SSL verificado en staging o producción según runbook.",
    priority: "HIGH",
    required: true
  });
  push({
    step_type: "STAGING_VERIFY",
    title: "Verificación en staging",
    description: "Smoke test en entorno previo a producción.",
    priority: "HIGH",
    required: true
  });

  if (projectType === "create" || projectType === "improve") {
    push({
      step_type: "CONTENT_MIGRATION",
      title: "Migración de contenido",
      description: "Contenido final cargado o migrado según plan aprobado.",
      priority: "HIGH",
      required: projectType === "create"
    });
  }

  if (hasExistingSite || projectType === "improve") {
    push({
      step_type: "REDIRECTS",
      title: "Redirecciones y URLs legacy",
      description: "Mapa de redirecciones 301/410 documentado.",
      priority: "HIGH",
      required: true
    });
  }

  if (["contact_forms", "online_booking", "ecommerce"].includes(salesMode)) {
    push({
      step_type: "INTEGRATIONS",
      title: "Integraciones de producción",
      description: `Verificar integración (${salesMode}) en entorno final.`,
      priority: "HIGH",
      required: true
    });
  }

  push({
    step_type: "ANALYTICS",
    title: "Analytics",
    description: "Etiquetado / consentimiento según decisión del proyecto.",
    priority: "MEDIUM",
    required: false
  });
  push({
    step_type: "MONITORING",
    title: "Monitorización post-lanzamiento",
    description: "Checks de disponibilidad configurados fuera de ARGOS si aplica.",
    priority: "MEDIUM",
    required: false
  });
  push({
    step_type: "SEO_LAUNCH",
    title: "SEO de lanzamiento",
    description: "Meta, sitemap, robots y canonicals verificados.",
    priority: "HIGH",
    required: true
  });

  if (legalNotice || legalPrivacy || legalCookies) {
    push({
      step_type: "LEGAL_LAUNCH",
      title: "Legal en producción",
      description: "Aviso legal, privacidad y cookies publicados.",
      priority: "HIGH",
      required: true
    });
  }

  push({
    step_type: "SMOKE_TEST",
    title: "Smoke test final",
    description: "Rutas críticas, formularios y CTAs en producción/staging final.",
    priority: "CRITICAL",
    required: true
  });
  push({
    step_type: "CLIENT_HANDOFF",
    title: "Entrega al cliente",
    description: "Cliente informado; credenciales y documentación entregadas.",
    priority: "HIGH",
    required: true
  });
  push({
    step_type: "POST_LAUNCH",
    title: "Seguimiento post-lanzamiento",
    description: "Ventana de observación inicial (48–72h).",
    priority: "LOW",
    required: false
  });

  if (websiteHostname) {
    for (const step of steps) {
      if (step.step_type === "DNS_PREP") {
        step.description = `${step.description} Hostname objetivo: ${websiteHostname}.`;
      }
    }
  }

  if (warnings.length) {
    for (const step of steps) {
      if (step.step_type === "PRELAUNCH_REVIEW") {
        step.description = `${step.description} Advertencias de validación: ${warnings.length}.`;
      }
    }
  }

  return steps;
}

module.exports = {
  generatePublicationSteps
};
