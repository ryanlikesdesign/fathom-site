import { NextResponse, type NextRequest } from "next/server";
import {
  APP_STORE_URL,
  POSTHOG_HOST,
  POSTHOG_KEY,
  findCodeById,
  redeemUrl,
} from "@/lib/promo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tracking redirect for a shared promo code.
 *
 * A rep's QR codes and links point here (/promo/r/<id>?rep=<name>). When a
 * recipient opens one we record a `promo_link_opened` event in PostHog — the
 * closest proxy we have to "the code was used", since Apple's real redemption
 * data isn't reachable from the web — then send them straight to the App Store
 * to redeem. The redirect never waits on analytics: capture is best-effort and
 * time-boxed so a slow or blocked request can't stall the recipient.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rep = request.nextUrl.searchParams.get("rep");

  const found = findCodeById(id);
  const destination = found ? redeemUrl(found.code.code) : APP_STORE_URL;

  await capture({
    event: "promo_link_opened",
    distinctId: `promo-open:${id}`,
    properties: {
      code_id: id,
      found: Boolean(found),
      code: found?.code.code ?? null,
      tier_id: found?.tier.id ?? null,
      tier_name: found?.tier.name ?? null,
      rep_name: rep,
      $current_url: request.nextUrl.href,
    },
  });

  return NextResponse.redirect(destination, 307);
}

async function capture(payload: {
  event: string;
  distinctId: string;
  properties: Record<string, unknown>;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: payload.event,
        distinct_id: payload.distinctId,
        properties: payload.properties,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    // Never let analytics failures block the redirect.
  } finally {
    clearTimeout(timeout);
  }
}
