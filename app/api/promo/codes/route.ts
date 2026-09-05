import { requireRep } from "@/lib/promoAuth";
import { expiryState } from "@/lib/promoExpiry";
import { customCodes, PromoDbUnconfigured, reserve, summary } from "@/lib/promoDb";

export const dynamic = "force-dynamic";

function failed(err: unknown) {
  if (err instanceof PromoDbUnconfigured) {
    return Response.json({ error: err.message }, { status: 503 });
  }
  console.error("[promo] request failed:", err);
  return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
}

/** Batch list with live counts — what's left, what's gone out. */
export async function GET() {
  const auth = await requireRep();
  if (!auth.ok) return auth.response;

  try {
    const [batches, custom] = await Promise.all([summary(), customCodes()]);
    return Response.json({ rep: auth.rep, batches, custom });
  } catch (err) {
    return failed(err);
  }
}

/** Claim the next available code in a batch. */
export async function POST(request: Request) {
  const auth = await requireRep();
  if (!auth.ok) return auth.response;

  let body: { batchId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const batchId = typeof body.batchId === "string" ? body.batchId : "";
  if (!batchId) return Response.json({ error: "Which offer?" }, { status: 400 });

  try {
    // Don't burn a code from a dead batch just because a stale page still
    // offered the button.
    const batch = (await summary()).find((b) => b.batch_id === batchId);
    if (batch && expiryState(batch.expires_on).expired) {
      return Response.json(
        { error: "That offer has expired. Generate a new batch in App Store Connect." },
        { status: 409 },
      );
    }

    const claimed = await reserve(batchId, auth.rep);
    if (!claimed) {
      return Response.json(
        { error: "No codes left in this offer. Generate a new batch in App Store Connect." },
        { status: 409 },
      );
    }
    return Response.json(claimed);
  } catch (err) {
    return failed(err);
  }
}
