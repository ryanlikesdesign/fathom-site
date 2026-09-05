import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { PromoGate } from "@/components/PromoGate";
import { currentRep } from "@/lib/promoAuth";
import { customCodes, summary } from "@/lib/promoDb";
import type { CustomCodeView, PromoBatchView } from "@/components/PromoBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Share Fathom",
  description: "Promo codes for Fathom event representatives.",
  // Private tool — keep it out of search engines and social previews.
  robots: { index: false, follow: false, nocache: true },
};

export default async function PromoPage() {
  // Resolved on the server so an already-unlocked rep lands straight on the
  // board — no loading flash, and no codes fetched for a locked visitor.
  const rep = await currentRep();

  let batches: PromoBatchView[] = [];
  let custom: CustomCodeView[] = [];
  let error: string | null = null;

  if (rep !== null) {
    try {
      [batches, custom] = await Promise.all([summary(), customCodes()]);
    } catch (err) {
      console.error("[promo] initial load failed:", err);
      error = "Couldn't reach the code database. Try again in a moment.";
    }
  }

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
      <PromoGate
        initialRep={rep}
        initialBatches={batches}
        initialCustom={custom}
        initialError={error}
      />
    </Section>
  );
}
