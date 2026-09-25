// Pure functions for the design-system token pipeline.
//
// Nothing here touches the file system or the process: build.mjs and sync.mjs
// read the inputs, pass them in as plain data, and write what comes back.
// That keeps every output reproducible from its inputs, which is what
// `npm run ds:check` relies on.

export const PREFIX = "--fathom-";
export const SITE_PREFIX = "--site-";

/** The design system's three color themes, as tokens.json keys them. */
export const DS_THEMES = ["dark", "light", "contrast-boost"];
/** The site's four resolved appearances. "-more" is prefers-contrast: more. */
export const SITE_THEMES = ["dark", "light", "dark-more", "light-more"];
const SITE_TO_DS = { dark: "dark", light: "light", "dark-more": "contrast-boost", "light-more": "light" };

/** Groups whose tokens do not change with the theme; emitted once, in :root. */
export const STATIC_GROUPS = ["spacing", "radius", "size", "border", "layout", "opacity"];

const REF = /^\{([a-z0-9-]+)\}$/;
const HEX = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;
const PX = /^(-?\d+(?:\.\d+)?)px$/;

// Selectors. The dark theme is the default on :root; light wins by order.
// Under prefers-contrast the dark block must not reach <html data-theme="light">,
// which :root also matches, hence the :not().
export const SEL_DARK = ':root, [data-theme="dark"]';
export const SEL_LIGHT = '[data-theme="light"]';
export const SEL_DARK_MORE = ':root:not([data-theme="light"]), [data-theme="dark"]';
// Theme-dependent tokens that apply to both themes (the Contrast Boost shadow
// drop) must reach every element a theme block declares them on.
export const SEL_ALL_THEMES = ':root, [data-theme="dark"], [data-theme="light"]';
export const MEDIA_MORE = "@media (prefers-contrast: more)";

// A shadow that draws nothing but stays valid inside a comma-separated
// box-shadow list. Tailwind composes shadow-*, ring-* and inset-ring-* into one
// list, and a bare `none` in that list voids the whole declaration (the ring
// disappears with it), so the Tailwind bridge never hands Tailwind `none`.
// No hex, so site-roles.css stays hex-free.
export const NO_SHADOW = "0 0 transparent";

// ─── small helpers ───────────────────────────────────────────────────

export function refName(value) {
  const m = typeof value === "string" ? REF.exec(value) : null;
  return m ? m[1] : null;
}

export function fathomVar(name) {
  return `var(${PREFIX}${name})`;
}

/** A DS value as CSS: a {ref} becomes a var() chain, anything else is verbatim. */
export function toCss(value) {
  const r = refName(value);
  return r ? fathomVar(r) : String(value);
}

/** The value of a token for one theme (theme-keyed objects pick their key). */
export function valueForTheme(value, theme, name = "?") {
  if (value && typeof value === "object") {
    if (!(theme in value)) throw new Error(`Token "${name}" has no "${theme}" value`);
    return value[theme];
  }
  return value;
}

export function pxNumber(value, name = "?") {
  const m = PX.exec(String(value));
  if (!m) throw new Error(`Token "${name}" is not a px length: ${value}`);
  return Number(m[1]);
}

function fmt(n) {
  // Shortest exact decimal, no float noise (0.5 * 2 -> "1", 1.2941 stays).
  return String(Number(n.toFixed(6)));
}

// ─── color ───────────────────────────────────────────────────────────

/** Index the color tokens by name, checking for duplicates and dangling refs. */
export function indexColors(tokens) {
  const index = new Map();
  for (const t of tokens.color.tokens) {
    if (index.has(t.name)) throw new Error(`Duplicate color token "${t.name}"`);
    index.set(t.name, t);
  }
  for (const t of index.values()) {
    for (const theme of DS_THEMES) {
      const v = valueForTheme(t.value, theme, t.name);
      const r = refName(v);
      if (r && !index.has(r)) throw new Error(`Color token "${t.name}" (${theme}) points at unknown "${r}"`);
      if (!r && !HEX.test(v)) throw new Error(`Color token "${t.name}" (${theme}) is neither a hex nor a {ref}: ${v}`);
    }
  }
  return index;
}

/** primitive: a plain hex. role: color-*. component: everything else. */
export function colorKind(token) {
  if (typeof token.value === "string" && HEX.test(token.value)) return "primitive";
  if (token.name.startsWith("color-")) return "role";
  return "component";
}

/** Follow a token's {ref} chain for one DS theme down to a hex. */
export function resolveHex(index, name, theme, trail = []) {
  if (trail.includes(name)) throw new Error(`Reference cycle: ${[...trail, name].join(" -> ")}`);
  const token = index.get(name);
  if (!token) throw new Error(`Unknown color token "${name}"${trail.length ? ` (from ${trail.at(-1)})` : ""}`);
  const v = valueForTheme(token.value, theme, name);
  const r = refName(v);
  if (r) return resolveHex(index, r, theme, [...trail, name]);
  return v.toLowerCase();
}

