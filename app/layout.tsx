import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MIN_IOS } from "@/lib/landing-content";

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  // Nothing on the site sets the light weight; three files instead of four.
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fathomvision.app"),
  title: {
    default: "Fathom: AI companion for blind and low-vision iPhone users",
    template: "%s | Fathom",
  },
  description:
    "Free iPhone app for blind and low-vision users. Fathom uses AI to describe what's ahead, guide you through indoor spaces, and help you complete tasks. No maps, beacons, or setup.",
  keywords: [
    "blind iPhone app",
    "app for blind people",
    "AI companion for blind people",
    "indoor wayfinding for blind",
    "AI camera for blind",
    "visual AI assistant iPhone",
    "accessible AI assistant iPhone",
    "wayfinding for the blind",
    "AI assistant for blind",
    "visually impaired app",
    "object recognition app blind",
    "assistive technology iPhone",
    "low vision AI assistant",
    "free blind app iOS",
    "orientation mobility app",
  ],
  applicationName: "Fathom",
  openGraph: {
    title: "Fathom: AI companion for blind and low-vision iPhone users",
    description:
      "Free iPhone app that uses AI to describe what's ahead, guide you through indoor spaces, and help you complete tasks. No maps, beacons, or setup.",
    url: "https://fathomvision.app",
    siteName: "Fathom",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fathom: AI companion for blind and low-vision iPhone users",
    description:
      "Free iPhone app that uses AI to describe what's ahead and guide you through indoor spaces. No maps, beacons, or setup.",
  },
  manifest: "/manifest.webmanifest",
  // Icons are file-based: app/icon.svg (the favicon) and app/apple-icon.tsx
  // (a rendered 180px PNG; Safari does not take an SVG there). Next links
  // both on its own, and only if no `icons` block is set here: a config
  // block, even for the favicon alone, switches the file-based ones off.
  category: "technology",
};

// Two theme-color metas so the browser chrome matches whichever scheme the OS
// picks before our anti-flash script runs; ThemeProvider rewrites the
// content on toggle. viewport-fit=cover lets the safe-area rules in
// fathom-landing.css read the real insets on notched iPhones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e1013" },
    { media: "(prefers-color-scheme: light)", color: "#f2ede4" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fathom-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);if(localStorage.getItem('fathom-motion')==='reduce'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-motion','reduce');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "MobileApplication",
                  name: "Fathom: Visual Assistance",
                  alternateName: "Fathom",
                  description:
                    "AI companion for blind and low-vision iPhone users. Uses AI camera to describe surroundings, guide through indoor spaces, and assist with everyday tasks. No maps, beacons, or setup required. Free on the App Store.",
                  applicationCategory: "HealthApplication",
                  applicationSubCategory: "Accessibility",
                  operatingSystem: `iOS ${MIN_IOS} or later`,
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                  url: "https://fathomvision.app",
                  downloadUrl:
                    "https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183",
                  keywords:
                    "AI companion for blind people, AI camera for blind, visually impaired iPhone app, indoor wayfinding for blind, accessible AI assistant, wayfinding for the blind, visual AI assistant, assistive technology iOS",
                  accessibilityFeature: [
                    "alternativeText",
                    "audioDescription",
                    "structuredNavigation",
                    "voiceControl",
                  ],
                  accessibilityHazard: "none",
                  audience: {
                    "@type": "PeopleAudience",
                    audienceType:
                      "Blind and low-vision individuals, orientation and mobility specialists",
                  },
                  publisher: {
                    "@type": "Organization",
                    name: "Unruly Vision, LLC",
                    alternateName: "Fathom",
                    url: "https://fathomvision.app",
                    email: "support@fathomvision.app",
                  },
                },
                {
                  "@type": "WebPage",
                  "@id": "https://fathomvision.app/#webpage",
                  url: "https://fathomvision.app",
                  name: "Fathom: AI companion for blind and low-vision iPhone users",
                  description:
                    "Free iPhone app for blind and low-vision users. AI describes what's ahead, guides you through indoor spaces, and helps with tasks. No maps, beacons, or setup.",
                  speakable: {
                    "@type": "SpeakableSpecification",
                    cssSelector: [".hero-title", ".hero-lede"],
                  },
                },
              ],
            }),
          }}
        />
        <PostHogProvider>
          <ThemeProvider>
            <a href="#main" className="skip-link">Skip to content</a>
            <Header />
            <main id="main" tabIndex={-1}>{children}</main>
            <Footer />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
