import { cache } from "react";
import { findBySlug, type CodeDetail } from "@/lib/promoDb";

/**
 * A redeem link's code, as the page (app/promo/r/[id]/page.tsx), its
 * metadata and its preview card's alt (app/promo/r/[id]/opengraph-image.tsx)
 * all need it.
 *
 * Never let a database hiccup turn into a 500 for someone holding a code,
 * but distinguish the two failures. "Missing" means the link really is
 * dead; an error on our side must not be reported to the recipient as a
 * dead code, or a misconfiguration reads to them as a canceled trial.
 */
export type Lookup =
  | { state: "found"; code: CodeDetail }
  | { state: "missing" }
  | { state: "unavailable" };

/** One lookup per request: React's cache shares it between the page, its metadata and the card's alt. */
export const lookupCode = cache(async (slug: string): Promise<Lookup> => {
  try {
    const found = await findBySlug(slug);
    return found ? { state: "found", code: found } : { state: "missing" };
  } catch (err) {
    console.error("[promo] redeem lookup failed:", err);
    return { state: "unavailable" };
  }
});
