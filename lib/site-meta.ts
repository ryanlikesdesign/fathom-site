import type { Metadata } from "next";
import { COPY_13 } from "@/lib/copy-13";
import { AI_MODES, LOOKOUT, MIN_IOS, PAYWALL } from "@/lib/app-facts";
import { APP_STORE_URL } from "@/lib/promo";
import { PITCH, PLUS_ADDS } from "@/lib/pitch";

/* ================================================================
   Site-wide metadata and structured data: app/layout.tsx renders the
   metadata and the app's JSON-LD node; app/page.tsx the homepage's.

   Every title, description and tagline here reads COPY_13, so the tab,
   the link preview, the search listing and the homepage say the same
   thing. The brand is lowercase everywhere a person sees it; the one
   capitalized "Fathom" is the App Store name, which Apple's listing owns
   and the JSON-LD must match. test/metadata.test.ts runs the copy rules
   over all of it.

   Server only: app/layout.tsx is a server component, so the app facts
   read here never reach the browser bundle.
   ================================================================ */

/**
 * The one host: www. The bare domain 307s to it (Vercel), so every
 * canonical, og:url, JSON-LD url and preview image names www directly
 * rather than a URL that redirects. app/sitemap.ts and app/robots.ts
 * read it too.
 */
export const SITE_URL = "https://www.fathomvision.app";

/** The name a person sees: tabs, link previews, the manifest. */
export const SITE_NAME = "fathom";

/** The App Store listing's name. The JSON-LD name must match it exactly. */
export const APP_STORE_NAME = "Fathom: Visual Assistance";

/**
 * What people search for, one phrase per thing the app does
 * (lib/app-facts.ts), with no near-synonyms. None of the 1.2 navigation
 * terms, which the app no longer claims, and not "VoiceOver app": fathom
 * works with Apple's screen reader, it isn't one.
 */
export const KEYWORDS: readonly string[] = [
  "visual assistance app for iPhone",
  "app for blind and low-vision people",
  "read text aloud",
  "describe my surroundings",
  "identify objects",
  "obstacle alerts",
];

/** Link previews: the homepage card (app/opengraph-image.tsx), shared by every page. */
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: COPY_13.og.alt,
} as const;

/** The Open Graph fields every page shares. A page's own openGraph replaces the layout's whole, so pageMeta spreads these back in. */
export const OG_BASE = {
  siteName: SITE_NAME,
  type: "website",
  locale: "en_US",
  images: [OG_IMAGE],
} as const;

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: COPY_13.meta.title,
    template: `%s | ${SITE_NAME}`,
  },
  description: COPY_13.meta.description,
  keywords: [...KEYWORDS],
  applicationName: SITE_NAME,
  openGraph: {
    ...OG_BASE,
    images: [...OG_BASE.images],
    title: COPY_13.meta.title,
    description: COPY_13.meta.description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: COPY_13.meta.title,
    description: COPY_13.meta.description,
  },
  manifest: "/manifest.webmanifest",
  // Icons are file-based: app/icon.svg (the favicon) and app/apple-icon.tsx
  // (a rendered 180px PNG; Safari does not take an SVG there). Next links
  // both on its own, and only if no `icons` block is set here: a config
  // block, even for the favicon alone, switches the file-based ones off.
  category: "technology",
};

/** "Hazards Only, Balanced, or Full Awareness", from the app. */
const LEVELS = (() => {
  const names = LOOKOUT.levels.map((l) => l.value);
  return `${names.slice(0, -1).join(", ")}, or ${names[names.length - 1]}`;
})();

/**
 * What the app does, free first, then fathom plus (PLUS_CAPABILITIES).
 * Each line is backed by the step of COPY_13 that makes the same claim.
 */
export const FEATURES: readonly string[] = [
  "Talk to fathom by voice or by typing, all on one screen",
  "Look Now: describe the whole scene, read text word for word, identify what you’re holding, read a kiosk or appliance screen, name what you’re pointing at, or take a closer look",
  "Long text read as a document you move through, with headings for VoiceOver",
  `Lookout: describes what’s around you while you move, and you choose how much it says: ${LEVELS}`,
  "Point to Ask: point at something for about a second, and fathom names it",
  "Memory: fathom remembers what you tell it, and you can correct or delete anything it keeps",
  "Obstacle alerts are always on, run on your phone, and are always free",
  `On-device AI: ${AI_MODES.onDeviceSummary.value}`,
  "Siri shortcuts, and the Action Button can open Look Now",
  "fathom plus: Go, camera guidance to places you’ve named",
  "fathom plus: step-by-step plans you accept before they start",
  "fathom plus: Task, and Live mode for talking it through while you work",
  "fathom plus: skills you teach once and run by name",
];

/** "$12.99" as schema.org wants a price: the number alone. */
const PLUS_PRICE = PAYWALL.price.value.replace(/^\$/, "");

/** The app's node. app/page.tsx's WebPage points at it by this id. */
export const APP_ID = `${SITE_URL}/#app`;

/**
 * The MobileApplication node. app/layout.tsx serializes it on every page:
 * it describes the app, not the page it sits on.
 */
export const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "@id": APP_ID,
  name: APP_STORE_NAME,
  alternateName: SITE_NAME,
  description: [PITCH, COPY_13.hero.lede, "Obstacle alerts are always on, and always free.", PLUS_ADDS].join(" "),
  featureList: [...FEATURES],
  applicationCategory: "HealthApplication",
  applicationSubCategory: "Accessibility",
  operatingSystem: `iOS ${MIN_IOS.value} or later`,
  offers: [
    {
      "@type": "Offer",
      name: SITE_NAME,
      price: "0",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: PAYWALL.title.value,
      description: PAYWALL.offer.value,
      price: PLUS_PRICE,
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: PLUS_PRICE,
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
    },
  ],
  url: SITE_URL,
  downloadUrl: APP_STORE_URL,
  keywords: KEYWORDS.join(", "),
  // schema.org's accessibilityFeature vocabulary: readout headings on the
  // rotor, Contrast Boost, and text up to the largest accessibility sizes.
  accessibilityFeature: ["structuralNavigation", "highContrastDisplay", "largePrint"],
  accessibilityHazard: "none",
  audience: {
    "@type": "PeopleAudience",
    audienceType: "Blind and low-vision people",
  },
  publisher: {
    "@type": "Organization",
    name: "Unruly Vision, LLC",
    alternateName: SITE_NAME,
    url: SITE_URL,
    email: "support@fathomvision.app",
  },
} as const;

/**
 * The homepage's WebPage node. Only app/page.tsx serializes it: on any
 * other route it would name the homepage as the page, and point speakable
 * at hero elements that aren't there.
 */
export const homePageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/#webpage`,
  url: SITE_URL,
  name: COPY_13.meta.title,
  description: COPY_13.meta.description,
  about: { "@id": APP_ID },
  // The homepage hero (components/FathomLanding.tsx): its eyebrow, the
  // h1 and the lede are what a voice assistant reads aloud.
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: [".hero-eyebrow", ".hero-title", ".hero-lede"],
  },
} as const;

/** JSON for a <script type="application/ld+json">, with "<" escaped (node_modules/next/dist/docs/01-app/02-guides/json-ld.md). */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
