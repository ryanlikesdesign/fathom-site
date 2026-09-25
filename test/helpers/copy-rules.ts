/* ================================================================
   Copy rules for every marketing surface, in one place.

   Each rule is a function from text to the matches that break it, so a
   failing test prints the offending words, not just "false". Callers
   assert `expect(violations(text)).toEqual([])`, or use the regex lists
   directly with `expectNoMatch`.

   The legal pages (privacy, terms, the FAQ privacy answer) are checked
   only with LEGAL_RETIRED, EM_DASH and BRITISH_SPELLINGS: their words are
   frozen, and test/privacy-copy.test.tsx holds them to exactly those.
   Everything else the site writes gets `marketingViolations`.
   ================================================================ */

import { expect } from "vitest";
import {
  AI_MODES,
  APP_FACTS,
  EXAMPLES,
  EXAMPLE_SLOTS,
  SAFETY_SHIELD,
  consentParagraphs,
  flattenFacts,
  type FlatFact,
} from "@/lib/app-facts";

/** Curly and straight apostrophes read the same aloud; compare words only. */
export const words = (s: string) => s.replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();

/** Fails with the pattern that matched, one assertion per pattern. */
export function expectNoMatch(text: string, patterns: readonly RegExp[]) {
  for (const re of patterns) expect(text).not.toMatch(re);
}

/* ---------------------------------------------------------------- *
 * Rules the legal pages share (their expectations never change)
 * ---------------------------------------------------------------- */

export const EM_DASH = /—/;

/** The British spellings the legal pages were checked for. Unchanged, on purpose. */
export const BRITISH_SPELLINGS = /\b(metre|colour|labelled|cancelled|organis|recognis|licence)/i;

/** Claims 1.3 no longer makes, as the legal pages must not word them. */
export const LEGAL_RETIRED: readonly RegExp[] = [
  // "Live Task" is "Live mode", and the microphone is no longer a held button.
  /Live Task/,
  /microphone button/,
  // On-device AI still allows analytics, so "nothing to the cloud" is not exact.
  /nothing to the cloud/,
  /Snapshot/,
  // Only the backend stores nothing; the phone keeps goals and memories.
  /and its backend store none/i,
];

/* ---------------------------------------------------------------- *
 * Marketing rules
 * ---------------------------------------------------------------- */

/**
 * British spellings for new copy: the legal list as whole words (so
 * "organism" passes), plus more. Whole words, so "realistic" passes too.
 */
const MORE_BRITISH =
  /\b(metres?|colour(s|ed|ful|ing)?|labelled|cancelled|organis(e|ed|es|ing|ation|ations)|recognis(e|ed|es|ing|able)|licences?|centre[sd]?|favourite[sd]?|behaviour[s]?|honour|neighbour(hood)?s?|travell(ed|ing|er)|analys(e|ed|es|ing)|catalogue|programme[sd]?|practis(e|ed|es|ing)|realis(e|ed|es|ing)|apologis(e|ed|ing)|customis(e|ed|es|ing)|prioritis(e|ed|es|ing)|summaris(e|ed|es|ing)|optimis(e|ed|es|ing)|minimis(e|ed|es|ing)|grey|litres?|tyres?|kerb)\b/i;

/** Where a capitalized "Fathom" is right: the App Store name and Apple's own label. */
export const FATHOM_CASE_EXCEPTIONS: readonly string[] = [
  "Fathom: Visual Assistance",
  // iOS Settings, Subscriptions: Apple shows the StoreKit name.
  "choose Fathom",
];

/**
 * Retired names and claims. Each is either a 1.2 name (Snapshot, Live
 * Task, the held mic) or a claim the app can't back (unlimited, any
 * building, GPS routing, "nothing leaves").
 */
export const RETIRED_TERMS: readonly RegExp[] = [
  /\bsnapshot/i,
  /\blive task/i,
  /\bhold to talk\b/i,
  /\bhold the button\b/i,
  /\bmicrophone button\b/i,
  /\bfree forever\b/i,
  /\bunlimited\b/i,
  /\bzoom/i,
  /\bhigh[- ]resolution\b/i,
  /\bany building\b/i,
  /\bany destination\b/i,
  /\bindoor maps?\b/i,
  /\bGPS routing\b/i,
  /\bnothing leaves\b/i,
  // The truth plan's wording fixes: fathom is not a pair of eyes and promises nothing.
  /\bsecond (set|pair) of eyes\b/i,
  /\bguarantee/i,
];

/** "stays on your phone", except inside the exact On-device AI sentence. */
const STAYS_ON_PHONE = /\bstays? on your (phone|iPhone)\b/i;

/** "always on" is reserved for the one fact that can't change. */
const ALWAYS_ON = /\balways[- ]on\b/i;
const ALWAYS_ON_ALLOWED = "Obstacle alerts are always on";

export type Violation = { rule: string; match: string };

const allMatches = (text: string, re: RegExp): string[] => {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  return [...text.matchAll(new RegExp(re.source, flags))].map((m) => m[0]);
};

export function emDashes(text: string): string[] {
  return allMatches(text, EM_DASH);
}

