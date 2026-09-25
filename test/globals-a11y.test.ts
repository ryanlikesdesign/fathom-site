// The accessibility blocks in app/globals.css, read as text. Each must exist
// with its load-bearing declarations; restyling may change values around them
// but never drop one. See CLAUDE.md, "Never override the a11y blocks".
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Every block whose prelude matches, as its inner text (braces balanced). */
function blocks(prelude: RegExp): string[] {
  const out: string[] = [];
  const re = new RegExp(prelude.source + String.raw`\s*\{`, "g");
  for (const m of css.matchAll(re)) {
    let depth = 1;
    let i = m.index! + m[0].length;
    const start = i;
    while (depth && i < css.length) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    out.push(css.slice(start, i - 1));
  }
  return out;
}
const one = (prelude: RegExp) => {
  const found = blocks(prelude);
  expect(found.length, `a block for ${prelude}`).toBeGreaterThan(0);
  return found.join("\n");
};
const squash = (s: string) => s.replace(/\s+/g, " ").replace(/\s*([{}:;,])\s*/g, "$1");

describe("globals.css accessibility blocks", () => {
  it("draws a visible focus outline on every interactive element", () => {
    const body = squash(one(/:where\(a, button, input, textarea, select, \[tabindex\]\):focus-visible/));
    expect(body).toMatch(/outline:\S+ solid var\(--[a-z-]*focus-ring[a-z-]*\)/);
    expect(body).toMatch(/outline-offset:\S+/);
  });

  it("kills every animation and transition under reduced motion, scroll-driven ones included", () => {
    const all = blocks(/@media \(prefers-reduced-motion: reduce\)/).map(squash);
    const kill = all.find((b) => b.includes("*,*::before,*::after{"));
    expect(kill, "the global reduced-motion block").toBeDefined();
    for (const decl of [
      "animation-duration:0ms !important",
      "animation-iteration-count:1 !important",
      "transition-duration:0ms !important",
      "scroll-behavior:auto !important",
      "animation-timeline:none !important",
      "animation:none !important",
    ]) {
      expect(kill).toContain(decl);
    }
  });

  it("keeps the skip link off screen until it is focused", () => {
    const rest = squash(one(/\.skip-link/));
    expect(rest).toContain("position:absolute");
    expect(rest).toContain("left:-9999px");
    const focus = squash(one(/\.skip-link:focus/));
    expect(focus).toMatch(/left:[^;-]+/);
    expect(focus).toMatch(/top:/);
  });

  it("raises contrast for prefers-contrast: more, in both themes", () => {
    const body = squash(one(/@media \(prefers-contrast: more\)/));
    expect(body).toMatch(/(\[data-theme="dark"\],:root|:root,\[data-theme="dark"\])\{--[^}]+\}/);
    expect(body).toMatch(/\[data-theme="light"\]\{--[^}]+\}/);
  });

  it("drops the header's blur for prefers-reduced-transparency", () => {
    const body = squash(one(/@media \(prefers-reduced-transparency: reduce\)/));
    expect(body).toContain(".site-header");
    expect(body).toContain("backdrop-filter:none");
    expect(body).toContain("-webkit-backdrop-filter:none");
  });

  it("keeps controls and focus visible in forced colors", () => {
    const body = squash(one(/@media \(forced-colors: active\)/));
    expect(body).toContain(":focus-visible{outline:2px solid Highlight}");
    expect(body).toContain("border:1px solid ButtonText");
    expect(body).toContain("forced-color-adjust:none");
  });

  it("prints on light paper with chrome dropped and reveals finished", () => {
    const body = squash(one(/@media print/));
    expect(body).toMatch(/\.site-header[^{]*\{display:none!important\}/);
    expect(body).toContain(".reveal{opacity:1!important");
    expect(body).toContain('a[href^="http"]::after');
  });
});
