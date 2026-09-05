# Promo codes

Apple offer codes for Fathom Plus, handed out at events and to contacts via
`/promo`. Codes live in the Fathom Supabase project, not in this repo.

## Why there's a database

Reps used to work from a hardcoded list in `lib/promo.ts` with progress in
`localStorage`. That meant every rep's "already shared" state was private to
their own browser, two people could hand out the same code, and every code was
shipped inside the client JS bundle behind a password compared in the browser.

Now: codes are server-side only, reserving one is atomic, and everyone sees the
same state.

## Setup

| Variable | What it is |
|---|---|
| `SUPABASE_URL` | `https://xjhphevzaqkvstvdlhzd.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key. **Server-only** — never `NEXT_PUBLIC_`. |
| `PROMO_PASSWORD` | Password for `/promo`. Checked server-side. |
| `PROMO_SESSION_SECRET` | Optional. Signs the session cookie; defaults to `PROMO_PASSWORD`. |

The promo tables have RLS on with no policies and `anon`/`authenticated`
revoked, so the service role is the only way in. Without these vars the tools
return 503 with a clear message; the rest of the site is unaffected.

## Before deploying — set a real password

`PROMO_PASSWORD` is unset, so the gate falls back to the default `fathom-crew`
hardcoded in `lib/promoAuth.ts`. That value is in this repo and in git history,
and before the server-side rewrite it was shipped in the browser bundle. It has
never been a secret.

That is acceptable on localhost. It is not acceptable in production, where it
would be the only thing between the open web and ~1,450 live codes worth three
months to a year of free subscription each.

Set `PROMO_PASSWORD` in Vercel (and `.env.local`) before the site is reachable
publicly. Changing it also invalidates every open rep session, because
`PROMO_SESSION_SECRET` defaults to the password — set that separately if you'd
rather rotate one without the other.

## Tables

- `fathom_promo_batches` — one row per App Store Connect batch
- `fathom_promo_codes` — one row per code, with status and tracking timestamps
- `fathom_promo_events` — append-only log of everything that happened to a code
- `fathom_promo_summary` — per-batch funnel view

A code moves `available → assigned → sent → redeemed`, and `assigned` can go
back to `available` if a rep takes one and doesn't use it.

## What Apple does and doesn't tell us

**Apple never reports which individual offer code was redeemed.** The App Store
Connect API exposes a batch's `numberOfCodes`, `expirationDate`, `active` and
`environment`, and its only relationship is `values` (the code list). There is
no `redemptions` relationship, and nothing in the app's own data links a install
back to a code.

So the pipeline tracks what is actually observable:

| Signal | How we know |
|---|---|
| Handed out | The rep marked it sent |
| Link opened | `/promo/r/<slug>` was rendered |
| Tapped redeem | They hit `/promo/r/<slug>/redeem`, which records then forwards to Apple |
| Redeemed | **A human confirmed it.** Nothing else can establish this. |

Aggregate per-campaign redemption counts may be available in Sales & Trends
subscription reports, but that needs a vendor number the ASC API doesn't expose.

## Slugs

The public link `/promo/r/<slug>` shows the code, so slugs are random rather
than sequential — the old `m3-001…m3-026` scheme let anyone walk the numbers and
harvest the batch. The 31 slugs already shared as QR codes are preserved so
links in the wild keep working; everything else uses a random 10-character slug.

## Adding a batch

1. Generate one-time-use codes in App Store Connect.
2. Insert a row in `fathom_promo_batches` with the ASC batch id, offer id,
   duration and expiry.
3. Insert the codes:

```sql
insert into public.fathom_promo_codes (code, batch_id, slug, source)
select c, '<batch id>', public.fathom_promo_slug(), 'asc:<batch id>'
from unnest(string_to_array('CODE1,CODE2,…', ',')) as c
on conflict (code) do nothing;
```

4. Verify nothing was mangled in transit — this must match the checksum of
   Apple's own list (`cut -d, -f1 codes.csv | sort | paste -sd, - | md5`):

```sql
select md5(string_agg(code, ',' order by code)) from public.fathom_promo_codes
where batch_id = '<batch id>';
```

## Current batches

Both expire **2026-12-20**.

| Batch | Offer | Codes |
|---|---|---|
| `526704` | Outreach — 3 months free | 1,000 |
| `526646` | Family — 1 year free | 500 |

53 codes were already handed out before tracking existed; they were imported
from Ryan's Numbers sheets as `assigned` with the recipient label. Their
`assigned_at`/`sent_at` are null because the sheets record who, never when.
