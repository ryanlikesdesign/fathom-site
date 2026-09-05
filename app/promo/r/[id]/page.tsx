import type { Metadata } from "next";
import { headers } from "next/headers";
import { APP_STORE_URL, trackedRedeemUrl } from "@/lib/promo";
import { findBySlug, markOpened, trackQuietly } from "@/lib/promoDb";
import { BrandMark } from "@/components/BrandMark";
import { RedeemActions } from "@/components/RedeemActions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type Search = Promise<{ rep?: string }>;

/**
 * Never let a database hiccup turn into a 500 for someone holding a code —
 * but distinguish the two failures. "Not found" means the link really is
 * dead; an error on our side must not be reported to the recipient as a dead
 * code, or a misconfiguration reads to them as a canceled trial.
 */
type Lookup =
  | { state: "found"; code: Awaited<ReturnType<typeof findBySlug>> & object }
  | { state: "missing" }
  | { state: "unavailable" };

async function lookup(slug: string): Promise<Lookup> {
  try {
    const found = await findBySlug(slug);
    return found ? { state: "found", code: found } : { state: "missing" };
  } catch (err) {
    console.error("[promo] redeem page lookup failed:", err);
    return { state: "unavailable" };
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const result = await lookup(id);
  const found = result.state === "found" ? result.code : null;

  if (!found) {
    return {
      title: "Fathom free trial",
      description: "A free trial of Fathom — AI navigation for blind and low-vision iPhone users.",
      robots: { index: false, follow: false },
    };
  }

  const title = `You've got ${found.durationLabel} of Fathom`;
  // The code rides in the description so it shows up right inside the
  // iMessage / Mail link-preview card.
  const description = `Your code: ${found.code} — tap to redeem ${found.durationLabel} of Fathom, the AI navigation app for blind and low-vision iPhone users.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
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
  const result = await lookup(id);
  const found = result.state === "found" ? result.code : null;

  if (found) {
    const userAgent = (await headers()).get("user-agent");
    await trackQuietly(markOpened(id, userAgent), "opened");
  }

  return (
    <section
      aria-labelledby="redeem-h"
      className="mx-auto w-full max-w-xl px-6"
      style={{ paddingTop: "var(--section-y)", paddingBottom: "var(--section-y)" }}
    >
      <div className="flex items-center gap-3">
        <BrandMark className="brand-mark-lg" />
        <span className="text-xl font-medium">Fathom</span>
      </div>

      {found ? (
        <div className="mt-10 rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-6 sm:p-8">
          <p className="eyebrow">{found.durationLabel} · Free trial</p>
          <h1 id="redeem-h" className="mt-3 font-display text-4xl">
            You&apos;ve got {found.durationLabel} of Fathom
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">
            Fathom is the AI navigation app for blind and low-vision iPhone users — it describes
            what&apos;s ahead, guides you through indoor spaces, and helps you complete tasks.
          </p>

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

          <details className="mt-8 border-t pt-4 text-[var(--text-secondary)]">
            <summary className="cursor-pointer font-medium [&::-webkit-details-marker]:hidden">
              How to redeem
            </summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Tap “Redeem in the App Store” above on your iPhone or iPad.</li>
              <li>
                If it doesn&apos;t open automatically, open the App Store app, tap your profile, then
                “Redeem Gift Card or Code,” and enter the code above.
              </li>
              <li>Fathom installs free, and your trial starts right away.</li>
            </ol>
          </details>
        </div>
      ) : result.state === "unavailable" ? (
        <div className="mt-10 rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-6 sm:p-8">
          <h1 id="redeem-h" className="font-display text-3xl">
            We can&apos;t check this link right now
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">
            Something on our end isn&apos;t responding — this isn&apos;t a problem with your code.
            Please try again in a few minutes, or email{" "}
            <a href="mailto:support@fathomvision.app" className="underline underline-offset-4">
              support@fathomvision.app
            </a>{" "}
            and we&apos;ll sort it out.
          </p>
        </div>
      ) : (
        <div className="mt-10 rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-6 sm:p-8">
          <h1 id="redeem-h" className="font-display text-3xl">
            This trial link isn&apos;t active
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">
            The code may have already been claimed. You can still download Fathom free from the App
            Store.
          </p>
          <a
            href={APP_STORE_URL}
            className="mt-6 inline-flex items-center justify-center rounded-[var(--radius-btn)] bg-[var(--text-primary)] px-6 py-3 font-medium text-[var(--bg)]"
          >
            Get Fathom on the App Store
          </a>
        </div>
      )}
    </section>
  );
}
