import type { Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { THEME_COLOR } from "@/design-system/generated/tokens";
import { appJsonLd, jsonLdScript, siteMetadata } from "@/lib/site-meta";

// Titles, descriptions, keywords and the JSON-LD live in lib/site-meta.ts,
// built from COPY_13 (lib/copy-13.ts), so every surface that names the site
// reads the same words. Every page carries the app's node; only the
// homepage (app/page.tsx) adds its WebPage node.
export const metadata = siteMetadata;

// Two theme-color metas so the browser chrome matches whichever scheme the OS
// picks before our anti-flash script runs; ThemeProvider rewrites the
// content on toggle. viewport-fit=cover lets the safe-area rules in
// fathom-landing.css read the real insets on notched iPhones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fathom-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);if(localStorage.getItem('fathom-motion')==='reduce'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-motion','reduce');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(appJsonLd) }} />
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
