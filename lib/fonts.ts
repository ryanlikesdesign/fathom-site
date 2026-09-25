import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";

/* ================================================================
   The site's two faces (spec, Typeface): Atkinson Hyperlegible Next for
   all text, Atkinson Hyperlegible Mono for distances and counters. Both
   are the Braille Institute's, drawn with low-vision readers, under the
   SIL Open Font License.

   next/font/google downloads the files at build time and serves them from
   this domain (node_modules/next/dist/docs/01-app/01-getting-started/
   13-fonts.md, "Google fonts": "no requests are sent to Google by the
   browser"), so a visit never reaches Google.

   Each loads as ONE variable file (wght 200 to 800), which covers every
   weight the design system uses (400, 500, 600, 700) and the headline's
   500 to 600, in less than four static files would.

   The variables are named for the face, not the role: globals.css maps
   them to --font-sans, --font-display and --font-mono, so swapping a face
   (Mona Sans 2.0 is the runner-up) is one change here.

   Phones never use these: the mockups draw in the design system's system
   stack (--fathom-font-sans), so they look like the app on an iPhone.
   ================================================================ */

export const atkinsonNext = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-atkinson-next",
});

export const atkinsonMono = Atkinson_Hyperlegible_Mono({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-atkinson-mono",
});

/** Both variable classes, for the root <html>. */
export const fontVariables = `${atkinsonNext.variable} ${atkinsonMono.variable}`;
