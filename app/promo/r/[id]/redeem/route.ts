import { redirect } from "next/navigation";
import { APP_STORE_URL, redeemUrl } from "@/lib/promo";
import { findBySlug, markRedeemClicked, trackQuietly } from "@/lib/promoDb";

export const dynamic = "force-dynamic";

/**
 * The Redeem button points here rather than straight at Apple, so the tap is
 * recorded server-side — it works with JavaScript off, and it's the closest
 * thing to a redemption signal that exists. Apple exposes no per-code
 * redemption status, so "tapped through to the redeem sheet" is as far as
 * automatic tracking can go; actual redemption is confirmed by a human.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let destination = APP_STORE_URL;
  try {
    const found = await findBySlug(id);
    if (found) {
      destination = redeemUrl(found.code);
      await trackQuietly(markRedeemClicked(id), "redeem_clicked");
    }
  } catch (err) {
    // A tracking outage must never strand someone holding a valid code.
    console.error("[promo] redeem lookup failed:", err);
  }

  redirect(destination);
}
