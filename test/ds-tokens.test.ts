// The generated design-system CSS against the vendored tokens.json, read
// independently of the generator: every DS token appears in each theme with
// the right value or var() chain, the pipeline is fresh (ds:check), the CSS
// the page ships resolves to the hexes the contrast tests measure, and no
// generated name collides with a custom property the site already declares.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { DS_COLORS, SITE_COLORS, type SiteTheme } from "@/design-system/generated/tokens";

const root = path.resolve(__dirname, "..");
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

type Token = { name: string; value: string | Record<string, string> };
type TypeStyle = { name: string; fontSize: string; lineHeight: string; fontWeight: number; letterSpacing?: string };
const tokens = JSON.parse(read("design-system/vendor/tokens.json"));
const colorTokens: Token[] = tokens.color.tokens;
const shadowTokens: Token[] = tokens.shadow.tokens;
const typeStyles: (TypeStyle & { family: string })[] = tokens.type.groups.flatMap(
  (g: { family: string; styles: TypeStyle[] }) => g.styles.map((s) => ({ ...s, family: g.family })),
);
const STATIC_GROUPS = ["spacing", "radius", "size", "border", "layout", "opacity"] as const;

const fathomCss = read("design-system/generated/fathom-tokens.css");
const siteCss = read("design-system/generated/site-roles.css");
const siteTokensCss = read("app/site-tokens.css");
const globalsCss = read("app/globals.css");
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

