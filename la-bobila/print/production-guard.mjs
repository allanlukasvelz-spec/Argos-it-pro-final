#!/usr/bin/env node
/** A production build must not target localhost. QR_PRODUCTION stays blocked. */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LOCALHOST = /localhost|127\.0\.0\.1/i;

export function isProductionBuild(env = process.env) {
  return env.NODE_ENV === "production" || env.LA_BOBILA_BUILD === "production";
}

export function localhostDestinations(catalog) {
  const found = [];
  const pairs = [
    ["qr.desarrollo.destino", catalog?.qr?.desarrollo?.destino],
    ["qr.produccion.destino", catalog?.qr?.produccion?.destino],
  ];
  for (const [key, value] of pairs) {
    if (value != null && LOCALHOST.test(String(value))) found.push(`${key}=${value}`);
  }
  return found;
}

export function assertProductionBuild(catalog, env = process.env) {
  if (!isProductionBuild(env)) return { ok: true, skipped: true };
  const found = localhostDestinations(catalog);
  if (found.length) {
    throw new Error(
      `BUILD_PRODUCTION_LOCALHOST: una build de producción no puede apuntar a localhost ni a 127.0.0.1 (${found.join(", ")}). QR_PRODUCTION sigue bloqueado.`,
    );
  }
  if (catalog?.qr?.produccion?.destino != null || catalog?.qr?.produccion?.estado !== "BLOQUEADO") {
    throw new Error("BUILD_PRODUCTION_LOCALHOST: QR_PRODUCTION sigue bloqueado y sin destino.");
  }
  return { ok: true, skipped: false };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const catalog = JSON.parse(readFileSync(resolve(root, "catalog/catalog.json"), "utf8"));
  try {
    const result = assertProductionBuild(catalog);
    console.log(result.skipped ? "guard skipped (not a production build)" : "guard passed");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
