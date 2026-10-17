/**
 * Platform telemetry interface — no-op by default.
 * When OTEL_EXPORTER_OTLP_ENDPOINT is set in a future gate, a real exporter may be wired.
 * Does not redefine customer health semantics.
 */

const startedAt = Date.now();

/**
 * @param {string} name
 * @param {Record<string, string|number|boolean|undefined>} [attributes]
 */
function emitPlatformEvent(name, attributes = {}) {
  if (process.env.ARGOS_PLATFORM_TELEMETRY_LOG === "1") {
    console.info(
      JSON.stringify({
        kind: "argos.platform.event",
        name: String(name),
        attributes,
        at: new Date().toISOString()
      })
    );
  }
  // No OTel dependency in foundation — avoid boot-time require hangs.
}

function getPlatformProcessSnapshot() {
  const mem = process.memoryUsage();
  return {
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    rssBytes: mem.rss,
    heapUsedBytes: mem.heapUsed,
    nodeVersion: process.version,
    pid: process.pid,
    schedulerEnabled: process.env.ENABLE_MONITOR_SCHEDULER !== "false",
    otelEndpointConfigured: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    meaning:
      "Process snapshot only. Does not imply customer estates are healthy."
  };
}

module.exports = { emitPlatformEvent, getPlatformProcessSnapshot };