// globals.css's @theme inline block (flat: no nested braces), and the rest.
const themeMatch = /@theme inline \{([^{}]*)\}/.exec(globalsCss);
if (!themeMatch) throw new Error("globals.css has no flat @theme inline block");
const themeBlockCss = themeMatch[1];
const globalsOutsideTheme = globalsCss.replace(themeMatch[0], "");
const themeEntries = new Map(
  [...stripComments(themeBlockCss).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
);

// ── a small CSS reader: blocks by their prelude path, declarations in order ──
type Block = { path: string[]; decls: Map<string, string> };
function parseCss(css: string): Block[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks: Block[] = [];
  const stack: string[] = [];
  let buf = "";
  for (const ch of src) {
    if (ch === "{") {
      stack.push(buf.trim().replace(/\s+/g, " "));
      buf = "";
    } else if (ch === "}") {
      const decls = new Map<string, string>();
      for (const part of buf.split(";")) {
        const i = part.indexOf(":");
        if (i > 0 && part.trim().startsWith("--")) decls.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
      }
      if (decls.size) blocks.push({ path: [...stack], decls });
      stack.pop();
      buf = "";
    } else {
      buf += ch;
    }
  }
  return blocks;
}
const blocks = parseCss(fathomCss);
const blockAt = (...p: string[]) => {
  const found = blocks.filter((b) => b.path.join(" > ") === p.join(" > "));
  expect(found, `a block at ${p.join(" > ")}`).toHaveLength(1);
  return found[0].decls;
};

const DARK = ':root, [data-theme="dark"]';
const LIGHT = '[data-theme="light"]';
const MORE = "@media (prefers-contrast: more)";
const DARK_MORE = ':root:not([data-theme="light"]), [data-theme="dark"]';
const ALL_THEMES = ':root, [data-theme="dark"], [data-theme="light"]';
const NO_SHADOW = "0 0 transparent";
const THEME_BLOCKS = [
  { theme: "dark", decls: () => blockAt(DARK) },
  { theme: "light", decls: () => blockAt(LIGHT) },
  { theme: "contrast-boost", decls: () => blockAt(MORE, DARK_MORE) },
] as const;
// Contrast Boost's shadow drop is theme-independent, so it has its own block.
const SHADOW_BLOCKS = [
  { theme: "dark", decls: () => blockAt(DARK) },
  { theme: "light", decls: () => blockAt(LIGHT) },
  { theme: "contrast-boost", decls: () => blockAt(MORE, ALL_THEMES) },
] as const;

// ── what <html data-theme> computes, from the CSS alone ──────────────────────
// A small cascade over the generated files in globals.css's import order: pick
// the blocks that match <html data-theme=T> (under prefers-contrast or not), let
// the highest specificity win and then the later rule, and follow var() chains.
// It knows only the selectors these files use and throws on any other, so a new
// selector cannot slip past it.
type Appearance = { theme: "dark" | "light"; more: boolean };
const APPEARANCES: Record<SiteTheme, Appearance> = {
  dark: { theme: "dark", more: false },
  light: { theme: "light", more: false },
  "dark-more": { theme: "dark", more: true },
  "light-more": { theme: "light", more: true },
};
const DS_THEME_FOR = { dark: "dark", light: "light", "dark-more": "contrast-boost", "light-more": "light" } as const;
const SITE_THEMES = Object.keys(APPEARANCES) as SiteTheme[];

function selectorSpecificity(selector: string, a: Appearance): number | null {
  switch (selector) {
    case ":root":
      return 1;
    case '[data-theme="dark"]':
      return a.theme === "dark" ? 1 : null;
    case '[data-theme="light"]':
      return a.theme === "light" ? 1 : null;
    case ':root:not([data-theme="light"])':
      return a.theme !== "light" ? 2 : null;
    case ".phone-screen":
      return null;
    default:
      throw new Error(`The test cascade does not know the selector ${selector}`);
  }
}
function preludeSpecificity(prelude: string, a: Appearance): number | null {
  if (prelude === MORE) return a.more ? 0 : null;
  if (prelude.startsWith("@supports")) return 0;
  if (prelude.startsWith("@")) throw new Error(`The test cascade does not know the at-rule ${prelude}`);
  const hits = prelude
    .split(",")
    .map((s) => selectorSpecificity(s.trim(), a))
    .filter((n): n is number => n !== null);
  return hits.length ? Math.max(...hits) : null;
}
function htmlProps(a: Appearance): Map<string, string> {
  const won = new Map<string, { spec: number; value: string }>();
  for (const css of [fathomCss, siteCss, siteTokensCss]) {
    for (const b of parseCss(css)) {
      let spec = 0;
      let matches = true;
      for (const p of b.path) {
        const s = preludeSpecificity(p, a);
        if (s === null) {
          matches = false;
          break;
        }
        spec = Math.max(spec, s);
      }
      if (!matches) continue;
      for (const [k, v] of b.decls) {
        const prev = won.get(k);
        if (!prev || spec >= prev.spec) won.set(k, { spec, value: v });
      }
    }
  }
  return new Map([...won].map(([k, w]) => [k, w.value]));
}
/** Follow a value's var() chain; returns the final value and every variable on the way. */
function resolveValue(props: Map<string, string>, value: string, trail: string[] = []): { value: string; chain: string[] } {
  const m = /^var\((--[a-z0-9-]+)\)$/.exec(value.trim());
  if (!m) {
    expect(value, `${trail.join(" -> ")} ends in an unresolved var()`).not.toContain("var(");
    return { value: value.trim(), chain: trail };
  }
  const name = m[1];
  expect(trail, `var() cycle at ${name}`).not.toContain(name);
  const next = props.get(name);
  expect(next, `${[...trail, name].join(" -> ")} is declared`).toBeDefined();
  return resolveValue(props, next!, [...trail, name]);
}
const resolveVar = (props: Map<string, string>, name: string) => resolveValue(props, `var(${name})`);

const expectedCss = (value: string) => {
  const ref = /^\{([a-z0-9-]+)\}$/.exec(value);
  return ref ? `var(--fathom-${ref[1]})` : value;
};
const forTheme = (value: Token["value"], theme: string) => (typeof value === "string" ? value : value[theme]);

describe("vendored design system", () => {
  it("is pinned: every vendored file matches its SOURCE.json hash", () => {
    const source = JSON.parse(read("design-system/SOURCE.json"));
    expect(Object.keys(source.files)).toContain("vendor/tokens.json");
    for (const [rel, hash] of Object.entries(source.files)) {
      const bytes = readFileSync(path.join(root, "design-system", rel));
      expect(createHash("sha256").update(bytes).digest("hex"), rel).toBe(hash);
    }
    expect(source.dsCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(source.repoCommit).toMatch(/^[0-9a-f]{40}$/);
  });

  it("never vendors the README, components.md or the changelog (the repo is public)", () => {
    const source = JSON.parse(read("design-system/SOURCE.json"));
    for (const rel of Object.keys(source.files)) expect(rel).not.toMatch(/README|components\.md|changelog/i);
  });
});

describe("generated fathom-tokens.css", () => {
  it("npm run ds:check passes: generated files are current and the vendor is untouched", () => {
    const out = execFileSync(process.execPath, [path.join(root, "scripts/ds/build.mjs"), "--check"], { encoding: "utf8" });
    expect(out).toMatch(/ds:check: 4 generated files are current/);
  });

  it.each(THEME_BLOCKS)("declares every color token for $theme with its value or var() chain", ({ theme, decls }) => {
    const d = decls();
    expect(colorTokens.length).toBeGreaterThan(100);
    for (const t of colorTokens) {
      expect(d.get(`--fathom-${t.name}`), `${t.name} (${theme})`).toBe(expectedCss(forTheme(t.value, theme)));
    }
  });

  it.each(SHADOW_BLOCKS)("declares every shadow for $theme", ({ theme, decls }) => {
    const d = decls();
    for (const s of shadowTokens) expect(d.get(`--fathom-${s.name}`), `${s.name} (${theme})`).toBe(forTheme(s.value, theme));
  });

  it("drops every shadow under prefers-contrast (Contrast Boost), in both themes", () => {
    const d = blockAt(MORE, ALL_THEMES);
    for (const s of shadowTokens) expect(d.get(`--fathom-${s.name}`)).toBe("none");
    // The dark-only color block carries no shadows of its own.
    for (const s of shadowTokens) expect(blockAt(MORE, DARK_MORE).has(`--fathom-${s.name}`), s.name).toBe(false);
  });

  it("puts spacing, radius, size, border, layout and opacity in :root, verbatim", () => {
    const d = blockAt(":root");
    for (const g of STATIC_GROUPS) {
      for (const t of tokens[g].tokens as { name: string; value: string }[]) {
        expect(d.get(`--fathom-${t.name}`), t.name).toBe(String(t.value));
      }
    }
    expect(d.get("--fathom-font-sans")).toBe(tokens.type.families.sans);
    expect(d.get("--fathom-font-mono")).toBe(tokens.type.families.mono);
  });

  it("keeps DS space-N equal to Tailwind's p-N (N × 4px)", () => {
    for (const t of tokens.spacing.tokens as { name: string; value: string }[]) {
      const n = Number(t.name.replace("space-", ""));
      expect(t.value === "0" ? 0 : parseFloat(t.value), t.name).toBe(n * 4);
    }
  });

  it("applies the Contrast Boost geometry under prefers-contrast only, in both themes", () => {
    const d = blockAt(MORE, ":root");
    const geometry = /^--fathom-(border-(hairline|default|emphasis|indicator)|focus-ring-width|size-control-(sm|md|lg))$/;
    expect([...blockAt(MORE, DARK_MORE).keys()].filter((k) => geometry.test(k)), "not in the dark-only block").toEqual([]);
    for (const theme of SITE_THEMES) {
      const props = htmlProps(APPEARANCES[theme]);
      const more = APPEARANCES[theme].more;
      expect(props.get("--fathom-border-default"), theme).toBe(more ? "2px" : "1px");
      expect(props.get("--fathom-focus-ring-width"), theme).toBe(more ? "3px" : "2px");
      expect(props.get("--fathom-size-control-md"), theme).toBe(more ? "56px" : "48px");
    }
    expect(Object.fromEntries([...d].filter(([k]) => geometry.test(k)))).toEqual({
      "--fathom-border-hairline": "1px",
      "--fathom-border-default": "2px",
      "--fathom-border-emphasis": "6px",
      "--fathom-border-indicator": "8px",
      "--fathom-focus-ring-width": "3px",
      "--fathom-size-control-sm": "48px",
      "--fathom-size-control-md": "56px",
      "--fathom-size-control-lg": "64px",
    });
    const rootDecls = blockAt(":root");
    expect(rootDecls.get("--fathom-border-default")).toBe("1px");
    expect(rootDecls.get("--fathom-focus-ring-width")).toBe("2px");
  });

  it("keeps the dark Contrast Boost block off <html data-theme=light>", () => {
    expect(fathomCss).toContain(`${MORE} {\n  ${DARK_MORE} {`);
  });

  it("emits all 17 type styles in rem, with a px scope for the phone mockups", () => {
    expect(typeStyles).toHaveLength(17);
    expect(blockAt(":root").get("--fathom-type-unit")).toBe("0.0625rem");
    expect(blockAt(".phone-screen").get("--fathom-type-unit")).toBe("1px");
    const d = blockAt(":root, .phone-screen");
    const px = (v: string) => Number(v.replace("px", ""));
    for (const s of typeStyles) {
      const v = (k: string) => d.get(`--fathom-type-${s.name}-${k}`);
      expect(v("family"), s.name).toBe(`var(--fathom-font-${s.family})`);
      expect(v("size"), s.name).toBe(`calc(${px(s.fontSize)} * var(--fathom-type-unit))`);
      expect(v("line-height"), s.name).toBe(`calc(${px(s.lineHeight)} / ${px(s.fontSize)})`);
      expect(v("weight"), s.name).toBe(String(s.fontWeight));
      const tracking = s.letterSpacing
        ? s.letterSpacing.endsWith("px")
          ? `calc(${px(s.letterSpacing)} * var(--fathom-type-unit))`
          : s.letterSpacing
        : "0";
      expect(v("tracking"), s.name).toBe(tracking);
      expect(v("transform"), s.name).toBe(["eyebrow", "overline"].includes(s.name) ? "uppercase" : "none");
      expect(v("numeric"), s.name).toBe(["mono", "mono-sm"].includes(s.name) ? "tabular-nums" : "normal");
    }
  });

  it("carries the README's motion tokens, with the spring as linear() behind @supports", () => {
    const d = blockAt(":root");
    expect(d.get("--fathom-motion-press-duration")).toBe("80ms");
    expect(d.get("--fathom-motion-press-easing")).toBe("ease-in");
    expect(d.get("--fathom-motion-hover-duration")).toBe("150ms");
    expect(d.get("--fathom-motion-hover-easing")).toBe("ease-out");
    expect(d.get("--fathom-motion-color-duration")).toBe("200ms");
    expect(d.get("--fathom-motion-crossfade-duration")).toBe("280ms");
    expect(d.get("--fathom-motion-pulse-duration")).toBe("1.6s");
    expect(d.get("--fathom-motion-pulse-easing")).toBe("ease-in-out");
    expect(d.get("--fathom-motion-settle-easing")).toBe("ease-out");
    expect(d.get("--fathom-motion-settle-duration")).toMatch(/^\d+ms$/);
    const linear = blockAt("@supports (transition-timing-function: linear(0, 1))", ":root").get("--fathom-motion-settle-easing");
    expect(linear).toMatch(/^linear\(0, [\d., ]+, 1\)$/);
  });

  it("references only variables it declares", () => {
    const declared = new Set(blocks.flatMap((b) => [...b.decls.keys()]));
    for (const css of [fathomCss, siteCss]) {
      for (const [, name] of css.matchAll(/var\((--fathom-[a-z0-9-]+)\)/g)) expect(declared.has(name), name).toBe(true);
    }
  });
});

describe("generated site-roles.css", () => {
  const site = parseCss(siteCss);
  const at = (...p: string[]) => site.find((b) => b.path.join(" > ") === p.join(" > "))!.decls;

  it("has no hex anywhere: every role is a design-system variable", () => {
    const noComments = siteCss.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(noComments).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    for (const b of site) {
      for (const [k, v] of b.decls) {
        if (k.startsWith("--site-shadow-")) expect([`var(--fathom-${k.slice(7)})`, NO_SHADOW], k).toContain(v);
        else expect(v, k).toMatch(/^var\(--fathom-[a-z0-9-]+\)$/);
      }
    }
  });

  it.each(SITE_THEMES)("resolves every --site-* color to the hex the contrast tests measure (%s)", (theme) => {
    // tokens.ts and this CSS come from the same generator; resolving the CSS on
    // its own ties the measured hexes to what the page actually paints.
    const props = htmlProps(APPEARANCES[theme]);
    const roles = Object.keys(SITE_COLORS[theme]) as (keyof (typeof SITE_COLORS)[typeof theme])[];
    expect(roles.length).toBeGreaterThan(10);
    for (const role of roles) {
      expect(resolveVar(props, `--site-${role}`).value.toLowerCase(), `--site-${role}`).toBe(SITE_COLORS[theme][role]);
    }
  });

  it.each(SITE_THEMES)("resolves every DS color to its DS_COLORS hex (%s)", (theme) => {
    const props = htmlProps(APPEARANCES[theme]);
    const ds = DS_COLORS[DS_THEME_FOR[theme]] as Record<string, string>;
    for (const t of colorTokens) expect(resolveVar(props, `--fathom-${t.name}`).value.toLowerCase(), t.name).toBe(ds[t.name]);
  });

  it("declares the same roles for dark and light, and boosts light under prefers-contrast", () => {
    const dark = [...at(DARK).keys()];
    expect(dark.length).toBeGreaterThan(10);
    expect([...at(LIGHT).keys()]).toEqual(dark);
    const boosted = at(MORE, LIGHT);
    expect(boosted.get("--site-text-secondary")).toBeDefined();
    for (const k of boosted.keys()) expect(dark).toContain(k);
  });
});

describe("the Tailwind @theme bridge", () => {
  const shadowEntries = [...themeEntries].filter(([k]) => k.startsWith("--shadow-"));

  it("maps each DS shadow through the site bridge", () => {
    expect(shadowEntries.map(([k]) => k).sort()).toEqual(shadowTokens.map((s) => `--${s.name}`).sort());
    for (const [k, v] of shadowEntries) expect(v, k).toBe(`var(--site-${k.slice(2)})`);
  });

  it.each(SITE_THEMES)("never lets a --shadow-* entry reach none, which voids a shadow + ring list (%s)", (theme) => {
    const props = htmlProps(APPEARANCES[theme]);
    for (const [k, v] of shadowEntries) {
      const { value, chain } = resolveValue(props, v);
      for (const name of chain) expect(resolveVar(props, name).value, `${k} via ${name}`).not.toMatch(/\bnone\b/);
      const ds = shadowTokens.find((s) => `--${s.name}` === k)!;
      expect(value, k).toBe(APPEARANCES[theme].more ? NO_SHADOW : forTheme(ds.value, theme));
    }
  });

  it("sets the site's mono face on text-mono and text-mono-sm", () => {
    // The family is what makes the DS mono styles mono (type-web.json, "family").
    expect(stripComments(globalsOutsideTheme)).toMatch(/:root\s*\{[^}]*--font-mono:/);
    for (const style of ["mono", "mono-sm"]) {
      const body = new RegExp(`@utility text-${style} \\{([^}]*)\\}`).exec(globalsCss)?.[1] ?? "";
      expect(body, style).toContain("font-family: var(--font-mono);");
      expect(body, style).toContain(`font-variant-numeric: var(--fathom-type-${style}-numeric);`);
    }
  });
});

describe("no name collisions with the existing site", () => {
  const declaredIn = (css: string) =>
    new Set([...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?:^|[{;\s])(--[a-zA-Z0-9_-]+)\s*:/g)].map((m) => m[1]));
  const generated = new Set([...declaredIn(fathomCss), ...declaredIn(siteCss)]);
  const siteTokens = declaredIn(read("app/site-tokens.css"));

  it("generated names never reuse a custom property from globals.css or fathom-landing.css", () => {
    const existing = new Set([...declaredIn(globalsCss), ...declaredIn(read("components/fathom-landing.css"))]);
    expect(existing.size).toBeGreaterThan(50);
    expect([...generated].filter((n) => existing.has(n))).toEqual([]);
    expect([...siteTokens].filter((n) => existing.has(n) || generated.has(n))).toEqual([]);
  });

  it("reuses a legacy name in @theme only for the three allowed radii", () => {
    // @theme entries share a namespace with the legacy :root names. Every overlap
    // must be deliberate: the radii are, and they carry a known split until P5.
    const legacy = new Set([...declaredIn(globalsOutsideTheme), ...declaredIn(read("components/fathom-landing.css"))]);
    expect(themeEntries.size).toBeGreaterThan(50);
    expect([...themeEntries.keys()].filter((n) => legacy.has(n)).sort()).toEqual(["--radius-lg", "--radius-md", "--radius-sm"]);

    const legacyValue = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(stripComments(globalsOutsideTheme))?.[1];
    const dsRadius = (name: string) => (tokens.radius.tokens as { name: string; value: string }[]).find((t) => t.name === name)!.value;
    // sm and md mean the same either way.
    expect(legacyValue("--radius-sm")).toBe(dsRadius("radius-sm"));
    expect(legacyValue("--radius-md")).toBe(dsRadius("radius-md"));
    // lg does not: legacy var(--radius-lg) is 20px (DS radius-xl), rounded-lg is the
    // DS 16px. P5 moves any var(--radius-lg) to var(--fathom-radius-xl) first.
    expect(legacyValue("--radius-lg")).toBe(dsRadius("radius-xl"));
    expect(dsRadius("radius-lg")).not.toBe(dsRadius("radius-xl"));
    for (const n of ["sm", "md", "lg"]) expect(themeEntries.get(`--radius-${n}`)).toBe(`var(--fathom-radius-${n})`);
  });

  it("keeps the site's brand ramp and the DS primitive apart", () => {
    // globals.css's --fathom-700 is #1a3b52 (DS fathom-900); DS fathom-700 is --fathom-fathom-700.
    expect(declaredIn(globalsCss).has("--fathom-700")).toBe(true);
    expect(generated.has("--fathom-700")).toBe(false);
    expect(generated.has("--fathom-fathom-700")).toBe(true);
  });

  it("maps every DS type style into Tailwind, as a --text-* entry or a text-* utility", () => {
    for (const s of typeStyles) {
      const theme = globalsCss.includes(`--text-${s.name}: var(--fathom-type-${s.name}-size);`);
      const utility = globalsCss.includes(`@utility text-${s.name} {`);
      expect(theme !== utility, `${s.name}: exactly one mapping`).toBe(true);
    }
  });
});
