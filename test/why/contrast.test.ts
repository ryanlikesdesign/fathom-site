// Contrast for /why, on the grounds it uses: the page (bg-default), the
// toned scenes (bg-sheet, which test/contrast.test.ts does not cover) and
// the navy pivot (accent-fill). Text holds AAA; art, as graphics, 3:1.
import { describe, expect, it } from "vitest";
import { SITE_COLORS, type SiteRole, type SiteTheme } from "@/design-system/generated/tokens";

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
const on = (theme: SiteTheme, fg: SiteRole, bg: SiteRole) => ratio(SITE_COLORS[theme][fg], SITE_COLORS[theme][bg]);
const GROUNDS = ["bg-default", "bg-sheet"] as const;

describe("/why text on the toned scenes", () => {
  it.each(THEMES)("primary text is at least 11.2:1 and secondary at least 7:1 on bg-sheet (%s)", (theme) => {
    expect(on(theme, "text-primary", "bg-sheet")).toBeGreaterThanOrEqual(11.2);
    expect(on(theme, "text-secondary", "bg-sheet")).toBeGreaterThanOrEqual(7);
  });

  it.each(THEMES)("the pivot's words hold AAA on the navy (%s)", (theme) => {
    expect(on(theme, "text-on-accent", "accent-fill")).toBeGreaterThanOrEqual(7);
  });
});

describe("/why art", () => {
  it.each(THEMES)("line colors hold 3:1 on the page and the toned scenes (%s)", (theme) => {
    for (const fg of ["text-primary", "text-secondary", "accent-fg", "border-control"] as const) {
      for (const bg of GROUNDS) expect(on(theme, fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(THEMES)("lines on the navy hold 3:1 (%s)", (theme) => {
    for (const fg of ["media-edge", "text-on-accent"] as const) {
      expect(on(theme, fg, "accent-fill"), fg).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(THEMES)("the pupil's outline holds 3:1 against either ground, by its edge ring or its navy (%s)", (theme) => {
    for (const bg of GROUNDS) {
      const edge = Math.max(on(theme, "media-edge", bg), on(theme, "accent-fill", bg));
      expect(edge, bg).toBeGreaterThanOrEqual(3);
    }
  });
});
