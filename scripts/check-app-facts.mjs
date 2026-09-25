#!/usr/bin/env node
/* ================================================================
   Checks every app fact against the app repo at one commit.

     node scripts/check-app-facts.mjs [--repo <path>] [--sha <sha>]

   Reads lib/app-facts.sources.json (kept in sync with lib/app-facts.ts by
   test/app-facts.test.ts) and, for each fact, reads the file with
   `git show <sha>:<path>`, never the working tree, so an uncommitted edit
   in the app can't pass or fail the check. A fact passes when, within 3
   lines of its line:
     - its value is a whole string literal ("More", not the "More" in
       `onMore`), or whole sentences of one: a value ending in . ? ! or …
       may sit inside a longer literal, starting and ending at sentence
       breaks. An interpolation counts as a literal's edge;
     - or, when the fact has a `source`, that source appears anywhere.
   Both sides are compared after normalizing:
     - curly and straight apostrophes and quotes;
     - Swift escapes like \u{2019};
     - Swift interpolations \(...) and format specifiers (%d, %@) against
       the fact's {placeholders}; \(.applicationName) reads as "fathom";
     - string concatenation across lines ("..." + "...") and multi-line
       string continuations (a trailing backslash).
   A `countOf` fact passes when that literal occurs `value` times in the
   file. Prints every mismatch and exits 1 if there is any.

   No dependencies: Node's own modules and git.
   ================================================================ */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FACTS_FILE = resolve(here, "../lib/app-facts.sources.json");
const DEFAULT_REPO = "/Users/ryanhiggins/apps/project-homer/.worktrees/device-test";
const WINDOW = 3;
const HOLE = "\u0000";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--repo" || a === "--sha" || a === "--facts") {
      const v = argv[++i];
      if (!v) throw new Error(`${a} needs a value`);
      args[a.slice(2)] = v;
    } else if (a.startsWith("--repo=")) args.repo = a.slice(7);
    else if (a.startsWith("--sha=")) args.sha = a.slice(6);
    else if (a.startsWith("--facts=")) args.facts = a.slice(8);
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

/** Replaces each Swift interpolation \( ... ), nested parens included. */
function replaceInterpolations(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "(") {
      let depth = 0;
      let j = i + 1;
      for (; j < s.length; j++) {
        if (s[j] === "(") depth++;
        else if (s[j] === ")" && --depth === 0) break;
      }
      const inner = s.slice(i + 2, j).trim();
      out += inner === ".applicationName" ? "fathom" : HOLE;
      i = j;
    } else {
      out += s[i];
    }
  }
  return out;
}

/** Normalizes a window of source text. */
function normalizeSource(text) {
  let s = text;
  // "..." + "..." across lines, either side of the newline.
  s = s.replace(/"\s*\+\s*"/g, "");
  // Multi-line string literal continuation: a trailing backslash.
  s = s.replace(/\\\n\s*/g, "");
  // \u{2019} and friends.
  s = s.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
  s = replaceInterpolations(s);
  s = s.replace(/%(\d+\$)?(l{0,2}d|@|s|f|i|u)/g, HOLE);
  return normalizeCommon(s);
}

/** Normalizes a fact's value or source text. */
function normalizeFact(text) {
  let s = String(text);
  s = s.replace(/\{\w+\}/g, HOLE);
  // A `source` written in Swift form carries its own interpolations.
  s = s.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
  s = replaceInterpolations(s);
  return normalizeCommon(s);
}

function normalizeCommon(s) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ");
}

const SENTENCE_END = /[.?!…]"?$/;

/**
 * True when `needle` sits in `text` as a whole string literal, or as whole
 * sentences inside one. A plain substring when `anywhere` (a `source`).
 */
