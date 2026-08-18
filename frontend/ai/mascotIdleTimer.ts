/**
 * FASE 21.7A.1 — one-shot idle timeout (no interval sampler).
 * MAX_PENDING_IDLE_TIMEOUTS = 1.
 */

export type MascotIdleTimer = {
  bumpActivity: () => void;
  dispose: () => void;
  pendingCount: () => number;
};

export function createMascotIdleTimer(options: {
  timeoutMs: number;
  onActive: () => void;
  onResting: () => void;
  now?: () => number;
}): MascotIdleTimer {
  const now = options.now ?? (() => Date.now());
  let lastActivityAt = now();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function clear() {
    if (timeoutId == null) return;
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  function schedule() {
    clear();
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (now() - lastActivityAt >= options.timeoutMs) {
        options.onResting();
      }
    }, options.timeoutMs);
  }

  return {
    bumpActivity() {
      lastActivityAt = now();
      options.onActive();
      schedule();
    },
    dispose() {
      clear();
    },
    pendingCount() {
      return timeoutId == null ? 0 : 1;
    }
  };
}
