/**
 * Port registry snapshot for platform governance (foundation).
 * Canonical YAML: docs/platform/port-registry.yaml
 */
const PORT_REGISTRY = Object.freeze([
  {
    service: "frontend",
    port: 3000,
    protocol: "tcp",
    exposure: "public_via_edge",
    purpose: "Next.js UI",
    owner: "frontend",
    status: "CURRENT"
  },
  {
    service: "backend",
    port: 4000,
    protocol: "tcp",
    exposure: "private_or_api_hostname",
    purpose: "Express API",
    owner: "backend",
    status: "CURRENT"
  },
  {
    service: "postgres",
    port: 5432,
    protocol: "tcp",
    exposure: "private",
    purpose: "TRANSACTIONAL store",
    owner: "data",
    status: "CURRENT"
  },
  {
    service: "otel-collector",
    port: 4317,
    protocol: "tcp",
    exposure: "private",
    purpose: "OTLP ingest",
    owner: "platform",
    status: "TARGET_V1"
  },
  {
    service: "prometheus",
    port: 9090,
    protocol: "tcp",
    exposure: "private",
    purpose: "metrics engine",
    owner: "platform",
    status: "TARGET_V1"
  },
  {
    service: "grafana",
    port: 3001,
    protocol: "tcp",
    exposure: "private_noc_only",
    purpose: "internal dashboards",
    owner: "platform",
    status: "TARGET_ADOPT_LATER"
  },
  {
    service: "minio",
    port: 9000,
    protocol: "tcp",
    exposure: "private",
    purpose: "OBJECT store",
    owner: "platform",
    status: "TARGET_MVP"
  }
]);

function listCurrentPorts() {
  return PORT_REGISTRY.filter((p) => p.status === "CURRENT");
}

function assertNoPublicAdminTargets(entries = PORT_REGISTRY) {
  const bad = entries.filter(
    (p) =>
      p.status === "CURRENT" &&
      (p.service === "postgres" || p.service === "prometheus" || p.service === "grafana") &&
      String(p.exposure).includes("public")
  );
  return { ok: bad.length === 0, bad };
}

module.exports = { PORT_REGISTRY, listCurrentPorts, assertNoPublicAdminTargets };
