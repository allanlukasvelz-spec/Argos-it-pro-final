const { escapeHtml } = require("./reportEscape");

function renderIncidentSummaryHtml(model) {
  const timelineRows = (model.timeline || [])
    .map(
      (ev) =>
        `<tr><td>${escapeHtml(ev.at)}</td><td>${escapeHtml(ev.kind)}</td><td>${escapeHtml(ev.summary)}</td></tr>`
    )
    .join("");

  const evidenceRows = (model.verifiedEvidence || [])
    .map(
      (ev) =>
        `<tr><td>${escapeHtml(ev.evidenceObjectId)}</td><td>${escapeHtml(ev.sha256?.slice(0, 16))}…</td><td>${escapeHtml(ev.createdAt)}</td><td>${escapeHtml(ev.source)}</td></tr>`
    )
    .join("");

  const unknownList = (model.unknowns || [])
    .map((u) => `<li>${escapeHtml(u)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(model.reportType)} — ${escapeHtml(model.organization?.name)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #0B1320; margin: 0; padding: 24px; font-size: 14px; }
    h1 { color: #1F3A5F; font-size: 22px; margin-bottom: 4px; }
    h2 { color: #1F3A5F; font-size: 16px; margin-top: 24px; border-bottom: 2px solid #2F7D6D; padding-bottom: 4px; }
    .meta { color: #4B5563; font-size: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #D1D5DB; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #EDF2F7; }
    .disclaimer { background: #FEF3C7; border: 1px solid #F59E0B; padding: 10px; margin: 16px 0; font-size: 12px; }
    .unknown { background: #F3F4F6; padding: 10px; }
  </style>
</head>
<body>
  <h1>ARGOS — Informe de incidente</h1>
  <p class="meta">
    Organización: ${escapeHtml(model.organization?.name)} ·
    Referencia: ${escapeHtml(model.reportId)} ·
    Generado: ${escapeHtml(model.generatedAt)} ·
    Corte de datos: ${escapeHtml(model.dataCutoffAt)} ·
    Plantilla: ${escapeHtml(model.templateVersion)}
  </p>
  <div class="disclaimer">
    Este informe refleja el estado conocido por ARGOS en el momento del corte de datos.
    UNKNOWN ≠ saludable. Incidente resuelto ≠ organización totalmente protegida.
  </div>
  <h2>Resumen del incidente</h2>
  <table>
    <tr><th>ID</th><td>${escapeHtml(model.incident?.id)}</td></tr>
    <tr><th>Título</th><td>${escapeHtml(model.incident?.title)}</td></tr>
    <tr><th>Estado</th><td>${escapeHtml(model.incident?.state)}</td></tr>
    <tr><th>Severidad</th><td>${escapeHtml(model.incident?.severity)}</td></tr>
    <tr><th>Abierto</th><td>${escapeHtml(model.incident?.openedAt)}</td></tr>
    <tr><th>Resuelto</th><td>${escapeHtml(model.incident?.resolvedAt || "—")}</td></tr>
  </table>
  <h2>Activo afectado</h2>
  <table>
    <tr><th>Hostname / nombre</th><td>${escapeHtml(model.affectedAsset?.label || "UNKNOWN")}</td></tr>
    <tr><th>Tipo</th><td>${escapeHtml(model.affectedAsset?.type || "UNKNOWN")}</td></tr>
    <tr><th>Estado salud</th><td>${escapeHtml(model.health?.label || "UNKNOWN")}</td></tr>
  </table>
  <h2>Línea temporal</h2>
  <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Resumen</th></tr></thead><tbody>
    ${timelineRows || "<tr><td colspan=\"3\">Sin eventos registrados</td></tr>"}
  </tbody></table>
  <h2>Evidencia verificada (referencias)</h2>
  <table><thead><tr><th>ID evidencia</th><th>SHA-256</th><th>Creado</th><th>Fuente</th></tr></thead><tbody>
    ${evidenceRows || "<tr><td colspan=\"4\">Sin evidencia vinculada</td></tr>"}
  </tbody></table>
  ${
    model.remediationSummary
      ? `<h2>Remediación</h2><p>${escapeHtml(model.remediationSummary)}</p>`
      : ""
  }
  <h2>Datos no disponibles / UNKNOWN</h2>
  <div class="unknown"><ul>${unknownList || "<li>Ninguno</li>"}</ul></div>
</body>
</html>`;
}

module.exports = { renderIncidentSummaryHtml };
