import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fathomvision.app"),
  title: {
    default: "Fathom — AI Navigation for Blind & Low-Vision iPhone Users",
    template: "%s — Fathom",
  },
  description:
    "Free iPhone app for blind and low-vision users. Fathom uses AI to describe what's ahead, guide you through indoor spaces, and help you complete tasks. No maps, beacons, or setup.",
  keywords: [
    "blind iPhone app",
    "app for blind people",
    "navigation app for visually impaired",
    "indoor navigation blind",
    "AI camera for blind",
    "visual AI assistant iPhone",
    "accessible navigation iPhone",
    "wayfinding app blind",
    "AI assistant for blind",
    "visually impaired app",
    "object recognition app blind",
    "assistive technology iPhone",
    "low vision navigation app",
    "free blind app iOS",
    "orientation mobility app",
  ],
  applicationName: "Fathom",
  openGraph: {
    title: "Fathom — AI Navigation for Blind & Low-Vision iPhone Users",
    description:
      "Free iPhone app that uses AI to describe what's ahead, guide you through indoor spaces, and help you complete tasks. No maps, beacons, or setup.",
    url: "https://fathomvision.app",
    siteName: "Fathom",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fathom — AI Navigation for Blind & Low Vision",
    description:
      "Free iPhone app that uses AI to describe what's ahead and guide you through indoor spaces. No maps, beacons, or setup.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
    apple: { url: "/favicon.svg", type: "image/svg+xml" },
  },
  category: "technology",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fathom-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
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
                    "AI navigation app for blind and low-vision iPhone users. Uses AI camera to describe surroundings, guide through indoor spaces, and assist with everyday tasks — no maps, beacons, or setup required. Free on the App Store.",
                  applicationCategory: "HealthApplication",
                  applicationSubCategory: "Accessibility",
                  operatingSystem: "iOS 17 or later",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                  url: "https://fathomvision.app",
                  downloadUrl:
                    "https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183",
                  keywords:
                    "blind navigation app, AI camera for blind, visually impaired iPhone app, indoor navigation blind, accessible navigation, wayfinding app blind, visual AI assistant, assistive technology iOS",
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
                    name: "Fathom",
                    url: "https://fathomvision.app",
                    email: "support@fathomvision.app",
                  },
                },
                {
                  "@type": "WebPage",
                  "@id": "https://fathomvision.app/#webpage",
                  url: "https://fathomvision.app",
                  name: "Fathom — AI Navigation for Blind & Low-Vision iPhone Users",
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
            <main id="main">{children}</main>
            <Footer />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
