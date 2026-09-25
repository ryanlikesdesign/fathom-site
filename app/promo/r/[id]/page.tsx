import type { Metadata } from "next";
import { headers } from "next/headers";
import { APP_STORE_URL, trackedRedeemUrl } from "@/lib/promo";
import { COPY_13 } from "@/lib/copy-13";
import { PITCH, PLUS_ADDS } from "@/lib/pitch";
import { REDEEM_FALLBACK, redeemDescription, redeemTitle } from "@/lib/promo-copy";
import { lookupCode } from "@/lib/promo-lookup";
import { markOpened, trackQuietly } from "@/lib/promoDb";
import { OG_BASE, SITE_URL } from "@/lib/site-meta";
import { Button } from "@/components/Button";
import { RedeemActions } from "@/components/RedeemActions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type Search = Promise<{ rep?: string }>;

/**
 * The redeem link's tab title and its iMessage or Mail preview. The page's
 * openGraph replaces the layout's whole (lib/pageMeta.ts), so the shared
 * fields are spread back in; the image is left out, since this segment's
 * opengraph-image.tsx draws its own card. Title, description and card say
 * the same thing, found or not.
 */
function redeemMeta(id: string, title: string, description: string): Metadata {
  const { siteName, type, locale } = OG_BASE;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { siteName, type, locale, title, description, url: `${SITE_URL}/promo/r/${encodeURIComponent(id)}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const result = await lookupCode(id);

  if (result.state !== "found") {
    return redeemMeta(id, REDEEM_FALLBACK.title, REDEEM_FALLBACK.description);
  }

  // The words live in lib/promo-copy.ts, with the share text a rep sends.
  // The code rides in the description so it shows up right inside the
  // iMessage / Mail link-preview card.
  const found = result.code;
  return redeemMeta(id, redeemTitle(found.durationLabel), redeemDescription(found.code, found.durationLabel));
}

export default async function RedeemPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { id } = await params;
  const { rep } = await searchParams;
  const result = await lookupCode(id);
  const found = result.state === "found" ? result.code : null;

  if (found) {
    const userAgent = (await headers()).get("user-agent");
    await trackQuietly(markOpened(id, userAgent), "opened");
  }

  // page-section: same rhythm and header clearance as every other subpage
  // (globals.css). The header already carries the brand; the card is the
  // first thing under it.
  return (
    <section aria-labelledby="redeem-h" className="page-section mx-auto w-full max-w-xl px-6">
      {found ? (
        <div className="rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-6 sm:p-8">
          <p className="eyebrow">{found.durationLabel} · Free trial</p>
          <h1 id="redeem-h" className="mt-3 font-display text-4xl">
            {redeemTitle(found.durationLabel)}
          </h1>
          {/* What fathom is, in the homepage's words (COPY_13), then what
              the trial adds: the codes are fathom plus offer codes. */}
          <p className="mt-3 text-[var(--text-secondary)]">
            {PITCH} {COPY_13.hero.lede}
          </p>
          <p className="mt-3 text-[var(--text-secondary)]">{PLUS_ADDS}</p>

          <div className="mt-8">
            <RedeemActions
              slug={found.slug}
              code={found.code}
              offerName={found.offerName}
              durationLabel={found.durationLabel}
              rep={rep ?? null}
              href={trackedRedeemUrl(found.slug)}
            />
          </div>

          <details className="group mt-8 border-t pt-2 text-[var(--text-secondary)]">
            {/* Same disclosure as the support FAQ (components/Faq.tsx): the
                chevron is the visual cue that the row opens, the focus ring is
                restated because the marker reset outranks the global rule. */}
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)]">
              How to redeem
              <svg aria-hidden="true" className="h-5 w-5 flex-none transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Tap “Redeem in the App Store” above on your iPhone or iPad.</li>
              <li>
                If it doesn’t open automatically, open the App Store app, tap your profile, then
                “Redeem Gift Card or Code,” and enter the code above.
              </li>
              <li>fathom installs free, and your trial starts right away.</li>
            </ol>
          </details>
        </div>
      ) : result.state === "unavailable" ? (
        <div className="rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-6 sm:p-8">
          <h1 id="redeem-h" className="font-display text-3xl">
            We can’t check this link right now
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">
            Something on our end isn’t responding. This isn’t a problem with your code.
            Please try again in a few minutes, or email{" "}
            <a href="mailto:support@fathomvision.app" className="underline underline-offset-4">
              support@fathomvision.app
            </a>{" "}
            and we’ll sort it out.
          </p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-6 sm:p-8">
          <h1 id="redeem-h" className="font-display text-3xl">
            This trial link isn’t active
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">
            The code may have already been claimed. You can still download fathom free from the App
            Store.
          </p>
          <Button href={APP_STORE_URL} size="xl" className="mt-6" rel="noopener noreferrer">
            Get fathom on the App Store
          </Button>
        </div>
      )}
    </section>
  );
}