// ─── contrast (WCAG 2.x) ─────────────────────────────────────────────

export function relativeLuminance(hex) {
  const h = hex.replace("#", "");
  if (h.length !== 6) throw new Error(`Contrast needs an opaque color, got ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ─── type ────────────────────────────────────────────────────────────

/** The 17 DS type styles, flattened out of their groups, with their family. */
export function typeStyles(tokens) {
  const out = [];
  for (const group of tokens.type.groups) {
    for (const style of group.styles) out.push({ ...style, family: style.family ?? group.family, group: group.name });
  }
  const names = out.map((s) => s.name);
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  if (dup) throw new Error(`Duplicate type style "${dup}"`);
  return out;
}

function trackingCss(value, name) {
  const v = String(value).trim();
  const px = PX.exec(v);
  if (px) return `calc(${fmt(Number(px[1]))} * var(${PREFIX}type-unit))`;
  if (/^-?\d*\.?\d+em$/.test(v)) return v;
  if (v === "0" || v === "normal") return "0";
  throw new Error(`Type style "${name}" has a letter-spacing the web layer cannot map: ${value}`);
}

/** Custom properties for one type style: [name without prefix, css value][]. */
export function typeDecls(style, web) {
  const n = style.name;
  const size = pxNumber(style.fontSize, `${n}.fontSize`);
  const line = pxNumber(style.lineHeight, `${n}.lineHeight`);
  const o = web.styles?.[n] ?? {};
  const override = web.tracking?.overrides?.[n];
  const tracking =
    override ?? (style.letterSpacing != null ? trackingCss(style.letterSpacing, n) : web.tracking?.default ?? "0");
  if (!style.family) throw new Error(`Type style "${n}" has no family`);
  return [
    [`type-${n}-family`, fathomVar(`font-${style.family}`)],
    [`type-${n}-size`, `calc(${fmt(size)} * var(${PREFIX}type-unit))`],
    [`type-${n}-line-height`, `calc(${fmt(line)} / ${fmt(size)})`],
    [`type-${n}-weight`, String(style.fontWeight)],
    [`type-${n}-tracking`, tracking],
    [`type-${n}-transform`, o.transform ?? web.defaults?.transform ?? "none"],
    [`type-${n}-numeric`, o.numeric ?? web.defaults?.numeric ?? "normal"],
  ];
}

// ─── motion ──────────────────────────────────────────────────────────

/**
 * A SwiftUI spring(response:dampingFraction:) from rest to 1, with no initial
 * velocity (unit mass: stiffness (2π/response)², damping 4π·ζ/response).
 */
export function springAt(t, response, dampingFraction) {
  const w0 = (2 * Math.PI) / response;
  const z = dampingFraction;
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  throw new Error(`Overdamped springs (damping ${z}) are not supported`);
}

/**
 * Sample a spring into a CSS linear() curve. The duration is the first moment
 * after which the spring stays within `tolerance` of rest; the curve uses as
 * few evenly spaced points as keep it within 2 × tolerance of the spring.
 */
export function springToLinear({ response, dampingFraction }, tolerance = 0.001) {
  const dt = 0.0005;
  let lastOutside = 0;
  for (let t = 0; t <= 10; t += dt) {
    if (Math.abs(1 - springAt(t, response, dampingFraction)) > tolerance) lastOutside = t;
  }
  const durationMs = Math.ceil((lastOutside + dt) * 1000);
  const T = durationMs / 1000;
  const f = (p) => springAt(p * T, response, dampingFraction);
  const round = (x) => Number(x.toFixed(4));

  for (let n = 8; n <= 120; n++) {
    const pts = Array.from({ length: n + 1 }, (_, i) => (i === 0 ? 0 : i === n ? 1 : round(f(i / n))));
    let maxErr = 0;
    for (let k = 0; k <= 1000; k++) {
      const p = k / 1000;
      const seg = Math.min(n - 1, Math.floor(p * n));
      const local = p * n - seg;
      const approx = pts[seg] + (pts[seg + 1] - pts[seg]) * local;
      maxErr = Math.max(maxErr, Math.abs(approx - f(p)));
    }
    if (maxErr <= tolerance * 2) {
      return { durationMs, points: pts, maxError: maxErr, css: `linear(${pts.map((x) => fmt(x)).join(", ")})` };
    }
  }
  throw new Error("Could not fit the spring with 120 points");
}

/** Motion custom properties plus the linear() upgrades for @supports. */
export function motionDecls(motion) {
  const base = [];
  const upgrades = [];
  for (const m of motion.tokens) {
    const n = m.name.replace(/^motion-/, "");
    if (m.spring) {
      const curve = springToLinear(m.spring, m.settleTolerance ?? 0.001);
      base.push([`motion-${n}-duration`, `${curve.durationMs}ms`]);
      base.push([`motion-${n}-easing`, m.fallbackEasing ?? "ease-out"]);
      upgrades.push([`motion-${n}-easing`, curve.css]);
    } else {
      if (!m.duration || !m.easing) throw new Error(`Motion token "${m.name}" needs a duration and an easing`);
      base.push([`motion-${n}-duration`, m.duration]);
      base.push([`motion-${n}-easing`, m.easing]);
    }
  }
  return { base, upgrades };
}

// ─── Contrast Boost geometry ─────────────────────────────────────────

/** Every theme-independent token, name -> value. */
export function staticTokens(tokens) {
  const map = new Map();
  for (const g of STATIC_GROUPS) {
    for (const t of tokens[g].tokens) {
      if (map.has(t.name)) throw new Error(`Duplicate token "${t.name}"`);
      map.set(t.name, t.value);
    }
  }
  return map;
}

/** The Contrast Boost geometry the README describes, as [name, value][]. */
export function contrastBoostGeometry(tokens, cb) {
  const all = staticTokens(tokens);
  const out = [];
  const need = (name) => {
    if (!all.has(name)) throw new Error(`contrast-boost.json names unknown token "${name}"`);
    return all.get(name);
  };
  for (const name of cb.scale?.tokens ?? []) out.push([name, `${fmt(pxNumber(need(name), name) * cb.scale.factor)}px`]);
  for (const name of cb.grow?.tokens ?? []) out.push([name, `${fmt(pxNumber(need(name), name) + cb.grow.px)}px`]);
  for (const [name, value] of Object.entries(cb.set ?? {})) {
    need(name);
    out.push([name, value]);
  }
  if (cb.shadows === "none") {
    for (const s of tokens.shadow.tokens) {
      if (valueForTheme(s.value, "contrast-boost", s.name) !== "none") {
        throw new Error(`contrast-boost.json says shadows are none, but tokens.json gives "${s.name}" a Contrast Boost value`);
      }
    }
  }
  return out;
}

// ─── CSS emission ────────────────────────────────────────────────────

function declLines(decls, prefix, indent) {
  return decls.map(([name, value]) => `${indent}${prefix}${name}: ${value};`);
}

function section(title, decls, prefix, indent) {
  if (!decls.length) return [];
  return [`${indent}/* ${title} */`, ...declLines(decls, prefix, indent)];
}

function block(selector, parts, indent = "") {
  return [`${indent}${selector} {`, ...parts, `${indent}}`].join("\n");
}

/** The DS shadows for one DS theme, verbatim (Contrast Boost's are `none`). */
function shadowDecls(tokens, theme) {
  return tokens.shadow.tokens.map((s) => [s.name, valueForTheme(s.value, theme, s.name)]);
}

/** Color (and, unless left out, shadow) declarations for one DS theme, grouped for reading. */
function themeParts(tokens, index, theme, indent, { shadows = true } = {}) {
  const groups = { primitive: [], role: [], component: [] };
  for (const t of index.values()) groups[colorKind(t)].push([t.name, toCss(valueForTheme(t.value, theme, t.name))]);
  return [
    ...section("Primitives", groups.primitive, PREFIX, indent),
    ...section("Semantic roles", groups.role, PREFIX, indent),
    ...section("Component tokens", groups.component, PREFIX, indent),
    ...(shadows ? section("Shadows", shadowDecls(tokens, theme), PREFIX, indent) : []),
  ];
}

export function header(kind, source) {
  const pin = source
    ? `Design system ${String(source.dsCommit ?? "").slice(0, 7)}, changelog ${source.changelogHead ?? "unknown"}, tokens.json ${String(source.tokensVersion ?? "").split(" ")[0]}.`
    : "No SOURCE.json.";
  const lines = [
    `GENERATED by scripts/ds/build.mjs from design-system/vendor and design-system/extensions. Do not edit.`,
    `Change the design system, then run npm run ds:sync (or npm run ds:build for an extension).`,
    pin,
  ];
  if (kind === "css") return `/*\n${lines.map((l) => ` * ${l}`).join("\n")}\n */`;
  return lines.map((l) => `// ${l}`).join("\n");
}

/** design-system/generated/fathom-tokens.css */
export function buildFathomTokensCss({ tokens, motion, contrastBoost, typeWeb, source }) {
  const index = indexColors(tokens);
  const families = Object.entries(tokens.type.families).map(([k, v]) => [`font-${k}`, v]);
  const styles = typeStyles(tokens);
  for (const key of Object.keys(typeWeb.styles ?? {})) {
    if (!styles.some((s) => s.name === key)) throw new Error(`type-web.json styles names unknown type style "${key}"`);
  }
  for (const key of Object.keys(typeWeb.tracking?.overrides ?? {})) {
    if (!styles.some((s) => s.name === key)) throw new Error(`type-web.json tracking names unknown type style "${key}"`);
  }
  const { base: motionBase, upgrades } = motionDecls(motion);
  const geometry = contrastBoostGeometry(tokens, contrastBoost);
  const pxScopes = typeWeb.unit?.pxScopes ?? [];
  const typeSel = [":root", ...pxScopes].join(", ");

  const staticByGroup = STATIC_GROUPS.map((g) => [
    g[0].toUpperCase() + g.slice(1),
    tokens[g].tokens.map((t) => [t.name, String(t.value)]),
  ]);

  const out = [
    header("css", source),
    "",
    "/* Dark, the default. Every theme block redeclares every color, so a data-theme",
    "   on any nested element re-resolves the var() chains inside it. */",
    block(SEL_DARK, themeParts(tokens, index, "dark", "  ")),
    "",
    block(SEL_LIGHT, themeParts(tokens, index, "light", "  ")),
    "",
    "/* Theme-independent tokens, verbatim from tokens.json, plus the type families,",
    "   the type unit and the motion tokens (design-system/extensions/motion.json). */",
    block(":root", [
      ...staticByGroup.flatMap(([title, decls]) => section(title, decls, PREFIX, "  ")),
      ...section("Type families", families, PREFIX, "  "),
      ...section("Type unit: 1/16 rem, so site text follows the browser's text size", [["type-unit", typeWeb.unit.root]], PREFIX, "  "),
      ...section("Motion", motionBase, PREFIX, "  "),
    ]),
    "",
  ];
  if (upgrades.length) {
    out.push(
      "/* motion-settle is a spring, sampled into linear(); ease-out where linear() is missing. */",
      "@supports (transition-timing-function: linear(0, 1)) {",
      block(":root", declLines(upgrades, PREFIX, "    "), "  "),
      "}",
      "",
    );
  }
  if (pxScopes.length) {
    out.push(
      "/* Phone mockups: 1px per DS point, so they stay pixel-true under zoom. */",
      block(pxScopes.join(", "), declLines([["type-unit", typeWeb.unit.px]], PREFIX, "  ")),
      "",
    );
  }
  out.push(
    `/* The 17 DS type styles. Declared on ${typeSel} so each scope resolves its own unit. */`,
    block(typeSel, styles.flatMap((s) => [`  /* ${s.name} */`, ...declLines(typeDecls(s, typeWeb), PREFIX, "  ")])),
    "",
    "/* Contrast Boost, automatic: the site has no control for it.",
    "   Colors: the DS Contrast Boost palette is dark-based, so it applies to the dark",
    "   theme only; light colors under prefers-contrast are boosted in site-roles.css.",
    "   Shadows and geometry (design-system/extensions/contrast-boost.json) do not depend",
    "   on the theme, so they apply to both. */",
    `${MEDIA_MORE} {`,
    block(SEL_DARK_MORE, themeParts(tokens, index, "contrast-boost", "    ", { shadows: false }), "  "),
    block(SEL_ALL_THEMES, section("Shadows", shadowDecls(tokens, "contrast-boost"), PREFIX, "    "), "  "),
    block(":root", section("Geometry", geometry, PREFIX, "    "), "  "),
    "}",
    "",
  );
  return out.join("\n");
}

// ─── site roles ──────────────────────────────────────────────────────

// Dark under prefers-contrast has no override of its own: it is the dark value,
// re-resolved against the DS Contrast Boost tokens (the var() chains do that in CSS).
function siteValue(role, siteTheme) {
  if (siteTheme === "light-more") return role.lightMore ?? role.light;
  if (siteTheme === "dark-more") return role.dark;
  return role[siteTheme];
}

const SITE_ROLE_KEYS = new Set(["dark", "light", "lightMore", "kind", "min", "on", "pageText", "why"]);

/** Resolve every site role to a hex for each site appearance. */
export function resolveSiteColors(siteRoles, index) {
  const out = {};
  for (const theme of SITE_THEMES) {
    out[theme] = {};
    for (const [name, role] of Object.entries(siteRoles.roles)) {
      const ref = refName(siteValue(role, theme));
      out[theme][name] = resolveHex(index, ref, SITE_TO_DS[theme], [`site:${name}`]);
    }
  }
  return out;
}

/** Validate the site-roles.json shape: every value a DS {ref}. */
export function checkSiteRoles(siteRoles, index) {
  const names = Object.keys(siteRoles.roles);
  for (const [name, role] of Object.entries(siteRoles.roles)) {
    const unknown = Object.keys(role).filter((k) => !SITE_ROLE_KEYS.has(k));
    if (unknown.length) throw new Error(`Site role "${name}" has unknown keys: ${unknown.join(", ")}`);
    for (const key of ["dark", "light", "lightMore"]) {
      if (!(key in role)) {
        if (key === "dark" || key === "light") throw new Error(`Site role "${name}" needs a ${key} value`);
        continue;
      }
      const r = refName(role[key]);
      if (!r) throw new Error(`Site role "${name}".${key} must be a {design-system token}, got ${role[key]}`);
      if (!index.has(r)) throw new Error(`Site role "${name}".${key} points at unknown DS token "${r}"`);
    }
    for (const bg of role.on ?? []) {
      if (!names.includes(bg)) throw new Error(`Site role "${name}" is measured on unknown role "${bg}"`);
    }
  }
}

/**
 * Measure every rule in site-roles.json. Returns the measurements; throws with
 * every failure listed, so a design-system sync that breaks AAA fails the build.
 */
export function measureSiteRoles(siteRoles, resolved) {
  const report = [];
  const failures = [];
  for (const [name, role] of Object.entries(siteRoles.roles)) {
    if (!role.min || !role.on) continue;
    for (const theme of SITE_THEMES) {
      const base = theme.startsWith("dark") ? "dark" : "light";
      let min = role.min;
      if (role.kind === "status" && role.pageText && role.pageText[base] === false) min = 3;
      for (const bg of role.on) {
        const ratio = contrastRatio(resolved[theme][name], resolved[theme][bg]);
        report.push({ role: name, theme, on: bg, ratio, min });
        if (ratio < min) failures.push(`${name} on ${bg} (${theme}): ${ratio.toFixed(2)}:1, needs ${min}:1`);
      }
    }
  }
  for (const theme of SITE_THEMES) {
    for (const [name, hex] of Object.entries(resolved[theme])) {
      if (/^#(?:ffffff|000000)(?:ff)?$/i.test(hex)) failures.push(`${name} (${theme}) resolves to pure ${hex}`);
    }
  }
  if (failures.length) throw new Error(`Site roles fail their contrast rules:\n  ${failures.join("\n  ")}`);
  return report;
}

/**
 * The bridge Tailwind's shadow-* utilities read (--site-shadow-*), for one DS
 * theme: the DS shadow's var(), or NO_SHADOW where the DS value is `none`.
 */
export function siteShadowDecls(tokens, dsTheme) {
  return tokens.shadow.tokens.map((s) => {
    const v = String(valueForTheme(s.value, dsTheme, s.name)).trim();
    return [s.name, v === "none" ? NO_SHADOW : fathomVar(s.name)];
  });
}

/** design-system/generated/site-roles.css */
export function buildSiteRolesCss({ tokens, siteRoles, source }) {
  const index = indexColors(tokens);
  checkSiteRoles(siteRoles, index);
  for (const s of tokens.shadow.tokens) {
    if (s.name in siteRoles.roles) throw new Error(`Site role "${s.name}" collides with the shadow bridge`);
  }
  const resolved = resolveSiteColors(siteRoles, index);
  const report = measureSiteRoles(siteRoles, resolved);
  const note = (name, theme) => {
    const rows = report.filter((r) => r.role === name && r.theme === theme && r.on === (siteRoles.roles[name].on ?? [])[0]);
    return rows.length ? ` /* ${rows[0].ratio.toFixed(2)}:1 on ${rows[0].on} */` : "";
  };
  const lines = (theme, filter = () => true) =>
    Object.entries(siteRoles.roles)
      .filter(([, role]) => filter(role))
      .map(([name, role]) => `  ${SITE_PREFIX}${name}: ${toCss(siteValue(role, theme))};${note(name, theme)}`);
  const moreLines = (theme) =>
    Object.entries(siteRoles.roles)
      .filter(([, role]) => role.lightMore)
      .map(([name, role]) => `    ${SITE_PREFIX}${name}: ${toCss(siteValue(role, theme))};${note(name, theme)}`);
  const shadows = (dsTheme, indent) =>
    section("Shadow bridge for Tailwind's shadow-* (never none: see the note above)", siteShadowDecls(tokens, dsTheme), SITE_PREFIX, indent);
  return [
    header("css", source),
    "",
    "/* The site's AAA role layer. Every color is a design-system variable, never a hex.",
    "   Rules and reasons: design-system/extensions/site-roles.json. Ratios are measured",
    "   by the build against the role's first surface; the build fails if any rule breaks.",
    "",
    "   The shadow bridge: Tailwind builds shadow-*, ring-* and inset-ring-* into one",
    "   box-shadow list, where a bare none voids the whole declaration and takes the ring",
    `   with it. So --site-shadow-* is the DS shadow, or ${NO_SHADOW} where the DS says none. */`,
    block(SEL_DARK, [...lines("dark"), ...shadows("dark", "  ")]),
    "",
    block(SEL_LIGHT, [...lines("light"), ...shadows("light", "  ")]),
    "",
    "/* Dark colors under prefers-contrast follow the DS Contrast Boost values through the",
    "   var() chains in fathom-tokens.css; light colors are boosted here. Contrast Boost",
    "   drops every shadow, in both themes. */",
    `${MEDIA_MORE} {`,
    block(SEL_LIGHT, moreLines("light-more"), "  "),
    block(SEL_ALL_THEMES, shadows("contrast-boost", "    "), "  "),
    "}",
    "",
  ].join("\n");
}

// ─── tokens.ts ───────────────────────────────────────────────────────

/** Every DS color resolved to a hex, per DS theme. */
export function resolveDsColors(index) {
  const out = {};
  for (const theme of DS_THEMES) {
    out[theme] = {};
    for (const name of index.keys()) out[theme][name] = resolveHex(index, name, theme);
  }
  return out;
}

/** design-system/generated/tokens.ts */
export function buildTokensTs({ tokens, siteRoles, source }) {
  const index = indexColors(tokens);
  checkSiteRoles(siteRoles, index);
  const ds = resolveDsColors(index);
  const site = resolveSiteColors(siteRoles, index);
  const rules = Object.fromEntries(
    Object.entries(siteRoles.roles).map(([name, role]) => {
      const rule = { kind: role.kind };
      if (role.min != null) rule.min = role.min;
      if (role.on) rule.on = role.on;
      if (role.pageText) rule.pageText = role.pageText;
      return [name, rule];
    }),
  );
  const json = (v) => JSON.stringify(v, null, 2);
  return [
    header("ts", source),
    "//",
    "// Resolved colors for places CSS variables cannot reach: OG images, the",
    "// theme-color meta, the manifest and the contrast tests. Pages use the CSS.",
    "",
    "/** Every design-system color token, resolved to a hex, per DS theme. */",
    `export const DS_COLORS = ${json(ds)} as const;`,
    "",
    "export type DsTheme = keyof typeof DS_COLORS;",
    'export type DsColor = keyof (typeof DS_COLORS)["dark"];',
    "",
    "/**",
    " * Every site role (--site-*), resolved per appearance. dark-more and light-more",
    " * are the two themes under prefers-contrast: more.",
    " */",
    `export const SITE_COLORS = ${json(site)} as const;`,
    "",
    "export type SiteTheme = keyof typeof SITE_COLORS;",
    'export type SiteRole = keyof (typeof SITE_COLORS)["dark"];',
    "",
    "/** What each site role is for, and the contrast it must hold (site-roles.json). */",
    `export const SITE_ROLE_RULES = ${json(rules)} as const;`,
    "",
    "/** The page ground per theme, for <meta name=\"theme-color\"> and the manifest. */",
    `export const THEME_COLOR = ${json({ dark: site.dark["bg-default"], light: site.light["bg-default"] })} as const;`,
    "",
  ].join("\n");
}

// ─── logos ───────────────────────────────────────────────────────────

function attr(tag, name) {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : undefined;
}

/**
 * Read an SVG's viewBox, paths and rects. Metadata, titles, roles, labels and
 * sizes are dropped: only geometry and fill survive.
 */
export function parseSvg(text, file = "svg") {
  const svg = /<svg\b[^>]*>/.exec(text);
  if (!svg) throw new Error(`${file}: no <svg> element`);
  const viewBox = attr(svg[0], "viewBox");
  if (!viewBox) throw new Error(`${file}: no viewBox`);
  const [, , width, height] = viewBox.split(/[\s,]+/).map(Number);
  const paths = [...text.matchAll(/<path\b([^>]*?)\/?>/g)].map((m) => ({
    d: attr(m[0], "d"),
    fill: attr(m[0], "fill"),
    fillRule: attr(m[0], "fill-rule") ?? "nonzero",
  }));
  const rects = [...text.matchAll(/<rect\b([^>]*?)\/?>/g)].map((m) => ({ fill: attr(m[0], "fill") }));
  if (!paths.length || paths.some((p) => !p.d)) throw new Error(`${file}: expected paths with a d`);
  return { viewBox, width, height, paths, rects };
}

function bboxOf(subpath) {
  const nums = (subpath.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
  if (nums.length % 2) throw new Error(`Odd coordinate count in subpath: ${subpath.slice(0, 40)}…`);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

function union(boxes) {
  return {
    minX: Math.min(...boxes.map((b) => b.minX)),
    minY: Math.min(...boxes.map((b) => b.minY)),
    maxX: Math.max(...boxes.map((b) => b.maxX)),
    maxY: Math.max(...boxes.map((b) => b.maxY)),
  };
}

/**
 * Split the one-path lockup into its mark and its word, by each subpath's
 * bounding box (control points bound the curve). Subpaths are cut at their
 * " M" boundaries and kept byte for byte, so markD + " " + wordD === d.
 */
export function splitLockup(d, markWidth) {
  if (!/^[MLCZ0-9.,\s-]+$/.test(d)) throw new Error("The lockup path uses commands the splitter does not handle");
  const subpaths = d.split(/ (?=M)/);
  const boxes = subpaths.map(bboxOf);
  const isMark = boxes.map((b) => b.maxX <= markWidth);
  const firstWord = isMark.indexOf(false);
  if (firstWord <= 0) throw new Error("The lockup has no mark subpaths or no word subpaths");
  if (isMark.slice(firstWord).some(Boolean)) throw new Error("The lockup's mark and word subpaths are interleaved");
  if (boxes.slice(firstWord).some((b) => b.minX <= markWidth)) throw new Error("A word subpath overlaps the mark");
  const markD = subpaths.slice(0, firstWord).join(" ");
  const wordD = subpaths.slice(firstWord).join(" ");
  if (`${markD} ${wordD}` !== d) throw new Error("Splitting the lockup changed its path");
  const round = (b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Number(v.toFixed(3))]));
  return {
    markD,
    wordD,
    markBox: round(union(boxes.slice(0, firstWord))),
    wordBox: round(union(boxes.slice(firstWord))),
  };
}

/** The vendored logo files the generator reads, ink first; bone must match. */
export const LOGO_FILES = {
  MARK_120: "fathom-mark",
  MARK_32: "fathom-mark-32",
  MARK_24: "fathom-mark-24",
  MARK_16: "fathom-mark-16",
  LOCKUP_MARK: "fathom-lockup-mark",
  LOGOTYPE: "fathom-logotype",
  LOCKUP: "fathom-lockup",
};
export const APP_ICON_FILE = "fathom-app-icon.svg";

/** design-system/generated/logo-paths.ts. `svgs` maps file name -> SVG text. */
export function buildLogoPathsTs({ svgs, tokens, source }) {
  const index = indexColors(tokens);
  const primitiveByHex = new Map();
  for (const t of index.values()) if (colorKind(t) === "primitive") primitiveByHex.set(t.value.toLowerCase(), t.name);

  const read = (file) => {
    if (!(file in svgs)) throw new Error(`Missing vendored logo ${file}`);
    return parseSvg(svgs[file], file);
  };
  const single = (base) => {
    const ink = read(`${base}-ink.svg`);
    const bone = read(`${base}-bone.svg`);
    if (ink.paths.length !== 1) throw new Error(`${base}-ink.svg should have one path`);
    if (ink.viewBox !== bone.viewBox || ink.paths[0].d !== bone.paths[0].d || ink.paths[0].fillRule !== bone.paths[0].fillRule) {
      throw new Error(`${base}: the ink and bone files disagree on geometry`);
    }
    const p = ink.paths[0];
    return { viewBox: ink.viewBox, width: ink.width, height: ink.height, d: p.d, fillRule: p.fillRule };
  };

  const marks = { 120: single(LOGO_FILES.MARK_120), 32: single(LOGO_FILES.MARK_32), 24: single(LOGO_FILES.MARK_24), 16: single(LOGO_FILES.MARK_16) };
  for (const [size, m] of Object.entries(marks)) {
    if (m.width !== Number(size) || m.height !== Number(size)) throw new Error(`The ${size} mark has viewBox ${m.viewBox}`);
  }
  const lockupMark = single(LOGO_FILES.LOCKUP_MARK);
  const logotype = single(LOGO_FILES.LOGOTYPE);
  const lockup = single(LOGO_FILES.LOCKUP);
  const split = splitLockup(lockup.d, lockupMark.width);

  const icon = read(APP_ICON_FILE);
  if (icon.paths.length !== 1 || icon.rects.length !== 1) throw new Error("The app icon should be one rect and one path");
  const bg = icon.rects[0].fill.toLowerCase();
  const fg = icon.paths[0].fill.toLowerCase();
  const bgToken = primitiveByHex.get(bg);
  const fgToken = primitiveByHex.get(fg);
  if (!bgToken || !fgToken) throw new Error(`App icon fills ${bg} / ${fg} are not DS primitives`);
  const appIcon = {
    viewBox: icon.viewBox,
    width: icon.width,
    height: icon.height,
    d: icon.paths[0].d,
    fillRule: icon.paths[0].fillRule,
    background: bg,
    foreground: fg,
    backgroundToken: bgToken,
    foregroundToken: fgToken,
  };

  const json = (v) => JSON.stringify(v, null, 2);
  return [
    header("ts", source),
    "//",
    "// Logo geometry from design-system/vendor/logos. Every `d` is the vendored",
    "// file's own string, byte for byte: no path optimization, which would move",
    "// the pixel-fitted masters off their grid. Metadata, titles and sizes are",
    "// dropped; components fill with currentColor.",
    "",
    'export type LogoFillRule = "evenodd" | "nonzero";',
    "",
    "export interface LogoPath {",
    "  readonly viewBox: string;",
    "  readonly width: number;",
    "  readonly height: number;",
    "  readonly d: string;",
    "  readonly fillRule: LogoFillRule;",
    "}",
    "",
    "export interface LogoBox {",
    "  readonly minX: number;",
    "  readonly minY: number;",
    "  readonly maxX: number;",
    "  readonly maxY: number;",
    "}",
    "",
    "/** The pixel-fitted mark masters, largest first. */",
    "export const MARK_MASTERS = [120, 32, 24, 16] as const;",
    "export type MarkMaster = (typeof MARK_MASTERS)[number];",
    "",
    `export const MARK: { readonly [K in MarkMaster]: LogoPath } = ${json(marks)};`,
    "",
    "/** The mark as drawn for the lockup (76 units), on its own. */",
    `export const LOCKUP_MARK: LogoPath = ${json(lockupMark)};`,
    "",
    "/** The word fathom, lowercase. */",
    `export const LOGOTYPE: LogoPath = ${json(logotype)};`,
    "",
    "/** Mark and word in one drawing; markD and wordD split it so each can take its own color. */",
    `export const LOCKUP: LogoPath & { readonly markD: string; readonly wordD: string; readonly markBox: LogoBox; readonly wordBox: LogoBox } = ${json({ ...lockup, ...split })};`,
    "",
    "/** The app icon: a mark on a filled square. Its colors are DS primitives. */",
    `export const APP_ICON: LogoPath & { readonly background: string; readonly foreground: string; readonly backgroundToken: string; readonly foregroundToken: string } = ${json(appIcon)};`,
    "",
  ].join("\n");
}

// ─── everything ──────────────────────────────────────────────────────

/** All generated files, relative to design-system/. */
export function generateAll(inputs) {
  return {
    "generated/fathom-tokens.css": buildFathomTokensCss(inputs),
    "generated/site-roles.css": buildSiteRolesCss(inputs),
    "generated/tokens.ts": buildTokensTs(inputs),
    "generated/logo-paths.ts": buildLogoPathsTs(inputs),
  };
}

// ─── sync diff ───────────────────────────────────────────────────────

/** Flatten tokens.json to theme -> name -> value, for the sync diff. */
export function flattenForDiff(tokens) {
  const out = { dark: {}, light: {}, "contrast-boost": {}, all: {} };
  for (const t of tokens.color?.tokens ?? []) for (const th of DS_THEMES) out[th][t.name] = String(valueForTheme(t.value, th, t.name));
  for (const t of tokens.shadow?.tokens ?? []) for (const th of DS_THEMES) out[th][t.name] = String(valueForTheme(t.value, th, t.name));
  for (const g of STATIC_GROUPS) for (const t of tokens[g]?.tokens ?? []) out.all[t.name] = String(t.value);
  for (const [k, v] of Object.entries(tokens.type?.families ?? {})) out.all[`font-${k}`] = v;
  for (const group of tokens.type?.groups ?? []) {
    for (const s of group.styles) {
      const values = Object.fromEntries(Object.entries(s).filter(([k]) => k !== "usage" && k !== "sample"));
      out.all[`type-${s.name}`] = JSON.stringify(values);
    }
  }
  return out;
}

/** theme -> { added, removed, changed: [name, old, new][] } */
export function diffTokens(before, after) {
  const a = flattenForDiff(before);
  const b = flattenForDiff(after);
  const out = {};
  for (const theme of Object.keys(b)) {
    const oldMap = a[theme] ?? {};
    const newMap = b[theme];
    out[theme] = {
      added: Object.keys(newMap).filter((k) => !(k in oldMap)),
      removed: Object.keys(oldMap).filter((k) => !(k in newMap)),
      changed: Object.keys(newMap)
        .filter((k) => k in oldMap && oldMap[k] !== newMap[k])
        .map((k) => [k, oldMap[k], newMap[k]]),
    };
  }
  return out;
}
