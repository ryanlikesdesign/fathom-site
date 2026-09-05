"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { PromoCode, spellCode } from "@/components/PromoCode";
import { Surface } from "@/components/Surface";
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
  // Marking redeemed removes the button the user just activated. Without
  // somewhere to send focus it falls to <body>, losing their place in a list
  // that can be a hundred rows long.
  const [justRedeemed, setJustRedeemed] = useState<string | null>(null);
  const redeemedRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  // See PromoBoard: identical consecutive announcements are silent otherwise.
  const announce = (text: string) => {
    setMessage("");
    requestAnimationFrame(() => setMessage(text));
  };

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

  async function confirmRedeemed(slug: string, code: string) {
    setBusy(slug);
    try {
      const res = await fetch(`/api/promo/codes/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeemed" }),
      });
      if (res.ok) {
        setJustRedeemed(slug);
        announce(`Code ${spellCode(code)} confirmed as redeemed.`);
        router.refresh();
      } else {
        announce("Couldn't save that. Try again.");
      }
    } catch {
      announce("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (justRedeemed) redeemedRef.current?.focus();
  }, [justRedeemed, used]);

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
      <h2 className="sr-only">Summary</h2>
      {/* One panel rather than four: <dl> may only contain <div> wrappers, and
          Surface renders div > span, which breaks the dt/dd relationship. It
          reads better as a single summary card anyway. */}
      <Surface register="lift" className="p-5">
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Handed out" value={totals.out - totals.reserved} />
          <Stat label="Opened the link" value={totals.opened} />
          <Stat label="Tapped redeem" value={totals.tapped} />
          <Stat label="Confirmed redeemed" value={totals.redeemed} />
        </dl>
      </Surface>

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

      <h2 className="mt-10 font-display text-2xl">Who has them</h2>
      <ul className="mt-4 space-y-3">
        {groups.map((g, gi) => {
          const isOpen = open[g.recipient] ?? false;
          // Index-based: slugifying the name collapsed "Ann Lee" and "Ann-Lee"
          // onto the same DOM id.
          const panelId = `promo-group-${gi}`;
          return (
            <Surface key={g.recipient} register="lift" as="li">
              {/* h3 so the list is navigable by heading — this page previously
                  had a single h1 and nothing else to rotor between. */}
              <h3>
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
                    <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                      {g.codes.length} {g.codes.length === 1 ? "code" : "codes"} ·{" "}
                      {g.reserved === g.codes.length
                        ? "reserved, not handed out yet"
                        : g.untracked === g.codes.length
                          ? "no tracking data"
                          : `${g.opened} opened · ${g.tapped} tapped · ${g.redeemed} redeemed`}
                    </span>
                  </span>
                  {/* Not aria-hidden: hiding it breaks Label in Name, so a
                      voice-control user saying "tap Show codes" gets nothing. */}
                  <span className="text-sm text-[var(--text-secondary)]">
                    {isOpen ? "Hide" : "Show"} codes
                  </span>
                </button>
              </h3>

              {/* Always mounted, toggled with `hidden`: aria-controls pointing
                  at a node that doesn't exist is a broken reference. */}
              <ul id={panelId} hidden={!isOpen} className="border-t">
                {g.codes.map((c) => {
                  const stage = stageOf(c);
                  const sent = formatDate(c.sent_at);
                  return (
                    <li
                      key={c.slug}
                      className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <span className="min-w-0">
                        <PromoCode code={c.code} label="Code" className="text-base" />
                        <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                          {labels[c.batch_id] ?? c.batch_id} · {STAGE_LABEL[stage]}
                          {sent ? ` · ${sent}` : ""}
                          {c.sent_by ? ` · by ${c.sent_by}` : ""}
                        </span>
                      </span>
                      {c.status === "redeemed" ? (
                        <span
                          ref={c.slug === justRedeemed ? redeemedRef : undefined}
                          tabIndex={c.slug === justRedeemed ? -1 : undefined}
                          className="shrink-0 text-sm text-[var(--status-live-fg)]"
                        >
                          Confirmed redeemed
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          className="shrink-0"
                          onClick={() => confirmRedeemed(c.slug, c.code)}
                          disabled={busy === c.slug}
                          // Every one of these was named just "Mark redeemed",
                          // so the rotor showed a dozen identical entries for an
                          // irreversible action.
                          aria-label={`Mark redeemed — code ${spellCode(c.code)}`}
                        >
                          {busy === c.slug ? "Saving…" : "Mark redeemed"}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Surface>
          );
        })}
      </ul>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
      <dd className="mt-1 font-display text-3xl tabular-nums text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
