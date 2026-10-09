/**
 * In-process monitor scheduler.
 * ENABLE_MONITOR_SCHEDULER=false disables. Failures never crash the HTTP server.
 */
const { executeMonitorCheck } = require("./executeCheck");

const DEFAULT_TICK_MS = 15000;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_BATCH = 10;

/**
 * @param {import("pg").Pool} pool
 * @param {{ tickMs?: number, concurrency?: number, batchSize?: number, log?: Function }} [options]
 */
function createMonitorScheduler(pool, options = {}) {
  const tickMs = options.tickMs || DEFAULT_TICK_MS;
  const concurrency = options.concurrency || DEFAULT_CONCURRENCY;
  const batchSize = options.batchSize || DEFAULT_BATCH;
  const log = options.log || ((msg, meta) => console.log(`[MONITOR] ${msg}`, meta || ""));

  let timer = null;
  let running = false;
  let stopped = true;

  async function claimDueMonitors() {
    const r = await pool.query(
      `SELECT m.*, a.hostname AS asset_hostname, a.type AS asset_type
       FROM monitors m
       JOIN assets a ON a.id = m.asset_id AND a.organization_id = m.organization_id
       WHERE m.enabled = true
         AND m.status IN ('ACTIVE', 'ERROR')
         AND a.status = 'active'
         AND a.hostname IS NOT NULL
         AND (m.next_check_at IS NULL OR m.next_check_at <= NOW())
       ORDER BY m.next_check_at ASC NULLS FIRST
       LIMIT $1`,
      [batchSize]
    );
    return r.rows;
  }

  async function runOne(monitor) {
    try {
      await executeMonitorCheck(pool, {
        monitor,
        hostname: monitor.asset_hostname
      });
    } catch (err) {
      log("check_failed", {
        monitorId: monitor.id,
        organizationId: monitor.organization_id,
        assetId: monitor.asset_id,
        error: String(err.message || err).slice(0, 200)
      });
      try {
        await pool.query(
          `UPDATE monitors SET status = 'ERROR', next_check_at = NOW() + interval '2 minutes', updated_at = NOW()
           WHERE id = $1 AND organization_id = $2`,
          [monitor.id, monitor.organization_id]
        );
      } catch (_e) {
        /* ignore */
      }
    }
  }

  async function tick() {
    if (running || stopped) return;
    running = true;
    try {
      const due = await claimDueMonitors();
      if (!due.length) return;

      // simple concurrency pool
      let i = 0;
      async function worker() {
        while (i < due.length) {
          const idx = i++;
          await runOne(due[idx]);
        }
      }
      const workers = [];
      for (let w = 0; w < Math.min(concurrency, due.length); w++) {
        workers.push(worker());
      }
      await Promise.all(workers);
    } catch (err) {
      log("tick_error", { error: String(err.message || err).slice(0, 200) });
    } finally {
      running = false;
    }
  }

  function start() {
    if (!stopped) return;
    stopped = false;
    log("scheduler_started", { tickMs, concurrency });
    timer = setInterval(() => {
      tick().catch(() => {});
    }, tickMs);
    if (typeof timer.unref === "function") timer.unref();
    // initial delayed tick
    setTimeout(() => tick().catch(() => {}), 2000 + Math.floor(Math.random() * 3000)).unref?.();
  }

  function stop() {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
  }

  return { start, stop, tick, claimDueMonitors };
}

function isSchedulerEnabled() {
  return process.env.ENABLE_MONITOR_SCHEDULER !== "false";
}

module.exports = {
  createMonitorScheduler,
  isSchedulerEnabled
};
