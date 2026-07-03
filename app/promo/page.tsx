import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { PromoGate } from "@/components/PromoGate";

export const metadata: Metadata = {
  title: "Share Fathom",
  description: "Promo codes for Fathom event representatives.",
  // Private tool — keep it out of search engines and social previews.
  robots: { index: false, follow: false, nocache: true },
};

export default function PromoPage() {
  return (
    <Section labelledBy="promo-h">
      <p className="eyebrow">For Fathom reps</p>
      <h1 id="promo-h" className="mt-3 font-display text-5xl">
        Share Fathom
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
        Hand out free-trial codes at events with a scan, a link, or the code itself — and let the
        team see which ones get used.
      </p>
      <PromoGate />
    </Section>
  );
}
