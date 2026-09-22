/** Headless Chrome capture for an A3 sheet. Shared by export and the architecture study. */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chromeBin = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.next = 1;
    this.pending = new Map();
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolveCall, rejectCall } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) rejectCall(new Error(JSON.stringify(message.error)));
        else resolveCall(message.result);
      }
    });
  }

  send(method, params = {}) {
    const id = this.next++;
    return new Promise((resolveCall, rejectCall) => {
      this.pending.set(id, { resolveCall, rejectCall });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function debugTarget(port) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const page = list.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome is still starting.
    }
    await sleep(150);
  }
  throw new Error("Chrome no abrió el puerto de depuración.");
}

export async function withSheet(url, fn) {
  const port = 9347 + (process.pid % 1000);
  const profile = `/tmp/lb-chrome-${process.pid}-${Date.now()}`;
  const chrome = spawn(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--allow-file-access-from-files",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    url,
  ], { stdio: "ignore" });

  try {
    const wsUrl = await debugTarget(port);
    const ws = new WebSocket(wsUrl);
    await new Promise((resolveOpen, rejectOpen) => {
      ws.addEventListener("open", resolveOpen);
      ws.addEventListener("error", () => rejectOpen(new Error("WebSocket de Chrome falló.")));
    });
    const cdp = new Cdp(ws);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    const result = await fn(cdp);
    ws.close();
    return result;
  } finally {
    chrome.kill("SIGKILL");
  }
}

export async function preparePrint(cdp) {
  await cdp.send("Emulation.setEmulatedMedia", { media: "print" });
  await cdp.send("Runtime.evaluate", {
    expression: `Promise.all([
      document.fonts.ready,
      ...[...document.images].map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = img.onerror = resolve; }))
    ]).then(() => true)`,
    awaitPromise: true,
  });
}

export const METRICS_EXPRESSION = `(() => {
  const pxToMm = (px) => px / (96 / 25.4);
  const mm = (px) => Number(pxToMm(px).toFixed(2));
  const sheet = document.querySelector(".sheet");
  const sheetRect = sheet.getBoundingClientRect();
  const inner = document.querySelector(".sheet__inner");
  const kids = [...inner.children];
  const last = kids[kids.length - 1].getBoundingClientRect();
  const crea = document.querySelector(".lb-crea");
  const sample = crea.querySelector(".lb-crea__slot") || crea;
  const sampleCs = getComputedStyle(sample);
  const sampleLh = sampleCs.lineHeight.endsWith("px") ? parseFloat(sampleCs.lineHeight) : parseFloat(sampleCs.fontSize) * 1.35;
  const lists = [...crea.querySelectorAll(".lb-crea__list")].map((list) => {
    const slot = list.querySelector(".lb-crea__slot");
    const cs = getComputedStyle(slot || list);
    const lh = cs.lineHeight.endsWith("px") ? parseFloat(cs.lineHeight) : parseFloat(cs.fontSize) * 1.35;
    const height = list.getBoundingClientRect().height;
    return {
      group: list.closest("[data-grupo]")?.dataset.grupo || "",
      heightMm: mm(height),
      lines: lh ? Math.max(1, Math.round(height / lh)) : 0,
      items: list.querySelectorAll(".lb-crea__slot").length,
    };
  });
  const zones = [...document.querySelectorAll("[data-zone]")].map((node) => {
    const rect = node.getBoundingClientRect();
    const text = node.querySelector(".lb-row .lb-name, .lb-crea__slot, .lb-note") || node;
    const cs = getComputedStyle(text);
    const lh = cs.lineHeight.endsWith("px") ? parseFloat(cs.lineHeight) : null;
    const content = node.querySelector(".pizza-names, .lb-rows, .lb-crea__expanded, .lb-crea__grid");
    const used = content ? content.getBoundingClientRect().height : rect.height;
    return {
      zone: node.dataset.zone,
      availableMm: mm(rect.height),
      usedMm: mm(used),
      occupancy: rect.height ? Number((used / rect.height).toFixed(3)) : null,
      fontMm: mm(parseFloat(cs.fontSize)),
      lineHeightMm: lh == null ? null : mm(lh),
      rows: node.querySelectorAll(".lb-row").length,
      slots: node.querySelectorAll(".lb-crea__slot").length,
      pastSheet: rect.bottom > sheetRect.bottom + 1,
    };
  });
  const veg = crea.querySelector('[data-grupo="vegetales"] .lb-crea__slot');
  const vegPrice = crea.querySelector('[data-grupo="vegetales"] .lb-crea__price');
  let priceDistanceMm = null;
  if (veg && vegPrice) {
    const a = veg.getBoundingClientRect();
    const b = vegPrice.getBoundingClientRect();
    priceDistanceMm = mm(Math.hypot((a.left + a.width / 2) - (b.left + b.width / 2), (a.top + a.height / 2) - (b.top + b.height / 2)));
  }
  const pizza = document.querySelector('[data-zone="pizzes"]');
  const names = pizza?.querySelector(".pizza-names");
  return {
    architecture: sheet.dataset.architecture,
    palette: sheet.dataset.palette,
    sheet: { w: mm(sheetRect.width), h: mm(sheetRect.height) },
    stackPastMm: mm(last.bottom - sheetRect.bottom),
    overflow: last.bottom > sheetRect.bottom + 1,
    crea: {
      w: mm(crea.getBoundingClientRect().width),
      h: mm(crea.getBoundingClientRect().height),
      fontMm: mm(parseFloat(sampleCs.fontSize)),
      lineHeightMm: mm(sampleLh),
      slots: crea.querySelectorAll(".lb-crea__slot").length,
      groups: crea.querySelectorAll(".lb-crea__group").length,
      maxLines: lists.reduce((max, list) => Math.max(max, list.lines), 0),
      priceDistanceMm,
      lists,
    },
    pizza: pizza ? { availableMm: mm(pizza.getBoundingClientRect().height), usedMm: names ? mm(names.getBoundingClientRect().height) : null } : null,
    smash: zones.find((zone) => zone.zone === "smash") || null,
    zones,
  };
})()`;

export async function captureMetrics(cdp) {
  await preparePrint(cdp);
  const box = await cdp.send("Runtime.evaluate", {
    expression: METRICS_EXPRESSION,
    returnByValue: true,
  });
  return box.result.value;
}

export async function captureFiles(cdp, { pdfPath, pngPath }) {
  const box = await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const sheet = document.querySelector(".sheet").getBoundingClientRect();
      return { width: sheet.width, height: sheet.height };
    })()`,
    returnByValue: true,
  });
  const metrics = box.result.value;
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: Math.ceil(metrics.width),
    height: Math.ceil(metrics.height),
    deviceScaleFactor: 1,
    mobile: false,
  });
  if (pdfPath) {
    const pdf = await cdp.send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
      paperWidth: 303 / 25.4,
      paperHeight: 426 / 25.4,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      displayHeaderFooter: false,
    });
    writeFileSync(pdfPath, Buffer.from(pdf.data, "base64"));
  }
  if (pngPath) {
    const shot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      fromSurface: true,
      clip: { x: 0, y: 0, width: metrics.width, height: metrics.height, scale: 2 },
    });
    writeFileSync(pngPath, Buffer.from(shot.data, "base64"));
  }
  return metrics;
}