/** New copy. The legal pages keep BRITISH_SPELLINGS, unchanged. */
export function britishSpellings(text: string): string[] {
  return allMatches(text, MORE_BRITISH);
}

/** Capitalized or uppercase "Fathom" outside the exceptions. */
export function capitalizedFathom(text: string, extraExceptions: readonly string[] = []): string[] {
  let rest = text;
  for (const ok of [...FATHOM_CASE_EXCEPTIONS, ...extraExceptions]) rest = rest.split(ok).join(" ");
  return allMatches(rest, /\b(Fathom|FATHOM)\b/);
}

export function retiredTerms(text: string): string[] {
  const hits = RETIRED_TERMS.flatMap((re) => allMatches(text, re));
  const withoutOnDevice = text.split(AI_MODES.onDeviceSummary.value).join(" ");
  return [...hits, ...allMatches(withoutOnDevice, STAYS_ON_PHONE)];
}

export function alwaysOnMisuse(text: string): string[] {
  return allMatches(text.split(ALWAYS_ON_ALLOWED).join(" "), ALWAYS_ON);
}

/** No "Beta" in anything a person sees (design system README). */
export function betaLabel(text: string): string[] {
  return allMatches(text, /\bbeta\b/i);
}

/** Curly quotes and apostrophes only. */
export function straightQuotes(text: string): string[] {
  return allMatches(text, /['"]/);
}

/** Every marketing rule at once. Empty means the text passes. */
export function marketingViolations(
  text: string,
  opts: { fathomExceptions?: readonly string[]; allowStraightQuotes?: boolean } = {},
): Violation[] {
  const out: Violation[] = [];
  const add = (rule: string, matches: string[]) => matches.forEach((match) => out.push({ rule, match }));
  add("em dash", emDashes(text));
  add("British spelling", britishSpellings(text));
  add("capitalized Fathom", capitalizedFathom(text, opts.fathomExceptions));
  add("retired term", retiredTerms(text));
  add("always on", alwaysOnMisuse(text));
  add("beta", betaLabel(text));
  if (!opts.allowStraightQuotes) add("straight quote", straightQuotes(text));
  return out;
}

/** The one "always on" line, for callers that want to find it. */
export const ALWAYS_ON_LINE = SAFETY_SHIELD.value;

/* ---------------------------------------------------------------- *
 * Inside the phone: only app strings and marked examples
 * ---------------------------------------------------------------- */

/** Every string in a nested object, in order. */
export function stringsIn(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(stringsIn);
  if (node && typeof node === "object") return Object.values(node).flatMap(stringsIn);
  return [];
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const oneOf = (xs: readonly string[]) => `(?:${xs.map(escapeRe).join("|")})`;

/**
 * What each `{placeholder}` may hold inside a phone. Counts take one to
 * three digits; names take only EXAMPLE_SLOTS values, so "Heading to the
 * moon…" fails while "Heading to the laundry room…" passes. A fact with a
 * placeholder not listed here is never a phone string (PLAN.readback's
 * {itinerary} is spoken, not drawn).
 */
export const PLACEHOLDERS: Readonly<Record<string, string>> = {
  n: "\\d{1,3}",
  total: "\\d{1,3}",
  checked: "\\d{1,3}",
  steps: "steps?",
  ...Object.fromEntries(Object.entries(EXAMPLE_SLOTS).map(([name, values]) => [name, oneOf(values)])),
};

const placeholdersIn = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

/**
 * Facts a phone may show. A fact with `source` or `countOf` is code (MIN_IOS,
 * PLUS_GATE) or a piece of a longer literal, never a string on screen; a
 * fact with a placeholder PLACEHOLDERS doesn't list is spoken only.
 */
export function phoneFacts(): FlatFact[] {
  return flattenFacts(APP_FACTS).filter(
    (f) =>
      typeof f.value === "string" &&
      f.source === undefined &&
      f.countOf === undefined &&
      placeholdersIn(f.value).every((name) => Object.hasOwn(PLACEHOLDERS, name)),
  );
}

/** A whole-string regex for a fact value, its placeholders limited by name. */
function factPattern(value: string): RegExp {
  const parts = value.split(/(\{\w+\})/);
  const body = parts
    .map((part) => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1];
      return name ? PLACEHOLDERS[name] : escapeRe(part);
    })
    .join("");
  return new RegExp(`^${body}$`);
}

let matchers: { patterns: RegExp[]; exact: Set<string> } | undefined;

/** Fact patterns, plus every EXAMPLES string and consent paragraph exactly. */
function phoneMatchers() {
  matchers ??= {
    patterns: phoneFacts().map((f) => factPattern(String(f.value))),
    exact: new Set([...stringsIn(EXAMPLES), ...consentParagraphs()].map((s) => s.replace(/\s+/g, " ").trim())),
  };
  return matchers;
}

/**
 * True when a text node inside `.phone-screen` is an app string (a fact,
 * its `{placeholders}` filled only as PLACEHOLDERS allows), an EXAMPLES
 * string, or one paragraph of the consent pop-up.
 */
export function isPhoneString(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return true;
  const { patterns, exact } = phoneMatchers();
  return exact.has(t) || patterns.some((re) => re.test(t));
}
