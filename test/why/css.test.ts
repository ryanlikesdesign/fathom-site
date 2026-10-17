// The /why stylesheets, read as text: no blur or dimming effects, no raw
// values, every hidden or stage rule behind the gate, gaps within budget.
import { describe, expect, it } from "vitest";
import { FRAME_TOP, PIVOT_STAGE } from "@/components/why/morph/formations/essay";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The approved pivot ran on its original scroll-timeline CSS (with a 4px
 * word blur) until P4 ported it to the director (scenes/pivot.ts) and
 * deleted the marked block. False: the block may not come back.
 */
const LEGACY_PIVOT_ALLOWED = false;

const read = (f: string) => readFileSync(path.resolve(__dirname, "../../components/why", f), "utf8");
const RAW = { "why.css": read("why.css"), "art.css": read("art.css") };

const LEGACY = /\/\*\s*legacy-pivot:start[\s\S]*?legacy-pivot:end\s*\*\//g;
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const prepared = (s: string) => stripComments(LEGACY_PIVOT_ALLOWED ? s.replace(LEGACY, "") : s);
const FILES = Object.entries(RAW).map(([name, css]) => [name, prepared(css)] as const);

type Rule = { selector: string; body: string; ancestors: string[] };

/** Style rules with their enclosing at-rule preludes. Enough CSS for these files. */
function rules(css: string): Rule[] {
  const out: Rule[] = [];
  const stack: string[] = [];
  let buf = "";
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      const prelude = buf.trim();
      buf = "";
      if (prelude.startsWith("@")) {
        stack.push(prelude.replace(/\s+/g, " "));
        continue;
      }
      let depth = 1;
      let j = i + 1;
      while (depth && j < css.length) {
        if (css[j] === "{") depth++;
        else if (css[j] === "}") depth--;
        j++;
      }
      out.push({ selector: prelude.replace(/\s+/g, " "), body: css.slice(i + 1, j - 1), ancestors: [...stack] });
      i = j - 1;
    } else if (ch === "}") {
      stack.pop();
      buf = "";
    } else buf += ch;
  }
  return out;
}

const MOTION_GUARD = "@media screen and (prefers-reduced-motion: no-preference) and (prefers-contrast: no-preference) and (forced-colors: none)";

