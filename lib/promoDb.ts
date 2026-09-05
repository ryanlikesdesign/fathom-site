/* ================================================================
   Promo-code storage. SERVER ONLY — never import from a "use client"
   module. It carries the Supabase service-role key, and the codes it
   returns must never be shipped to the browser in bulk.

   Codes live in Supabase (fathom_promo_codes) rather than in this repo
   so every rep sees the same handed-out/available state.
   ================================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export class PromoDbUnconfigured extends Error {
  constructor() {
    super("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use the promo tools.");
    this.name = "PromoDbUnconfigured";
  }
}

export const promoDbConfigured = Boolean(SUPABASE_URL && SERVICE_KEY);

function creds() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new PromoDbUnconfigured();
  return { url: SUPABASE_URL, key: SERVICE_KEY };
}

async function call(path: string, init: RequestInit = {}) {
  const { url, key } = creds();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase ${path} → ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

const rpc = (fn: string, args: Record<string, unknown>) =>
  call(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });

/* ---------------------------------------------------------------- */

export interface PromoBatch {
  batch_id: string;
  offer_name: string;
  duration_label: string;
  expires_on: string | null;
  // Explicit display order: the everyday 3-month offer must lead, so a rep
  // doesn't hand out the 1-year offer just because it sorted first.
  sort_order: number;
  total: number;
  available: number;
  reserved: number;
  sent: number;
  confirmed_redeemed: number;
  links_opened: number;
  redeem_clicked: number;
}

export interface ReservedCode {
  code: string;
  slug: string;
  batch_id: string;
}

/** Offer/status detail for one code, looked up by its public slug. */
export interface CodeDetail {
  code: string;
  slug: string;
  status: string;
  offerName: string;
  durationLabel: string;
  shortLabel: string;
}

/**
 * A reusable code many people redeem, up to a cap — not a per-recipient code,
 * so it has no slug and no tracking. Apple reports no redemption count.
 */
export interface CustomCode {
  code: string;
  offer_name: string;
  duration_label: string;
  redemption_cap: number | null;
  expires_on: string | null;
  active: boolean;
  note: string | null;
  synced_at: string;
}

export function customCodes(): Promise<CustomCode[]> {
  return call("fathom_promo_custom_codes?select=*&order=code") as Promise<CustomCode[]>;
}

export function summary(): Promise<PromoBatch[]> {
  return call("fathom_promo_summary?select=*&order=sort_order") as Promise<PromoBatch[]>;
}

export interface UsedCode {
  code: string;
  slug: string;
  status: string;
  batch_id: string;
  assigned_to: string | null;
  assigned_by: string | null;
  sent_at: string | null;
  sent_by: string | null;
  first_opened_at: string | null;
  open_count: number;
  redeem_clicked_at: string | null;
  redeemed_at: string | null;
  note: string | null;
  source: string | null;
}

/**
 * Every code that has left the pool — the tracker's dataset.
 *
 * Unpaginated on purpose: this is bounded by how many codes have actually been
 * handed out (53 at time of writing, out of 1,500). Add paging if that ever
 * grows past a few hundred.
 */
export function usedCodes(): Promise<UsedCode[]> {
  return call(
    "fathom_promo_codes?status=neq.available" +
      "&select=code,slug,status,batch_id,assigned_to,assigned_by,sent_at,sent_by," +
      "first_opened_at,open_count,redeem_clicked_at,redeemed_at,note,source" +
      "&order=sent_at.desc.nullslast,assigned_to.asc,code.asc",
  ) as Promise<UsedCode[]>;
}

/**
 * Take the next unhanded-out code in a batch. Atomic in Postgres
 * (`for update skip locked`), so two reps sharing at the same moment can
 * never be handed the same code. Returns null when the batch is empty.
 */
export async function reserve(batchId: string, rep: string): Promise<ReservedCode | null> {
  const rows = (await rpc("fathom_promo_reserve", {
    p_batch: batchId,
    p_actor: rep || "unknown",
  })) as ReservedCode[];
  return rows?.[0] ?? null;
}

export async function findBySlug(slug: string): Promise<CodeDetail | null> {
  const rows = (await call(
    `fathom_promo_codes?slug=eq.${encodeURIComponent(slug)}` +
      `&select=code,slug,status,fathom_promo_batches(offer_name,duration_label,short_label)`,
  )) as Array<{
    code: string;
    slug: string;
    status: string;
    fathom_promo_batches: {
      offer_name: string;
      duration_label: string;
      short_label: string;
    } | null;
  }>;

  const row = rows?.[0];
  if (!row?.fathom_promo_batches) return null;
  return {
    code: row.code,
    slug: row.slug,
    status: row.status,
    offerName: row.fathom_promo_batches.offer_name,
    durationLabel: row.fathom_promo_batches.duration_label,
    shortLabel: row.fathom_promo_batches.short_label,
  };
}

export const markSent = (slug: string, rep: string, method: string, recipient?: string | null) =>
  rpc("fathom_promo_mark_sent", {
    p_slug: slug,
    p_actor: rep || "unknown",
    p_method: method,
    p_recipient: recipient ?? null,
  });

export const release = (slug: string, rep: string) =>
  rpc("fathom_promo_release", { p_slug: slug, p_actor: rep || "unknown" });

export const markRedeemed = (slug: string, rep: string) =>
  rpc("fathom_promo_mark_redeemed", { p_slug: slug, p_actor: rep || "unknown" });

export const markOpened = (slug: string, userAgent?: string | null) =>
  rpc("fathom_promo_mark_opened", { p_slug: slug, p_user_agent: userAgent ?? null });

export const markRedeemClicked = (slug: string) =>
  rpc("fathom_promo_mark_redeem_clicked", { p_slug: slug });

/**
 * Tracking is never allowed to break the recipient's redeem journey — if the
 * write fails we log and carry on to the App Store.
 */
export async function trackQuietly(work: Promise<unknown>, label: string) {
  try {
    await work;
  } catch (err) {
    console.error(`[promo] ${label} tracking failed:`, err);
  }
}
