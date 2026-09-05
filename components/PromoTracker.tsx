"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PromoBatchView } from "@/components/PromoBoard";

export interface UsedCodeView {
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

/** The furthest point we can observe for a code. */
type Stage = "untracked" | "reserved" | "sent" | "opened" | "tapped" | "redeemed";

/** Set by the spreadsheet import, and only by it. */
const IMPORT_MARKER = "spreadsheet import";

function isImported(c: UsedCodeView): boolean {
  return c.assigned_by === IMPORT_MARKER;
}

function stageOf(c: UsedCodeView): Stage {
  if (c.status === "redeemed") return "redeemed";
  if (c.redeem_clicked_at) return "tapped";
  if (c.first_opened_at) return "opened";
  // Handed out before this system existed, so there is nothing to report.
  if (isImported(c)) return "untracked";
  // Taken from the pool but not yet given to anyone — not the same as untracked.
  if (c.status === "assigned") return "reserved";
  return "sent";
}

const STAGE_LABEL: Record<Stage, string> = {
  untracked: "No tracking",
  reserved: "Reserved, not handed out yet",
  sent: "Handed out",
  opened: "Opened the link",
  tapped: "Tapped redeem",
  redeemed: "Confirmed redeemed",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function PromoTracker({
  used,
  batches,
}: {
  used: UsedCodeView[];
  batches: PromoBatchView[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");

  const labels = useMemo(
    () => Object.fromEntries(batches.map((b) => [b.batch_id, b.duration_label])),
    [batches],
  );

  const groups = useMemo(() => {
    const map = new Map<string, UsedCodeView[]>();
    for (const c of used) {
      const key = c.assigned_to?.trim() || "Unlabelled";
      const list = map.get(key);
      if (list) list.push(c);
      else map.set(key, [c]);
    }
    return [...map.entries()]
      .map(([recipient, codes]) => ({
        recipient,
        codes,
        untracked: codes.filter((c) => stageOf(c) === "untracked").length,
        reserved: codes.filter((c) => stageOf(c) === "reserved").length,
        opened: codes.filter((c) => c.first_opened_at).length,
        tapped: codes.filter((c) => c.redeem_clicked_at).length,
        redeemed: codes.filter((c) => c.status === "redeemed").length,
      }))
      .sort((a, b) => b.codes.length - a.codes.length || a.recipient.localeCompare(b.recipient));
  }, [used]);

  const totals = useMemo(
    () => ({
      out: used.length,
      untracked: used.filter((c) => stageOf(c) === "untracked").length,
      reserved: used.filter((c) => stageOf(c) === "reserved").length,
      opened: used.filter((c) => c.first_opened_at).length,
      tapped: used.filter((c) => c.redeem_clicked_at).length,
      redeemed: used.filter((c) => c.status === "redeemed").length,
    }),
    [used],
  );

  async function confirmRedeemed(slug: string) {
    setBusy(slug);
    try {
      const res = await fetch(`/api/promo/codes/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeemed" }),
      });
      if (res.ok) {
        setMessage("Marked as redeemed.");
        router.refresh();
      } else {
        setMessage("Couldn't save that. Try again.");
      }
    } catch {
      setMessage("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  if (!used.length) {
    return (
      <p className="mt-8 text-[var(--text-secondary)]">
        No codes have gone out yet. Once you hand one out from the{" "}
        <a href="/promo" className="underline underline-offset-4">
          share page
        </a>
        , it&apos;ll show up here.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Handed out" value={totals.out - totals.reserved} />
        <Stat label="Opened the link" value={totals.opened} />
        <Stat label="Tapped redeem" value={totals.tapped} />
        <Stat label="Confirmed redeemed" value={totals.redeemed} />
      </dl>

      {totals.untracked > 0 && (
        <p className="mt-6 rounded-[var(--radius-card)] border p-4 text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">
            {totals.untracked} of these predate tracking.
          </strong>{" "}
          They were handed out from the spreadsheet before this system existed, so they have no
          open or redeem data — that&apos;s missing information, not evidence nobody used them.
          Codes handed out from now on record every step.
        </p>
      )}

      <p className="mt-6 text-[var(--text-secondary)]">
        Apple never reports which individual codes were redeemed, so
        &ldquo;confirmed redeemed&rdquo; only ever comes from a person confirming it.
      </p>

      <ul className="mt-6 space-y-3">
        {groups.map((g) => {
          const isOpen = open[g.recipient] ?? false;
          const panelId = `group-${g.recipient.replace(/\W+/g, "-")}`;
          return (
            <li
              key={g.recipient}
              className="rounded-[var(--radius-card)] border bg-[var(--bg-raised)]"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen((o) => ({ ...o, [g.recipient]: !isOpen }))}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
              >
                <span>
                  <span className="block font-medium text-[var(--text-primary)]">
                    {g.recipient}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--text-muted)]">
                    {g.codes.length} {g.codes.length === 1 ? "code" : "codes"} ·{" "}
                    {g.reserved === g.codes.length
                      ? "reserved, not handed out yet"
                      : g.untracked === g.codes.length
                        ? "no tracking data"
                        : `${g.opened} opened · ${g.tapped} tapped · ${g.redeemed} redeemed`}
                  </span>
                </span>
                <span aria-hidden="true" className="text-[var(--text-muted)]">
                  {isOpen ? "Hide" : "Show"} codes
                </span>
              </button>

              {isOpen && (
                <ul id={panelId} className="border-t">
                  {g.codes.map((c) => {
                    const stage = stageOf(c);
                    const sent = formatDate(c.sent_at);
                    return (
                      <li
                        key={c.slug}
                        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                      >
                        <span>
                          <span
                            className="block font-display tracking-wide text-[var(--text-primary)]"
                            style={{ wordBreak: "break-all" }}
                          >
                            {c.code}
                          </span>
                          <span className="mt-1 block text-sm text-[var(--text-muted)]">
                            {labels[c.batch_id] ?? c.batch_id} · {STAGE_LABEL[stage]}
                            {sent ? ` · ${sent}` : ""}
                            {c.sent_by ? ` · by ${c.sent_by}` : ""}
                          </span>
                        </span>
                        {c.status !== "redeemed" && (
                          <button
                            type="button"
                            onClick={() => confirmRedeemed(c.slug)}
                            disabled={busy === c.slug}
                            className="inline-flex shrink-0 items-center justify-center rounded-[var(--radius-btn)] border px-4 py-2.5 text-sm disabled:opacity-50"
                          >
                            {busy === c.slug ? "Saving…" : "Mark redeemed"}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-4">
      <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
      <dd className="mt-1 font-display text-3xl text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