describe("/why CSS", () => {
  it("parses into rules", () => {
    for (const [name, css] of FILES) expect(rules(css).length, name).toBeGreaterThan(5);
  });

  it.each(FILES)("%s has no blur, filters, dimming keyframes or dash drawing", (_name, css) => {
    for (const re of [/\bfilter\s*:/, /blur\(/, /backdrop-filter/, /whyRise/, /whySettle/, /whyIris\b/, /stroke-dashoffset/, /animation-timeline/]) {
      expect(css).not.toMatch(re);
    }
  });

  it.each(FILES)("%s carries none of the removed figures", (_name, css) => {
    expect(css).not.toMatch(/\.why-(progress|split|tracks?|summit|places|ceiling|fig)\b/);
    expect(css).not.toMatch(/why(Snap|Dot|GrowX|GrowY|CatchUp|Draw|Reveal)\b/);
  });

  it.each(FILES)("%s uses tokens: no raw colors, px, rem or legacy radii", (_name, css) => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch|oklab)\(/);
    // Breakpoints in media queries are px by design; declarations never are.
    for (const r of rules(css)) expect(r.body, r.selector).not.toMatch(/\d(px|rem)\b/);
    expect(css).not.toMatch(/--radius-/);
    expect(css).not.toMatch(/line-height:\s*1\.3\b|0\.04em/);
  });

  it.each(FILES)("%s only hides or fades things behind the gate", (name, css) => {
    for (const r of rules(css)) {
      if (r.ancestors.some((a) => a.startsWith("@keyframes"))) continue;
      if (/opacity:\s*0(?![.\d])|visibility:\s*hidden/.test(r.body)) {
        expect(r.selector, `${name}: ${r.selector}`).toMatch(/\[data-why|\.why-pane/);
      }
    }
  });

  it.each(FILES)("%s keeps every mode rule inside the motion guard", (name, css) => {
    for (const r of rules(css)) {
      if (!/\[data-why=/.test(r.selector)) continue;
      expect(r.ancestors.some((a) => a.startsWith(MOTION_GUARD)), `${name}: ${r.selector}`).toBe(true);
      for (const sel of r.selector.split(",")) expect(sel, `${name}: ${sel}`).toMatch(/:not\(\[data-motion='reduce'\]\)/);
      if (/\[data-why='stage'\]/.test(r.selector)) {
        expect(r.ancestors.some((a) => a.includes("(min-width: 1024px) and (min-height: 720px)")), `${name}: ${r.selector}`).toBe(true);
      }
      // Pockets mirror the gate's fit: never on windows under 320 x 520.
      if (/\[data-why='pocket'\]/.test(r.selector)) {
        expect(r.ancestors.some((a) => a.includes("(min-width: 320px) and (min-height: 520px)")), `${name}: ${r.selector}`).toBe(true);
      }
      expect(r.selector, `${name}: flow is gone`).not.toMatch(/\[data-why='flow'\]/);
    }
  });

  it.each(FILES)("%s only promotes layers on live panes", (name, css) => {
    for (const r of rules(css)) if (/will-change/.test(r.body)) expect(r.selector, name).toMatch(/\.is-live/);
  });

  it("keeps a pinned pocket band under 42% of the viewport, its runways in svh, and anchors it to the top only", () => {
    const vars = Object.fromEntries([...RAW["why.css"].matchAll(/(--why-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
    // A band is the column's width at its own view's shape (--vw, --vh), never over its share of the screen:
    // 42svh at most pinned, less in flow over a list.
    for (const k of ["--why-band-max", "--why-band-keyed-max"]) {
      const cap = /^(\d+)svh$/.exec(vars[k]);
      expect(cap, `${k}: ${vars[k]}`).not.toBeNull();
      expect(Number(cap![1]), k).toBeLessThanOrEqual(42);
    }
    expect(Number(/^(\d+)svh$/.exec(vars["--why-band-keyed-max"])![1])).toBeLessThanOrEqual(Number(/^(\d+)svh$/.exec(vars["--why-band-max"])![1]));
    const shapes = [...RAW["why.css"].matchAll(/--why-band-h:\s*([^;]+);/g)].map((m) => m[1].trim());
    expect(shapes.length).toBeGreaterThan(0);
    for (const v of shapes) expect(v).toMatch(/^min\(var\(--why-band-(keyed-)?max\), 100cqi \* var\(--vh\) \/ var\(--vw\)\)$/);
    expect(vars["--why-pivot-mark-h"]).toMatch(/^min\(var\(--why-band-max\),/);
    for (const k of ["--why-run-item", "--why-run-section", "--why-run-climax", "--why-pivot-pocket"]) expect(vars[k], k).toMatch(/^\d+svh$/);
    const sticky = rules(FILES.find(([n]) => n === "why.css")![1]).filter((r) => /\.why-pocket-band/.test(r.selector) && /position:\s*sticky/.test(r.body));
    expect(sticky).toHaveLength(1);
    expect(sticky[0].body).toMatch(/inset-block-start:\s*var\(--site-header-h\)/);
    expect(sticky[0].body).not.toMatch(/(^|[;\s])(bottom|inset-block-end)\s*:/);
    expect(sticky[0].body).toMatch(/block-size:\s*var\(--why-band-h\)/);
  });

  it("takes no art runway from the text: the only runways are the pinned blocks' (at most 150svh each) and the pivot's stage", () => {
    const vars = Object.fromEntries([...RAW["why.css"].matchAll(/(--why-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
    expect(Object.keys(vars).filter((k) => k.startsWith("--why-gap-") || k === "--why-runout")).toEqual([]);
    // Only the two pins Ryan granted hold essay text: on the stage the hero's text and the pairs; on a
    // phone the hero's text alone, with its band. The eras never pin, anywhere, and no phone list pins.
    expect(vars["--why-timeline-run"]).toBeUndefined();
    for (const k of ["--why-hero-run", "--why-pairs-run", "--why-hero-frame-run"]) {
      const run = /^(\d+)svh$/.exec(vars[k]);
      expect(run, `${k}: ${vars[k]}`).not.toBeNull();
      expect(Number(run![1]), k).toBeLessThanOrEqual(150);
    }
    for (const k of ["--why-eras-run", "--why-eras-top", "--why-arrives-frame-run", "--why-pace-frame-run"]) expect(vars[k], k).toBeUndefined();
    expect(RAW["why.css"]).not.toMatch(/data-why-frame='arrives'\]\s*>\s*\.why-frame\s*\{[^}]*sticky/);
    expect(RAW["why.css"]).not.toMatch(/data-pin\]\[data-why-frame='(arrives|pace)'\]/);
    expect(vars["--why-pivot-stage"]).toMatch(/^\d+svh$/);
    // On a phone the pivot's stage stays under two screens, and the hands' paragraphs never pin.
    expect(Number(/^(\d+)svh$/.exec(vars["--why-pivot-pocket"])![1])).toBeLessThanOrEqual(190);
    expect(vars["--why-hands-frame-run"]).toBeUndefined();
    expect(RAW["why.css"]).not.toMatch(/data-pin\]\[data-why-frame='hands'\]/);
    // The art's timing reads the same runways the page lays out.
    expect(vars["--why-pivot-stage"]).toBe(`${PIVOT_STAGE}svh`);
    expect(vars["--why-frame-top"]).toBe(`${Math.round(FRAME_TOP * 100)}svh`);
  });

  it("pins a frame's band and text on a phone only from the top, and releases every pin under the gate", () => {
    const css = FILES.find(([n]) => n === "why.css")![1];
    const pins = rules(css).filter((r) => /position:\s*sticky/.test(r.body));
    expect(pins.length).toBeGreaterThan(0);
    for (const r of pins) {
      expect(r.ancestors.some((a) => a.startsWith(MOTION_GUARD)), r.selector).toBe(true);
      expect(r.body, r.selector).not.toMatch(/(^|[;\s])(bottom|inset-block-end)\s*:/);
    }
  });

  it("spaces the text from the rhythm steps only, each a DS spacing token", () => {
    const css = FILES.find(([n]) => n === "why.css")![1];
    const steps = [...RAW["why.css"].matchAll(/(--why-rhythm-[\w-]+):\s*([^;]+);/g)];
    expect(steps.length).toBeGreaterThanOrEqual(4);
    for (const [, k, v] of steps) expect(v, k).toMatch(/var\(--fathom-space-\d+\)/);
    for (const r of rules(css)) {
      for (const m of r.body.matchAll(/(?:^|;)\s*(margin[\w-]*|gap|row-gap|column-gap)\s*:\s*([^;]+)/g)) {
        expect(m[2].trim(), `${r.selector} ${m[1]}`).toMatch(/^((var\(--(why-rhythm-[\w-]+|why-pane-gap|fathom-space-\d+)\)|0|auto)\s*)+$/);
      }
    }
  });

  it("colors the essay with the AAA site roles only, the pair legend included", () => {
    const css = FILES.find(([n]) => n === "why.css")![1];
    for (const r of rules(css)) {
      for (const m of r.body.matchAll(/(?:^|;)\s*color:\s*([^;]+)/g)) expect(m[1].trim(), r.selector).toMatch(/^var\(--site-/);
    }
    const legend = rules(css).find((r) => r.selector === ".why .why-legend");
    expect(legend?.body).toMatch(/color:\s*var\(--site-text-secondary\)/);
  });

  it("uses no border or bar as emphasis, and no repeated small caps labels", () => {
    for (const [name, css] of FILES) {
      expect(css, name).not.toMatch(/border-(left|inline-start)\s*:/);
      expect(css, name).not.toMatch(/text-transform:\s*uppercase/);
    }
  });

  it("still has the legacy pivot block only while it is allowed", () => {
    const marked = LEGACY.test(RAW["why.css"]);
    LEGACY.lastIndex = 0;
    expect(marked).toBe(LEGACY_PIVOT_ALLOWED);
  });
});
