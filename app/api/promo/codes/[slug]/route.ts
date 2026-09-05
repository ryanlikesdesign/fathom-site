import { requireRep } from "@/lib/promoAuth";
import { findBySlug, markRedeemed, markSent, PromoDbUnconfigured, release } from "@/lib/promoDb";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

function failed(err: unknown) {
  if (err instanceof PromoDbUnconfigured) {
    return Response.json({ error: err.message }, { status: 503 });
  }
  console.error("[promo] request failed:", err);
  return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
}

/** Re-read a code the rep already holds, so a refresh doesn't lose it. */
export async function GET(_request: Request, { params }: { params: Params }) {
  const auth = await requireRep();
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  try {
    const found = await findBySlug(slug);
    if (!found) return Response.json({ error: "Unknown code." }, { status: 404 });
    return Response.json(found);
  } catch (err) {
    return failed(err);
  }
}

/**
 * Move a code along: handed over, put back, or confirmed redeemed.
 * "redeemed" is a human judgment — Apple never reports which code was used.
 */
export async function PATCH(request: Request, { params }: { params: Params }) {
  const auth = await requireRep();
  if (!auth.ok) return auth.response;

  const { slug } = await params;

  let body: { action?: unknown; method?: unknown; recipient?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  const method = typeof body.method === "string" ? body.method : "unknown";
  const recipient =
    typeof body.recipient === "string" && body.recipient.trim()
      ? body.recipient.trim().slice(0, 200)
      : null;

  try {
    switch (action) {
      case "sent":
        await markSent(slug, auth.rep, method, recipient);
        break;
      case "released":
        await release(slug, auth.rep);
        break;
      case "redeemed":
        await markRedeemed(slug, auth.rep);
        break;
      default:
        return Response.json({ error: "Unknown action." }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return failed(err);
  }
}
