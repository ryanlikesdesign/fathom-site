import { ImageResponse } from "next/og";
import { COPY_13 } from "@/lib/copy-13";
import { lookupCode, type Lookup } from "@/lib/promo-lookup";
import { HomeCard, OG_COLORS, OG_FRAME, OG_WEIGHT, OgLockup, ogFonts } from "@/lib/og";
import { SITE_NAME } from "@/lib/site-meta";
import { TRIAL_NAME, redeemTitle } from "@/lib/promo-copy";

const SIZE = { width: 1200, height: 630 };
const CONTENT_TYPE = "image/png";

/** The pill above the headline. */
const PILL = "Free trial inside";
/** What the card calls a trial it couldn't look up. */
const GENERIC_OFFER = "a free trial";

/**
 * What the card says for a lookup. A code that was found names its
 * duration; a lookup that failed on our side still has a code behind it,
 * so it gets the generic offer. A slug with no code gets the homepage's
 * card: nothing on it promises a trial that isn't there.
 */
function offerFor(result: Lookup): string | null {
  if (result.state === "found") return result.code.durationLabel;
  return result.state === "unavailable" ? GENERIC_OFFER : null;
}

/** The card's alt, read top to bottom as the card draws it. */
function redeemCardAlt(offer: string | null): string {
  if (offer === null) return COPY_13.og.alt;
  return `${SITE_NAME}. ${PILL}. ${redeemTitle(offer)}. ${COPY_13.tagline} Tap to redeem.`;
}

/**
 * One card per link, with an alt that says what that card shows, so a
 * VoiceOver user reading the iMessage or Mail preview hears the duration a
 * sighted recipient sees. A static `alt` can't: it's the same for every
 * code. The lookup is the page's own (lib/promo-lookup.ts), shared within
 * the request. With no slug (a build asking for static params), there is
 * nothing to look up, and the alt is the generic offer's.
 */
export async function generateImageMetadata({ params }: { params?: { id?: string } }) {
  const id = params?.id;
  const offer = id ? offerFor(await lookupCode(id)) : GENERIC_OFFER;
  return [{ id: "card", alt: redeemCardAlt(offer), size: SIZE, contentType: CONTENT_TYPE }];
}

// The card in the iMessage or Mail preview of a redeem link: the lockup,
// what the code is worth (the same words as the page's h1, lib/promo-copy.ts)
// and the tagline. Same ground, face and colors as the homepage card (lib/og.tsx).
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A preview card is never worth failing over: lookupCode never throws.
  const offer = offerFor(await lookupCode(id));
  const fonts = await ogFonts();

  if (offer === null) return new ImageResponse(<HomeCard />, { ...SIZE, fonts });

  return new ImageResponse(
    (
      <div style={OG_FRAME}>
        <OgLockup height={56} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 24px",
              borderRadius: "999px",
              border: `2px solid ${OG_COLORS.accent}`,
              color: OG_COLORS.accent,
              fontSize: "26px",
              fontWeight: OG_WEIGHT.display,
              marginBottom: "32px",
            }}
          >
            {PILL}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "88px",
              fontWeight: OG_WEIGHT.display,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: OG_COLORS.text,
            }}
          >
            {/* Two spans in a row with a gap: the renderer drops a space
                that ends a text run before an element. */}
            <div style={{ display: "flex", flexWrap: "wrap", columnGap: "0.25em" }}>
              <span>You’ve got</span>
              <span style={{ color: OG_COLORS.accent }}>{offer}</span>
            </div>
            <span>of {TRIAL_NAME}.</span>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "28px",
              fontSize: "34px",
              fontWeight: OG_WEIGHT.body,
              color: OG_COLORS.secondary,
            }}
          >
            {COPY_13.tagline} Tap to redeem.
          </div>
        </div>
      </div>
    ),
    { ...SIZE, fonts },
  );
}
