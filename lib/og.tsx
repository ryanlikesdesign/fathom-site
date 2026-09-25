import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LOCKUP } from "@/design-system/generated/logo-paths";
import { SITE_COLORS } from "@/design-system/generated/tokens";
import { COPY_13 } from "@/lib/copy-13";

/* ================================================================
   What the link-preview cards share (app/opengraph-image.tsx and
   app/promo/r/[id]/opengraph-image.tsx): the site's dark theme, its
   typeface, the design system's lockup, the card's frame, and the
   homepage card itself, which a dead redeem link falls back to.

   Colors are the dark theme's site roles (design-system/generated/
   tokens.ts), resolved to hex because an image route has no CSS: bone
   text on ink, the mark and the second line in the accent, as the
   header and the hero draw them.

   The face is Atkinson Hyperlegible Next, the site's own, read from the
   @fontsource package on disk (the renderer takes ttf, otf or woff, never
   woff2), so rendering a card never waits on a network fetch. Paths are
   literal joins from process.cwd() so output file tracing ships the two
   files with the route (node_modules/next/dist/docs/01-app/
   03-api-reference/03-file-conventions/01-metadata/opengraph-image.md).
   ================================================================ */

const DARK = SITE_COLORS.dark;

export const OG_COLORS = {
  ground: DARK["bg-default"],
  text: DARK["text-primary"],
  secondary: DARK["text-secondary"],
  accent: DARK["accent-fg"],
} as const;

export const OG_FONT_FAMILY = "Atkinson Hyperlegible Next";

/** The site's display weight (--site-type-display-weight) and its body weight. */
export const OG_WEIGHT = { display: 500, body: 400 } as const;

type OgFont = { name: string; data: Buffer; weight: 400 | 500; style: "normal" };

let fontsPromise: Promise<OgFont[] | undefined> | null = null;

/**
 * The two weights the cards set, read once per process. A card is never
 * worth a failed request: if a file can't be read, the card renders in
 * the renderer's fallback face and the next request tries again.
 */
export function ogFonts(): Promise<OgFont[] | undefined> {
  fontsPromise ??= Promise.all([
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff",
      ),
    ),
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-500-normal.woff",
      ),
    ),
  ])
    .then(([regular, medium]): OgFont[] => [
      { name: OG_FONT_FAMILY, data: regular, weight: OG_WEIGHT.body, style: "normal" },
      { name: OG_FONT_FAMILY, data: medium, weight: OG_WEIGHT.display, style: "normal" },
    ])
    .catch((err: unknown) => {
      console.error("[og] font read failed, using the fallback face:", err);
      fontsPromise = null;
      return undefined;
    });
  return fontsPromise;
}

/**
 * The design system's lockup (design-system/generated/logo-paths.ts), mark
 * in the accent and word in bone, as components/brand/Lockup.tsx and the
 * header draw it. `height` is the mark's height; the width follows.
 */
export function OgLockup({ height }: { height: number }) {
  const width = Number(((height * LOCKUP.width) / LOCKUP.height).toFixed(2));
  return (
    <svg width={width} height={height} viewBox={LOCKUP.viewBox}>
      <path d={LOCKUP.markD} fill={OG_COLORS.accent} fillRule={LOCKUP.fillRule} />
      <path d={LOCKUP.wordD} fill={OG_COLORS.text} fillRule={LOCKUP.fillRule} />
    </svg>
  );
}

/** The card's ground, padding and face; each card fills it with the lockup and its words. */
export const OG_FRAME = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "72px 80px",
  background: OG_COLORS.ground,
  fontFamily: OG_FONT_FAMILY,
} as const;

/**
 * The homepage's card (app/opengraph-image.tsx), which every subpage shares
 * and a dead redeem link falls back to: the lockup, then the hero line on
 * two lines as the hero sets it, the second in the accent, and who it's
 * for. Every word is COPY_13.og, so COPY_13.og.alt describes it.
 */
export function HomeCard() {
  const [first, second, sub] = COPY_13.og.lines;
  return (
    <div style={OG_FRAME}>
      <OgLockup height={56} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: "104px",
            fontWeight: OG_WEIGHT.display,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: OG_COLORS.text,
          }}
        >
          <span>{first}</span>
          <span style={{ color: OG_COLORS.accent }}>{second}</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "32px",
            fontSize: "34px",
            fontWeight: OG_WEIGHT.body,
            lineHeight: 1.3,
            color: OG_COLORS.secondary,
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}
