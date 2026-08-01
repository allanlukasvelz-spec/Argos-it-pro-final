#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
const files = walk(root);
const hrefs = new Set();

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  let m;
  hrefRe.lastIndex = 0;
  while ((m = hrefRe.exec(html))) {
    const h = m[1].trim();
    if (h.startsWith("http") || h.startsWith("mailto:") || h.startsWith("tel:") || h.startsWith("#") || h.startsWith("javascript:"))
      continue;
    hrefs.add(h);
  }
}

const out = path.join(root, "internal-links.inventory.txt");
const lines = [...hrefs].sort().join("\n");
fs.writeFileSync(out, `# Generado por tools/extract-hrefs.mjs\n# ${files.length} archivos HTML\n\n${lines}\n`);
console.log(`Escrito ${out} (${hrefs.size} enlaces relativos únicos)`);
