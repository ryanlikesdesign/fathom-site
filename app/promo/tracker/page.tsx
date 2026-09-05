import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { PromoTracker } from "@/components/PromoTracker";
import type { UsedCodeView } from "@/components/PromoTracker";
import type { PromoBatchView } from "@/components/PromoBoard";
import { currentRep } from "@/lib/promoAuth";
import { summary, usedCodes } from "@/lib/promoDb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Code tracker",
  description: "Which Fathom codes have gone out, and how far they got.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function TrackerPage() {
  const rep = await currentRep();

  // Same gate as /promo. A locked visitor gets no codes, only a way in.
  if (rep === null) {
    return (
      <Section labelledBy="tracker-h">
        <p className="eyebrow">For Fathom reps</p>
        <h1 id="tracker-h" className="mt-3 font-display text-5xl">
          Code tracker
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          This page is locked.{" "}
          <Link href="/promo" className="underline underline-offset-4">
            Enter the access password
          </Link>{" "}
          and come back.
        </p>
      </Section>
    );
  }

  let used: UsedCodeView[] = [];
  let batches: PromoBatchView[] = [];
  let error: string | null = null;

  try {
    [used, batches] = await Promise.all([usedCodes(), summary()]);
  } catch (err) {
    console.error("[promo] tracker load failed:", err);
    error = "Couldn't reach the code database. Try again in a moment.";
  }

  return (
    <Section labelledBy="tracker-h">
      <p className="eyebrow">For Fathom reps</p>
      <h1 id="tracker-h" className="mt-3 font-display text-5xl">
        Code tracker
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
        Every code that has left the pool, grouped by who got it — and how far each one got.
      </p>
      <p className="mt-4">
        <Link href="/promo" className="underline underline-offset-4">
          ← Back to handing out codes
        </Link>
      </p>

      {error ? (
        <p role="alert" className="mt-8 rounded-[var(--radius-card)] border p-4">
          {error}
        </p>
      ) : (
        <PromoTracker used={used} batches={batches} />
      )}
    </Section>
  );
}
