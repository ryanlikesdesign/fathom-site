#!/usr/bin/env node
// Generate design-system/generated/* from the vendored design system and the
// hand-authored extensions.
//
//   node scripts/ds/build.mjs          write the generated files
//   node scripts/ds/build.mjs --check  exit 1 if a generated file is stale, or a
//                                      vendored file no longer matches SOURCE.json
//
// No dependencies. The pure work lives in build-lib.mjs.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAll } from "./build-lib.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const DS_DIR = path.join(ROOT, "design-system");

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/** Read every input the generator needs. */
export function readInputs(dsDir = DS_DIR) {
  const logosDir = path.join(dsDir, "vendor/logos");
  const svgs = Object.fromEntries(
    readdirSync(logosDir)
      .filter((f) => f.endsWith(".svg"))
      .map((f) => [f, readFileSync(path.join(logosDir, f), "utf8")]),
  );
  const sourceFile = path.join(dsDir, "SOURCE.json");
  return {
    tokens: readJson(path.join(dsDir, "vendor/tokens.json")),
    motion: readJson(path.join(dsDir, "extensions/motion.json")),
    contrastBoost: readJson(path.join(dsDir, "extensions/contrast-boost.json")),
    typeWeb: readJson(path.join(dsDir, "extensions/type-web.json")),
    siteRoles: readJson(path.join(dsDir, "extensions/site-roles.json")),
    source: existsSync(sourceFile) ? readJson(sourceFile) : null,
    svgs,
  };
}

export function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

/** Vendored files whose bytes differ from the hashes SOURCE.json pinned. */
export function vendorDrift(dsDir = DS_DIR) {
  const sourceFile = path.join(dsDir, "SOURCE.json");
  if (!existsSync(sourceFile)) return ["SOURCE.json is missing: run npm run ds:sync"];
  const { files = {} } = readJson(sourceFile);
  const problems = [];
  for (const [rel, hash] of Object.entries(files)) {
    const file = path.join(dsDir, rel);
    if (!existsSync(file)) problems.push(`${rel} is missing`);
    else if (sha256(file) !== hash) problems.push(`${rel} differs from SOURCE.json (edited by hand? change the design system, then npm run ds:sync)`);
  }
  const vendorDir = path.join(dsDir, "vendor");
  const listed = new Set(Object.keys(files));
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.relative(dsDir, path.join(dir, e.name))],
    );
  for (const rel of walk(vendorDir)) {
    if (!listed.has(rel) && !rel.endsWith(".DS_Store")) problems.push(`${rel} is not pinned in SOURCE.json`);
  }
  return problems;
}

export function build({ check = false, dsDir = DS_DIR, log = console.log } = {}) {
  const outputs = generateAll(readInputs(dsDir));
  const stale = [];
  for (const [rel, text] of Object.entries(outputs)) {
    const file = path.join(dsDir, rel);
    const current = existsSync(file) ? readFileSync(file, "utf8") : null;
    if (current === text) continue;
    stale.push(rel);
    if (!check) writeFileSync(file, text);
  }
  if (check) {
    const drift = vendorDrift(dsDir);
    for (const rel of stale) log(`stale: design-system/${rel} (run npm run ds:build)`);
    for (const p of drift) log(`vendor: ${p}`);
    if (stale.length || drift.length) return 1;
    log(`ds:check: ${Object.keys(outputs).length} generated files are current; vendored files match SOURCE.json.`);
    return 0;
  }
  log(stale.length ? `ds:build: wrote ${stale.map((r) => `design-system/${r}`).join(", ")}` : "ds:build: generated files already current.");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = build({ check: process.argv.includes("--check") });
  } catch (err) {
    console.error(`ds:build failed: ${err.message}`);
    process.exitCode = 1;
  }
}
