#!/usr/bin/env node
/** Local dev server. Binds to 127.0.0.1 only. GET / redirects to /carta. */

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.LA_BOBILA_PORT || 4173);
const host = "127.0.0.1";

const files = new Map([
  ["/carta", { path: resolve(root, "mobile/carta.html"), type: "text/html; charset=utf-8" }],
  ["/carta/", { path: resolve(root, "mobile/carta.html"), type: "text/html; charset=utf-8" }],
  ["/assets/tokens.css", { path: resolve(root, "tokens/tokens.css"), type: "text/css; charset=utf-8" }],
  ["/assets/mobile.css", { path: resolve(root, "mobile/carta.css"), type: "text/css; charset=utf-8" }],
]);

function fontFile(urlPath) {
  if (!urlPath.startsWith("/assets/fonts/")) return null;
  const name = basename(urlPath);
  if (!/^[\w.-]+$/.test(name)) return null;
  return { path: resolve(root, "tokens/fonts", name), type: name.endsWith(".ttf") ? "font/ttf" : "text/plain" };
}

export function createCartaServer() {
  return createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${host}`);
    if (url.pathname === "/") {
      res.writeHead(302, { Location: "/carta" });
      res.end();
      return;
    }
    const hit = files.get(url.pathname) || fontFile(url.pathname);
    if (!hit) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("No trobat");
      return;
    }
    try {
      const body = readFileSync(hit.path);
      res.writeHead(200, { "Content-Type": hit.type, "Cache-Control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("No trobat");
    }
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const server = createCartaServer();
  server.listen(port, host, () => {
    console.log(`http://${host}:${port}/carta`);
  });
}
