"use strict";

const fs = require("fs");
const path = require("path");
const { evaluateReleaseBuild } = require("./releaseBuildEnv");

const root = path.join(__dirname, "..", "frontend");
const names = [".env", ".env.production", ".env.local", ".env.production.local"];
const files = {};
for (const name of names) {
  const file = path.join(root, name);
  if (fs.existsSync(file)) files[name] = fs.readFileSync(file, "utf8");
}

const result = evaluateReleaseBuild({ env: process.env, files });
if (!result.required) {
  console.log("RELEASE_BUILD_ENV SKIPPED");
  process.exit(0);
}
console.log(`RELEASE_BUILD_ENV ${result.status} ${result.kind}`);
process.exit(result.status === "PASS" ? 0 : 1);
