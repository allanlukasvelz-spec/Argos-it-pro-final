#!/usr/bin/env node
/** Writes carta-a3.html, then PDF and PNG via the system Chrome DevTools protocol. */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeHtml } from "./render.mjs";

const printDir = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(printDir, "carta-a3.html");
const outDir = resolve(printDir, "renders");
const pdfPath = resolve(outDir, "carta-a3.pdf");
const pngPath = resolve(outDir, "carta-a3.png");
const chromeBin = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";
const port = 9347;

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

async function debugTarget() {
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

async function main() {
  mkdirSync(outDir, { recursive: true });
  writeHtml();
  const fileUrl = pathToFileURL(htmlPath).href;
  const profile = `/tmp/lb-chrome-${process.pid}`;
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
    fileUrl,
  ], { stdio: "ignore" });

  try {
    const wsUrl = await debugTarget();
    const ws = new WebSocket(wsUrl);
    await new Promise((resolveOpen, rejectOpen) => {
      ws.addEventListener("open", resolveOpen);
      ws.addEventListener("error", () => rejectOpen(new Error("WebSocket de Chrome falló.")));
    });
    const cdp = new Cdp(ws);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setEmulatedMedia", { media: "print" });
    await cdp.send("Runtime.evaluate", {
      expression: "document.fonts.ready.then(() => document.querySelector('.lb-brand__name') !== null)",
      awaitPromise: true,
    });
    const fonts = await cdp.send("Runtime.evaluate", {
      expression: `document.fonts.ready.then(async () => {
        const nameEl = document.querySelector(".lb-brand__name");
        const ingredientEl = document.querySelector(".lb-ingredients");
        const name = nameEl ? getComputedStyle(nameEl).fontFamily : null;
        const ingredients = ingredientEl ? getComputedStyle(ingredientEl).fontFamily : null;
        return { name, ingredients, fraunces: document.fonts.check("500 16px Fraunces"), sans: document.fonts.check("400 16px 'Source Sans 3'") };
      })`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log("fonts", JSON.stringify(fonts.result.value));
    const box = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const sheet = document.querySelector(".sheet").getBoundingClientRect();
        const zones = [...document.querySelectorAll("[data-zone]")].map((node) => {
          const rect = node.getBoundingClientRect();
          return { zone: node.dataset.zone, h: rect.height };
        });
        const overflow = [...document.querySelectorAll("[data-zone], .lb-crea__list, .pizza-names, .lb-rows")].map((node) => ({
          zone: node.dataset.zone || node.className,
          client: node.clientHeight,
          scroll: node.scrollHeight,
          clipped: node.scrollHeight > node.clientHeight + 1,
        }));
        return { width: sheet.width, height: sheet.height, zones, overflow };
      })()`,
      returnByValue: true,
    });
    const metrics = box.result.value;
    console.log("sheet_px", metrics.width, metrics.height);
    console.log("zones", JSON.stringify(metrics.zones));
    console.log("overflow", JSON.stringify(metrics.overflow));
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: Math.ceil(metrics.width),
      height: Math.ceil(metrics.height),
      deviceScaleFactor: 1,
      mobile: false,
    });
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
    const shot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      fromSurface: true,
      clip: {
        x: 0,
        y: 0,
        width: metrics.width,
        height: metrics.height,
        scale: 2,
      },
    });
    writeFileSync(pngPath, Buffer.from(shot.data, "base64"));
    ws.close();
    console.log("pdf", pdfPath);
    console.log("png", pngPath);
  } finally {
    chrome.kill("SIGKILL");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
