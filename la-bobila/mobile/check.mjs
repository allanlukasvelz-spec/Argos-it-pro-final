#!/usr/bin/env node
/** Automated checks for /carta and QR_DEV. Device scans are not run here. */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeHtml, loadCatalog } from "../print/render.mjs";
import { writeMobileHtml } from "./render.mjs";
import { createCartaServer } from "./server.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = loadCatalog();
const printPath = writeHtml(catalog);
const mobilePath = writeMobileHtml(catalog);
const printHtml = readFileSync(printPath, "utf8");
const mobileHtml = readFileSync(mobilePath, "utf8");
const mobileCss = readFileSync(resolve(root, "mobile/carta.css"), "utf8");
const failures = [];

function check(name, ok) {
  if (!ok) failures.push(name);
  console.log(`${ok ? "ok" : "FAIL"} ${name}`);
}

check("single catalog file", !existsSync(resolve(root, "catalog/catalog-mobile.json")) && !existsSync(resolve(root, "catalog/menu-data.json")));
check("print and mobile share Prosciutto", printHtml.includes("Prosciutto") && mobileHtml.includes("Prosciutto"));
check("print and mobile share Mallorquina", printHtml.includes("Mallorquina") && mobileHtml.includes("Mallorquina"));
check("no invented allergen words", !/\b(gluten|lactosa|fruits secs|cacauet)\b/i.test(printHtml + mobileHtml));
check("no euro prices", !printHtml.includes("€") && !mobileHtml.includes("€"));
check("no public https url", !/https:\/\//.test(printHtml) && !/https:\/\//.test(mobileHtml));
check("dev url only", printHtml.includes("http://127.0.0.1:4173/carta"));
check("qr dev label", printHtml.includes("QR_DEV"));
check("production destination absent", catalog.qr.produccion.destino === null && catalog.qr.produccion.estado === "BLOQUEADO");
check("mobile is html", mobileHtml.startsWith("<!DOCTYPE html>"));
check("mobile has h1 and h2", mobileHtml.includes("<h1") && mobileHtml.includes("<h2"));
check("touch target css", mobileCss.includes("min-height: 44px"));
check("analytics seam inactive", mobileHtml.includes('"activo":false') && mobileHtml.includes("CLO"));
check("no tracker script src", !/script[^>]+src=/.test(mobileHtml));
check("no second catalog string in html generators", !printHtml.includes("catalog-mobile") && !mobileHtml.includes("catalog-print"));
check("dev stamp", printHtml.includes("PROVA / NO IMPRIMIR"));
check("editorial copy separate from logo asset text", printHtml.includes('data-copy="EDITORIAL_COPY"') && printHtml.includes("Pizzeria artesana") && !printHtml.includes("PIZZERIA ARTIGIANALE") && !printHtml.includes("DESDE 2005"));
check("presentation logo placed", printHtml.includes("la-bobila-logo-presentation.png") && mobileHtml.includes("/assets/logo.png"));
check("allergen placeholders are not on dishes", printHtml.includes('data-attached="false"') && mobileHtml.includes('data-attached="false"') && !mobileHtml.includes("m-allergens"));

const server = createCartaServer();
await new Promise((resolveListen) => server.listen(4173, "127.0.0.1", resolveListen));
try {
  const page = await fetch("http://127.0.0.1:4173/carta");
  const body = await page.text();
  const type = page.headers.get("content-type") || "";
  check("route /carta is html", page.status === 200 && type.includes("text/html") && body.startsWith("<!DOCTYPE html>") && !body.startsWith("%PDF"));
  const rootHit = await fetch("http://127.0.0.1:4173/", { redirect: "manual" });
  check("root redirects to /carta", rootHit.status === 302 && rootHit.headers.get("location") === "/carta");
  const css = await fetch("http://127.0.0.1:4173/assets/mobile.css");
  check("mobile css served", css.status === 200);
  const font = await fetch("http://127.0.0.1:4173/assets/fonts/fraunces-500-normal.ttf");
  check("font served", font.status === 200);
} finally {
  server.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("automated checks passed");
