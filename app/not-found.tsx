import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { APP_STORE_URL } from "@/lib/promo";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = {
  ...pageMeta("Page not found", "That page isn't here. Head home, get help, or download Fathom.", "/"),
  // A missing page has no address of its own to point a canonical at, and
  // must never be indexed.
  alternates: undefined,
  robots: { index: false, follow: false },
};

// Rendered inside the normal layout (header, footer, both themes), so a bad
// link lands somewhere that still reads as the site. Three ways out, each a
// full-size button: the ones a reader most likely came for.
export default function NotFound() {
  return (
    <Section labelledBy="nf-h">
      <p className="eyebrow">Lost?</p>
      <h1 id="nf-h" className="font-display text-5xl">That page isn&apos;t here</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
        The link may be out of date, or the address may have a typo.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/" size="xl">Home</Button>
        <Button href="/support" variant="secondary" size="xl">Support</Button>
        <Button href={APP_STORE_URL} variant="secondary" size="xl" rel="noopener noreferrer">Download</Button>
      </div>
    </Section>
  );
}
