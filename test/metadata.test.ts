// Everything that names the site outside its pages: the <head> metadata,
// the JSON-LD graph, the manifest, the link-preview cards and the icons.
// Each reads COPY_13 (lib/copy-13.ts) or the design system, and each
// string follows the copy rules the pages do.
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// app/layout.tsx pulls in next/font (build-time only) and PostHog.
vi.mock("@/lib/fonts", () => ({ fontVariables: "" }));
vi.mock("posthog-js", () => ({ default: { init: vi.fn(), capture: vi.fn() } }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "vitest" }),
}));
vi.mock("@/lib/promoDb", () => ({
  // "stub" has a code, "down" is a database error, anything else is a dead link.
  findBySlug: async (slug: string) => {
    if (slug === "down") throw new Error("database down");
    return slug === "stub"
      ? { code: "A1B2C3", slug, status: "reserved", offerName: "Outreach", durationLabel: "3 months free", shortLabel: "3 mo" }
      : null;
  },
  markOpened: async () => undefined,
  trackQuietly: async () => undefined,
}));

import { metadata as layoutMetadata, viewport } from "@/app/layout";
import Home, { metadata as homeMetadata } from "@/app/page";
import { alt as ogAlt, size as ogSize } from "@/app/opengraph-image";
import { generateImageMetadata as promoCardMeta } from "@/app/promo/r/[id]/opengraph-image";
import RedeemPage, { generateMetadata as redeemMetadata } from "@/app/promo/r/[id]/page";
import { metadata as supportMetadata } from "@/app/support/page";
import { COPY_13 } from "@/lib/copy-13";
import { MIN_IOS, PAYWALL, PLUS_CAPABILITIES } from "@/lib/app-facts";
import { pageMeta } from "@/lib/pageMeta";
import { PITCH, PLUS_ADDS } from "@/lib/pitch";
import { REDEEM_FALLBACK, redeemDescription, redeemTitle } from "@/lib/promo-copy";
import { OG_FONT_FAMILY, OG_WEIGHT, ogFonts } from "@/lib/og";
import {
  APP_ID,
  APP_STORE_NAME,
  FEATURES,
  KEYWORDS,
  SITE_NAME,
  SITE_URL,
  appJsonLd,
  homePageJsonLd,
  jsonLdScript,
  siteMetadata,
} from "@/lib/site-meta";
import { APP_ICON, MARK } from "@/design-system/generated/logo-paths";
import { DS_COLORS, THEME_COLOR } from "@/design-system/generated/tokens";
import { marketingViolations, stringsIn, words } from "./helpers/copy-rules";