function quotedIn(text, needle, anywhere) {
  if (anywhere) return text.includes(needle);
  const sentences = SENTENCE_END.test(needle);
  for (let at = text.indexOf(needle); at >= 0; at = text.indexOf(needle, at + 1)) {
    const before = text.slice(Math.max(0, at - 2), at);
    const after = text.charAt(at + needle.length);
    const edgeBefore = before.endsWith('"') || before.endsWith(HOLE);
    const edgeAfter = after === '"' || after === HOLE;
    const sentenceBefore = sentences && /[.?!…]"? $/.test(text.slice(Math.max(0, at - 3), at));
    const sentenceAfter = sentences && after === " ";
    if ((edgeBefore || sentenceBefore) && (edgeAfter || sentenceAfter)) return true;
  }
  return false;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node scripts/check-app-facts.mjs [--repo <path>] [--sha <sha>] [--facts <json>]");
    return 0;
  }
  const factsFile = args.facts ? resolve(args.facts) : FACTS_FILE;
  const data = JSON.parse(readFileSync(factsFile, "utf8"));
  const repo = args.repo ?? DEFAULT_REPO;
  const sha = args.sha ?? data.source?.commit ?? "ba8e462";

  const git = (...a) =>
    execFileSync("git", ["-C", repo, ...a], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  let fullSha;
  try {
    fullSha = git("rev-parse", "--verify", `${sha}^{commit}`).trim();
  } catch {
    console.error(`check-app-facts: ${sha} is not a commit in ${repo}.`);
    return 2;
  }

  const files = new Map();
  const readAt = (path) => {
    if (!files.has(path)) {
      try {
        files.set(path, git("show", `${fullSha}:${path}`));
      } catch {
        files.set(path, null);
      }
    }
    return files.get(path);
  };

  const failures = [];
  for (const f of data.facts) {
    const file = readAt(f.path);
    if (file === null) {
      failures.push(`${f.key}: ${f.path} does not exist at ${sha}.`);
      continue;
    }
    if (f.countOf) {
      const count = file.split(f.countOf).length - 1;
      if (count !== Number(f.value)) {
        failures.push(`${f.key}: expected ${f.value} × "${f.countOf}" in ${f.path}, found ${count}.`);
      }
      continue;
    }
    const lines = file.split("\n");
    if (f.line < 1 || f.line > lines.length) {
      failures.push(`${f.key}: line ${f.line} is past the end of ${f.path} (${lines.length} lines).`);
      continue;
    }
    const anywhere = f.source !== undefined;
    const needle = normalizeFact(f.source ?? f.value);
    const from = Math.max(0, f.line - 1 - WINDOW);
    const to = Math.min(lines.length, f.line + WINDOW);
    const windowText = normalizeSource(lines.slice(from, to).join("\n"));
    if (quotedIn(windowText, needle, anywhere)) continue;

    // Say where it went, if it's still in the file.
    const found = [];
    for (let i = 0; i < lines.length; i++) {
      const slice = normalizeSource(lines.slice(Math.max(0, i - WINDOW), i + WINDOW + 1).join("\n"));
      if (quotedIn(slice, needle, anywhere) && normalizeSource(lines[i]).includes(needle.slice(0, 12))) {
        found.push(i + 1);
      }
    }
    const where = found.length ? ` It is at line ${found.slice(0, 5).join(", ")}.` : " It is not in the file.";
    const what = anywhere ? `"${f.source}"` : `the literal "${f.value}"`;
    failures.push(`${f.key}: ${what} is not within ${WINDOW} lines of ${f.path}:${f.line}.${where}`);
  }

  const checked = data.facts.length;
  if (failures.length) {
    console.error(`check-app-facts: ${failures.length} of ${checked} facts do not match ${repo} at ${sha}:`);
    for (const line of failures) console.error(`  - ${line}`);
    return 1;
  }
  console.log(`check-app-facts: all ${checked} facts match ${sha} (${fullSha.slice(0, 12)}) in ${repo}.`);
  return 0;
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(`check-app-facts: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 2;
}
