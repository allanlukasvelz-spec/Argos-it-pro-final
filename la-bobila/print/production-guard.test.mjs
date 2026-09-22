import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assertProductionBuild } from "./production-guard.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(resolve(root, "catalog/catalog.json"), "utf8"));

test("la build de desarrollo no dispara el guard", () => {
  const result = assertProductionBuild(catalog, { NODE_ENV: "development" });
  assert.equal(result.skipped, true);
});

test("una build de producción que apunta a localhost falla", () => {
  assert.throws(
    () => assertProductionBuild(catalog, { LA_BOBILA_BUILD: "production" }),
    /BUILD_PRODUCTION_LOCALHOST/,
  );
  const run = spawnSync(process.execPath, ["la-bobila/print/production-guard.mjs"], {
    cwd: resolve(root, ".."),
    env: { ...process.env, LA_BOBILA_BUILD: "production", NODE_ENV: "production" },
    encoding: "utf8",
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /BUILD_PRODUCTION_LOCALHOST/);
});
