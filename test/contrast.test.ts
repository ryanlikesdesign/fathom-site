// AAA on the site's own role layer, measured from the resolved hexes in
// design-system/generated/tokens.ts with an independent WCAG 2.x contrast
// function. Themes: dark, light, and each under prefers-contrast: more.
import { describe, it, expect } from "vitest";
import { DS_COLORS, SITE_COLORS, SITE_ROLE_RULES, type SiteRole, type SiteTheme } from "@/design-system/generated/tokens";

function luminance(hex: string) {
  const h = hex.replace("#", "");
  expect(h, `${hex} must be opaque to measure`).toHaveLength(6);
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const THEMES = Object.keys(SITE_COLORS) as SiteTheme[];
const SURFACES = ["bg-default", "bg-subtle", "bg-raised"] as const;
const on = (theme: SiteTheme, fg: SiteRole, bg: SiteRole) => ratio(SITE_COLORS[theme][fg], SITE_COLORS[theme][bg]);

describe("site roles: page text", () => {
  it("covers dark, light and both under prefers-contrast", () => {
    expect([...THEMES].sort()).toEqual(["dark", "dark-more", "light", "light-more"]);
  });

  it.each(THEMES)("primary text is at least 11.2:1 on every surface (%s)", (theme) => {
    for (const bg of SURFACES) expect(on(theme, "text-primary", bg), bg).toBeGreaterThanOrEqual(11.2);
  });

  it.each(THEMES)("secondary text is at least 7:1 on every surface (%s)", (theme) => {
    for (const bg of SURFACES) expect(on(theme, "text-secondary", bg), bg).toBeGreaterThanOrEqual(7);
  });

  it.each(THEMES)("accent text is at least 7:1 on the page ground (%s)", (theme) => {
    expect(on(theme, "accent-fg", "bg-default")).toBeGreaterThanOrEqual(7);
  });

  it.each(THEMES)("text on the CTA and on accent fills is at least 7:1 (%s)", (theme) => {
    expect(on(theme, "cta-fg", "cta-bg")).toBeGreaterThanOrEqual(7);
    expect(on(theme, "text-on-accent", "accent-fill")).toBeGreaterThanOrEqual(7);
  });

  it.each(THEMES)("tertiary text is metadata only and still clears 4.5:1 (%s)", (theme) => {
    expect(SITE_ROLE_RULES["text-tertiary"].kind).toBe("metadata");
    for (const bg of SURFACES) expect(on(theme, "text-tertiary", bg), bg).toBeGreaterThanOrEqual(4.5);
  });

  it.each(THEMES)("status colors reach 7:1 as text or are flagged glyph-only (%s)", (theme) => {
    const base = theme.startsWith("dark") ? "dark" : "light";
    for (const role of ["success-fg", "hazard-fg", "caution-fg"] as const) {
      const r = on(theme, role, "bg-default");
      const pageText = SITE_ROLE_RULES[role].pageText[base];
      if (pageText) expect(r, role).toBeGreaterThanOrEqual(7);
      else expect(r, `${role} as a glyph`).toBeGreaterThanOrEqual(3);
    }
  });

  it("flags light success text: no DS reed reaches 7:1 on the light ground", () => {
    expect(SITE_ROLE_RULES["success-fg"].pageText).toEqual({ dark: true, light: false });
    expect(on("light", "success-fg", "bg-default")).toBeLessThan(7);
    expect(on("dark", "success-fg", "bg-default")).toBeGreaterThanOrEqual(7);
  });
});

describe("site roles: edges", () => {
  it.each(THEMES)("control edges and the focus ring are at least 3:1 on every surface (%s)", (theme) => {
    for (const bg of SURFACES) {
      expect(on(theme, "border-control", bg), `border-control on ${bg}`).toBeGreaterThanOrEqual(3);
      expect(on(theme, "focus-ring", bg), `focus-ring on ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(THEMES)("the CTA's boundary is at least 3:1 against the page (%s)", (theme) => {
    const edge = Math.max(on(theme, "cta-bg", "bg-default"), on(theme, "cta-border", "bg-default"));
    expect(edge).toBeGreaterThanOrEqual(3);
  });
});

describe("site roles: every rule in site-roles.json holds", () => {
  it.each(THEMES)("%s", (theme) => {
    const base = theme.startsWith("dark") ? "dark" : "light";
    for (const [role, rule] of Object.entries(SITE_ROLE_RULES) as [SiteRole, (typeof SITE_ROLE_RULES)[SiteRole]][]) {
      if (!("min" in rule) || !("on" in rule)) continue;
      const min = "pageText" in rule && !rule.pageText[base] ? 3 : rule.min;
      for (const bg of rule.on) expect(on(theme, role, bg as SiteRole), `${role} on ${bg}`).toBeGreaterThanOrEqual(min);
    }
  });
});

describe("the measured fixes over the DS values", () => {
  it("light secondary text is fog-800, because DS fog-700 is under 7:1", () => {
    expect(SITE_COLORS.light["text-secondary"]).toBe(DS_COLORS.light["fog-800"]);
    expect(ratio(DS_COLORS.light["color-text-secondary"], DS_COLORS.light["color-bg-default"])).toBeLessThan(7);
  });

  it("light accent text is fathom-900, because DS fathom-700 is under 7:1", () => {
    expect(SITE_COLORS.light["accent-fg"]).toBe(DS_COLORS.light["fathom-900"]);
    expect(ratio(DS_COLORS.light["color-accent-fg"], DS_COLORS.light["color-bg-default"])).toBeLessThan(7);
  });

  it("the CTA is fathom-900 with bone text in both themes", () => {
    for (const theme of THEMES) {
      expect(SITE_COLORS[theme]["cta-bg"], theme).toBe(DS_COLORS.dark["fathom-900"]);
      expect(SITE_COLORS[theme]["cta-fg"], theme).toBe(DS_COLORS.dark["bone-100"]);
    }
    // The DS dark accent fill would not clear AAA with white on it.
    expect(ratio(DS_COLORS.dark["color-text-on-accent"], DS_COLORS.dark["color-accent-fill"])).toBeLessThan(7);
  });

  it("never paints pure white or pure black: bone-0 renders as bone-25", () => {
    for (const theme of THEMES) {
      for (const [role, hex] of Object.entries(SITE_COLORS[theme])) {
        expect(hex, `${role} (${theme})`).not.toMatch(/^#(ffffff|000000)/i);
      }
    }
    expect(DS_COLORS.light["color-bg-raised"]).toBe("#ffffff");
    expect(SITE_COLORS.light["bg-raised"]).toBe(DS_COLORS.light["bone-25"]);
    expect(SITE_COLORS.light["bg-chrome"]).toBe(DS_COLORS.light["bone-25"]);
    expect(SITE_COLORS.dark["text-on-accent"]).toBe(DS_COLORS.dark["bone-25"]);
  });

  it("dark under prefers-contrast takes the DS Contrast Boost values", () => {
    const cb = DS_COLORS["contrast-boost"];
    expect(SITE_COLORS["dark-more"]["bg-default"]).toBe(cb["color-bg-default"]);
    expect(SITE_COLORS["dark-more"]["text-primary"]).toBe(cb["color-text-primary"]);
    expect(SITE_COLORS["dark-more"]["text-secondary"]).toBe(cb["color-text-secondary"]);
    expect(SITE_COLORS["dark-more"]["border-control"]).toBe(cb["color-border-control"]);
  });
});
