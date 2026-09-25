#!/usr/bin/env node
// Vendor the app's design system into design-system/vendor/, pin it in
// design-system/SOURCE.json, print what changed, then run the build.
//
//   FATHOM_DS_DIR=/path/to/docs/design-system node scripts/ds/sync.mjs
//
// The source defaults to the app's reference checkout,
// ~/apps/project-homer/.worktrees/device-test/docs/design-system.
// It refuses a source with uncommitted changes, so the pin is always a commit.
//
// Only tokens.json and the current logos are copied. README, components.md and
// the changelog are never vendored: they hold internal detail, and this repo is
// public. No dependencies.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { diffTokens } from "./build-lib.mjs";
import { build, DS_DIR, sha256 } from "./build.mjs";

const DEFAULT_SOURCE = path.join(os.homedir(), "apps/project-homer/.worktrees/device-test/docs/design-system");

/** Every file vendored, relative to the source's design-system folder. */
export const VENDORED = [
  "tokens.json",
  ...["lockup", "logotype", "lockup-mark", "mark", "mark-32", "mark-24", "mark-16"].flatMap((base) => [
    `assets/logos/fathom-${base}-ink.svg`,
    `assets/logos/fathom-${base}-bone.svg`,
  ]),
  "assets/logos/fathom-app-icon.svg",
  "assets/logos/fathom-app-icon.png",
];

/** Where each file lands, relative to design-system/. */
const destination = (rel) => (rel === "tokens.json" ? "vendor/tokens.json" : `vendor/logos/${path.basename(rel)}`);

const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();

/** Show a path under the home folder as ~/…, so SOURCE.json carries no user name. */
const tilde = (p) => {
  const home = os.homedir();
  return p === home || p.startsWith(home + path.sep) ? `~${p.slice(home.length)}` : p;
};

function fail(message) {
  console.error(`ds:sync: ${message}`);
  process.exit(1);
}

function main() {
  const source = path.resolve(process.env.FATHOM_DS_DIR ?? DEFAULT_SOURCE);
  if (!existsSync(path.join(source, "tokens.json"))) fail(`no tokens.json in ${source} (set FATHOM_DS_DIR)`);

  let top;
  try {
    top = git(source, "rev-parse", "--show-toplevel");
  } catch {
    fail(`${source} is not inside a git checkout, so it cannot be pinned`);
  }
  const dsRel = path.relative(top, source) || ".";
  const dirty = git(top, "status", "--porcelain", "--", dsRel);
  if (dirty) fail(`the source has uncommitted changes in ${dsRel}; commit or stash them first:\n${dirty}`);

  const missing = VENDORED.filter((rel) => !existsSync(path.join(source, rel)));
  if (missing.length) fail(`missing in the source: ${missing.join(", ")}`);

  // Logos the list does not know about yet (legacy/ is skipped on purpose).
  const logosDir = path.join(source, "assets/logos");
  const known = new Set(VENDORED.map((r) => path.basename(r)));
  const unknown = readdirSync(logosDir, { withFileTypes: true })
    .filter((e) => e.isFile() && /\.(svg|png)$/.test(e.name) && !known.has(e.name))
    .map((e) => e.name);

  const previousTokensFile = path.join(DS_DIR, "vendor/tokens.json");
  const previous = existsSync(previousTokensFile) ? JSON.parse(readFileSync(previousTokensFile, "utf8")) : null;

  mkdirSync(path.join(DS_DIR, "vendor/logos"), { recursive: true });
  const files = {};
  for (const rel of VENDORED) {
    const dest = destination(rel);
    copyFileSync(path.join(source, rel), path.join(DS_DIR, dest));
    files[dest] = sha256(path.join(DS_DIR, dest));
  }

  const tokens = JSON.parse(readFileSync(path.join(source, "tokens.json"), "utf8"));
  const changelog = path.join(source, "30-changelog.md");
  const changelogHead = existsSync(changelog)
    ? (readFileSync(changelog, "utf8").split("\n").find((l) => l.startsWith("## ")) ?? "").replace(/^## /, "")
    : null;

  const pin = {
    $comment: "Written by npm run ds:sync. Pins the vendored design system to a commit; npm run ds:check fails if a vendored file stops matching its hash.",
    source: tilde(source),
    repoPath: dsRel,
    repoCommit: git(top, "rev-parse", "HEAD"),
    dsCommit: git(top, "log", "-1", "--format=%H", "--", dsRel),
    dsCommitDate: git(top, "log", "-1", "--format=%cI", "--", dsRel),
    tokensVersion: tokens.meta?.tokensVersion ?? null,
    tokensRef: tokens.meta?.ref ?? null,
    changelogHead,
    files,
    syncedAt: new Date().toISOString(),
  };
  writeFileSync(path.join(DS_DIR, "SOURCE.json"), `${JSON.stringify(pin, null, 2)}\n`);

  console.log(`ds:sync: vendored ${VENDORED.length} files from ${pin.source}`);
  console.log(`  repo ${pin.repoCommit.slice(0, 7)}, design system ${pin.dsCommit.slice(0, 7)} (${pin.dsCommitDate}), changelog ${changelogHead ?? "none"}, tokens ${pin.tokensVersion}`);
  if (unknown.length) console.log(`  not vendored (add to VENDORED in scripts/ds/sync.mjs if wanted): ${unknown.join(", ")}`);

  if (previous) {
    const diff = diffTokens(previous, tokens);
    let any = false;
    for (const [theme, { added, removed, changed }] of Object.entries(diff)) {
      if (!added.length && !removed.length && !changed.length) continue;
      any = true;
      console.log(`  ${theme}:`);
      if (added.length) console.log(`    added   ${added.join(", ")}`);
      if (removed.length) console.log(`    removed ${removed.join(", ")}`);
      for (const [name, a, b] of changed) console.log(`    changed ${name}: ${a} -> ${b}`);
    }
    if (!any) console.log("  tokens: no changes since the last sync");
  } else {
    console.log("  tokens: first sync, nothing to compare");
  }

  process.exitCode = build();
}

main();
