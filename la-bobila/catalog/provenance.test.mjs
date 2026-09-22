import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validate } from "./validate.mjs";

const catalogPath = resolve(dirname(fileURLToPath(import.meta.url)), "catalog.json");
const CURRENT = "LB-ASSET-MENU-CURRENT-001";
const HISTORICAL = "LB-ASSET-MENU-HISTORICAL-001";

function load() {
  return JSON.parse(readFileSync(catalogPath, "utf8"));
}

test("SOURCE PROVENANCE: el catálogo vigente no cruza las cartas", () => {
  const catalog = load();
  assert.doesNotThrow(() => validate(catalog));
  assert.equal(JSON.stringify(catalog.historico).includes(CURRENT), false);
  for (const item of catalog.historico.items) {
    assert.equal(JSON.stringify(item).includes(CURRENT), false, item.id);
    if (item.precio_historico) assert.equal(item.precio_historico.source, HISTORICAL);
  }
  for (const product of catalog.productos) {
    if (product.precio?.status === "CONFIRMADO_SOURCE") {
      assert.equal(product.precio.source, CURRENT, product.id);
      assert.notEqual(product.precio.source, HISTORICAL);
    }
  }
});

test("falla si un registro HISTORICO cita la carta vigente", () => {
  const catalog = load();
  catalog.historico.items[0].precio_historico.source = CURRENT;
  assert.throws(() => validate(catalog), /HISTORICO cita LB-ASSET-MENU-CURRENT-001/);
});

test("falla si un precio CONFIRMADO_SOURCE cita la carta histórica", () => {
  const catalog = load();
  const product = catalog.productos.find((item) => item.precio?.status === "CONFIRMADO_SOURCE");
  product.precio.source = HISTORICAL;
  assert.throws(() => validate(catalog), /cita la carta histórica/);
});