const root = path.resolve(__dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

/** The 1.2 positioning, and claims the app can't back. */
const OLD_POSITIONING =
  /AI companion|indoor|wayfinding|beacons|No maps|Walk in\.|Know the room|guides? you through|navigate any building|\bGPS\b|your eyes/i;

/** Every string in a value, labeled, minus URLs (they name the domain, not the brand). */
function strings(node: unknown): string[] {
  return stringsIn(node).filter((s) => !/^(https?:)?\/\//.test(s) && !s.startsWith("/"));
}

function expectCopy(texts: readonly string[]) {
  for (const text of texts) {
    expect(marketingViolations(text), text).toEqual([]);
    expect(text, text).not.toMatch(OLD_POSITIONING);
  }
}

const manifest = JSON.parse(read("public/manifest.webmanifest")) as Record<string, string>;
const app = appJsonLd;
const webPage = homePageJsonLd;

/** The JSON-LD blocks a rendered tree carries, parsed. */
function jsonLdIn(container: HTMLElement): Array<Record<string, unknown>> {
  return [...container.querySelectorAll('script[type="application/ld+json"]')].map((el) => JSON.parse(el.textContent ?? ""));
}

describe("the layout metadata", () => {
  it("is the site metadata, built from COPY_13", () => {
    expect(layoutMetadata).toBe(siteMetadata);
    expect(siteMetadata.title).toEqual({ default: COPY_13.meta.title, template: "%s | fathom" });
    expect(siteMetadata.description).toBe(COPY_13.meta.description);
    expect(siteMetadata.applicationName).toBe("fathom");
    expect(siteMetadata.openGraph).toMatchObject({
      title: COPY_13.meta.title,
      description: COPY_13.meta.description,
      siteName: "fathom",
    });
    expect(siteMetadata.twitter).toMatchObject({ title: COPY_13.meta.title, description: COPY_13.meta.description });
  });

  it("follows the copy rules in every string", () => {
    expectCopy(strings(siteMetadata));
    expectCopy(KEYWORDS);
  });

  it("keeps the keywords short and distinct, and never calls fathom a VoiceOver app", () => {
    expect(KEYWORDS.length).toBeLessThanOrEqual(6);
    expect(new Set(KEYWORDS).size).toBe(KEYWORDS.length);
    expect(KEYWORDS.join(" ")).not.toMatch(/VoiceOver app/i);
  });

  it("names the one host, www, which the bare domain redirects to", () => {
    expect(SITE_URL).toBe("https://www.fathomvision.app");
    expect(String(siteMetadata.metadataBase)).toBe("https://www.fathomvision.app/");
    expect(siteMetadata.openGraph).toMatchObject({ url: SITE_URL });
    expect(read("app/sitemap.ts")).toContain("SITE_URL");
    expect(read("app/robots.ts")).toContain("SITE_URL");
  });

  it("paints the browser chrome with the design system's page ground", () => {
    expect(viewport.themeColor).toEqual([
      { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
      { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    ]);
    expect(THEME_COLOR.dark).toBe(DS_COLORS.dark["ink-900"]);
  });
});

describe("the homepage and subpage metadata", () => {
  it("titles the homepage with the whole COPY_13 line, and gives it a canonical", () => {
    expect(homeMetadata.title).toEqual({ absolute: COPY_13.meta.title });
    expect(homeMetadata.description).toBe(COPY_13.meta.description);
    expect(homeMetadata.alternates).toEqual({ canonical: "/" });
  });

  it("suffixes subpages with | fathom and keeps the shared preview", () => {
    const meta = pageMeta("Support", "A description.", "/support");
    expect(meta.openGraph).toMatchObject({ title: "Support | fathom", siteName: "fathom", url: "https://www.fathomvision.app/support" });
    expect(meta.twitter).toMatchObject({ title: "Support | fathom", card: "summary_large_image" });
    expect(stringsIn(meta.openGraph)).toContain(COPY_13.og.alt);
    expectCopy(strings(supportMetadata));
  });
});

describe("the JSON-LD", () => {
  it("names the app exactly as the App Store does, and the brand lowercase", () => {
    expect(app.name).toBe("Fathom: Visual Assistance");
    expect(APP_STORE_NAME).toBe(app.name);
    expect(app.alternateName).toBe("fathom");
    expect(app.publisher.name).toBe("Unruly Vision, LLC");
  });

  it("follows the copy rules in every string, the App Store name excepted", () => {
    expectCopy(strings(appJsonLd));
    expectCopy(strings(homePageJsonLd));
  });

  it("describes the home page with the page's own metadata, and points at the app", () => {
    expect(webPage.name).toBe(COPY_13.meta.title);
    expect(webPage.description).toBe(COPY_13.meta.description);
    expect(webPage.url).toBe(SITE_URL);
    expect(webPage.about).toEqual({ "@id": APP_ID });
    expect(app["@id"]).toBe(APP_ID);
    expect(webPage.speakable.cssSelector).toEqual([".hero-eyebrow", ".hero-title", ".hero-lede"]);
  });

  it("puts the WebPage node on the homepage only; the layout carries the app's", () => {
    expect(read("app/layout.tsx")).toContain("jsonLdScript(appJsonLd)");
    expect(read("app/layout.tsx")).not.toContain("homePageJsonLd");
    const { container, unmount } = render(createElement(Home));
    expect(jsonLdIn(container)).toEqual([JSON.parse(jsonLdScript(homePageJsonLd))]);
    unmount();
  });

  it("uses only schema.org accessibilityFeature terms that describe the app", () => {
    // Readout headings on the rotor, Contrast Boost, text to the largest accessibility sizes.
    expect(app.accessibilityFeature).toEqual(["structuralNavigation", "highContrastDisplay", "largePrint"]);
  });

  it("says Lookout's levels set how much it says, not that every level describes", () => {
    const lookout = FEATURES.find((f) => f.startsWith("Lookout:"));
    expect(lookout).toBe("Lookout: describes what’s around you while you move, and you choose how much it says: Hazards Only, Balanced, or Full Awareness");
  });

  it("prices the app from the paywall: free, and fathom plus by the month", () => {
    const [free, plus] = app.offers;
    expect(free).toMatchObject({ price: "0", priceCurrency: "USD" });
    expect(plus.name).toBe(PAYWALL.title.value);
    expect(`$${plus.price}`).toBe(PAYWALL.price.value);
    expect(plus.description).toBe(PAYWALL.offer.value);
    expect(plus.priceSpecification.billingDuration).toBe("P1M");
    expect(app.operatingSystem).toBe(`iOS ${MIN_IOS.value} or later`);
  });

  it("lists every fathom plus capability among its features", () => {
    const list = FEATURES.join(" ").toLowerCase();
    for (const cap of PLUS_CAPABILITIES) expect(list, cap.id).toContain(cap.name.value.toLowerCase());
    expect([...app.featureList]).toEqual([...FEATURES]);
  });

  it("escapes < so the script tag can't be closed early", () => {
    expect(jsonLdScript({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });
});

describe("the manifest", () => {
  it("names the site fathom, with the tagline and the dark ground", () => {
    expect(manifest.name).toBe(SITE_NAME);
    expect(manifest.short_name).toBe(SITE_NAME);
    expect(manifest.description).toBe(COPY_13.tagline);
    expect(manifest.theme_color).toBe(THEME_COLOR.dark);
    expect(manifest.background_color).toBe(THEME_COLOR.dark);
    expectCopy([manifest.name, manifest.short_name, manifest.description]);
  });
});

describe("the preview cards and icons", () => {
  it("describes the homepage card with COPY_13.og", () => {
    expect(ogAlt).toBe(COPY_13.og.alt);
    expect(ogSize).toEqual({ width: 1200, height: 630 });
    expectCopy([ogAlt, ...COPY_13.og.lines]);
  });

  it("describes each redeem card as it's drawn: the duration found, the generic offer, or the homepage card", async () => {
    const alt = async (id?: string) => {
      const items = await promoCardMeta({ params: id === undefined ? {} : { id } });
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ id: "card", size: { width: 1200, height: 630 }, contentType: "image/png" });
      return items[0].alt;
    };
    const tail = `${COPY_13.tagline} Tap to redeem.`;
    // A code: its duration, as a sighted recipient reads it on the card.
    expect(await alt("stub")).toBe(`fathom. Free trial inside. ${redeemTitle("3 months free")}. ${tail}`);
    // Our error, or a build with no slug: a code may exist, so the generic offer.
    expect(await alt("down")).toBe(`fathom. Free trial inside. ${redeemTitle("a free trial")}. ${tail}`);
    expect(await alt()).toBe(await alt("down"));
    // No code: the homepage card, which promises no trial.
    expect(await alt("gone")).toBe(COPY_13.og.alt);
    expectCopy([await alt("stub"), await alt("down"), await alt("gone")]);
  });

  it("draws a dead link's card as the homepage's, never as a trial", () => {
    const src = read("app/promo/r/[id]/opengraph-image.tsx");
    expect(src).toContain("<HomeCard />");
    expect(read("app/opengraph-image.tsx")).toContain("<HomeCard />");
  });

  it("loads the site's face, in both weights the cards set, from disk", async () => {
    const fonts = await ogFonts();
    expect(fonts?.map((f) => [f.name, f.weight, f.style])).toEqual([
      [OG_FONT_FAMILY, OG_WEIGHT.body, "normal"],
      [OG_FONT_FAMILY, OG_WEIGHT.display, "normal"],
    ]);
    for (const f of fonts ?? []) {
      expect(f.data.byteLength).toBeGreaterThan(10_000);
      // woff, which the renderer reads (it never takes woff2).
      expect(f.data.subarray(0, 4).toString("latin1")).toBe("wOFF");
    }
  });

  it("paints with tokens and the design system's logo, never a hex or a hand-drawn mark", () => {
    for (const file of ["app/opengraph-image.tsx", "app/promo/r/[id]/opengraph-image.tsx", "app/apple-icon.tsx", "lib/og.tsx"]) {
      const src = read(file);
      expect(src, file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(src, file).not.toMatch(/rgba?\(|<circle/);
    }
    expect(read("lib/og.tsx")).toContain("LOCKUP.markD");
    expect(read("app/apple-icon.tsx")).toContain("APP_ICON.d");
  });

  it("draws the favicon as the app icon: the 16 master in bone on fathom-900", () => {
    const svg = read("app/icon.svg");
    expect(/<path\b[^>]*\sd="([^"]+)"/.exec(svg)?.[1]).toBe(MARK[16].d);
    expect(svg).toContain(`fill="${APP_ICON.background}"`);
    expect(svg).toContain(`fill="${APP_ICON.foreground}"`);
    expect(APP_ICON.background).toBe(DS_COLORS.dark["fathom-900"]);
    expect(APP_ICON.foreground).toBe(DS_COLORS.dark["bone-100"]);
    // Pixel-exact at the 16 CSS px a tab draws: a 16 box, the master untransformed.
    expect(svg).toContain('viewBox="0 0 16 16"');
    expect(svg).toContain('<rect width="16" height="16"');
    expect(svg).not.toMatch(/transform=/);
  });
});

describe("the lines that describe fathom from outside", () => {
  const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

  it("builds the pitch from COPY_13's tagline and hero eyebrow", () => {
    const tagline = COPY_13.tagline.replace(/\.$/, "");
    expect(PITCH).toBe(`fathom is ${lowerFirst(tagline)}, ${lowerFirst(COPY_13.hero.eyebrow)} on iPhone.`);
  });

  it("says what fathom plus adds as the download section does", () => {
    expect(COPY_13.download.plusLine.startsWith(`${PLUS_ADDS} `)).toBe(true);
  });
});

describe("the promo redeem page metadata", () => {
  const meta = (id: string) => redeemMetadata({ params: Promise.resolve({ id }) });

  it("names the trial fathom plus and carries the code", async () => {
    const found = await meta("stub");
    expect(found.title).toBe(redeemTitle("3 months free"));
    expect(found.title).toBe("You’ve got 3 months free of fathom plus");
    expect(found.description).toBe(redeemDescription("A1B2C3", "3 months free"));
    expect(found.robots).toMatchObject({ index: false });
    expectCopy(strings(found));
  });

  it("falls back to generic words for a dead link or a database error", async () => {
    for (const id of ["gone", "down"]) {
      const missing = await meta(id);
      expect(missing.title, id).toBe(REDEEM_FALLBACK.title);
      expect(missing.description, id).toBe(REDEEM_FALLBACK.description);
      expectCopy(strings(missing));
    }
  });

  it("gives the link preview the page's own words and the shared Open Graph fields, found or not", async () => {
    for (const id of ["stub", "gone", "down"]) {
      const m = await meta(id);
      // A page's openGraph replaces the layout's whole, so without these the
      // preview would show the homepage's title, description and url.
      expect(m.openGraph, id).toMatchObject({
        siteName: "fathom",
        type: "website",
        locale: "en_US",
        title: m.title,
        description: m.description,
        url: `https://www.fathomvision.app/promo/r/${id}`,
      });
      // The segment's opengraph-image.tsx supplies the card.
      expect(m.openGraph, id).not.toHaveProperty("images");
      expect(m.twitter, id).toMatchObject({ card: "summary_large_image", title: m.title, description: m.description });
    }
  });
});

describe("the promo redeem page", () => {
  /** The page's text as drawn: whitespace collapsed, quotes left curly for the rules to check. */
  const page = async (id: string) => {
    const { container, unmount } = render(await RedeemPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) }));
    const text = (container.textContent ?? "").replace(/\s+/g, " ").trim();
    unmount();
    return text;
  };

  it("describes fathom with the homepage's words, and the trial as fathom plus", async () => {
    const text = await page("stub");
    expect(text).toContain(redeemTitle("3 months free"));
    expect(words(text)).toContain(words(`${PITCH} ${COPY_13.hero.lede}`));
    expect(text).toContain(PLUS_ADDS);
    expect(marketingViolations(text)).toEqual([]);
    expect(text).not.toMatch(OLD_POSITIONING);
  });

  it("follows the copy rules when the link is dead", async () => {
    const text = await page("gone");
    expect(text).toContain("Get fathom on the App Store");
    expect(marketingViolations(text)).toEqual([]);
  });
});
