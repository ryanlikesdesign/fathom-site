import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "jest-axe";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { PromoTracker } from "@/components/PromoTracker";

const BATCHES = [
  {
    batch_id: "526704", offer_name: "Outreach", duration_label: "3 months free",
    expires_on: "2026-12-20", sort_order: 1, total: 1000, available: 956,
    reserved: 44, sent: 0, confirmed_redeemed: 0, links_opened: 0, redeem_clicked: 0,
  },
];

const base = {
  batch_id: "526704", assigned_by: "spreadsheet import", sent_by: null,
  first_opened_at: null, open_count: 0, redeem_clicked_at: null,
  redeemed_at: null, note: null, source: "asc:526704",
};

// Imported from the spreadsheet: no send date, no events.
const imported = { ...base, code: "AAA111", slug: "s1", status: "assigned", assigned_to: "NFBDE", sent_at: null };
// Handed out through the tool, recipient opened and tapped through.
const live = {
  ...base, code: "BBB222", slug: "s2", status: "sent", assigned_to: "Kat Botner",
  sent_at: "2026-09-05T10:00:00Z", sent_by: "Ada",
  first_opened_at: "2026-09-05T11:00:00Z", open_count: 1,
  redeem_clicked_at: "2026-09-05T11:05:00Z",
};

beforeEach(() => vi.clearAllMocks());

describe("PromoTracker", () => {
  it("separates 'no tracking data' from 'nobody opened it'", async () => {
    render(<PromoTracker used={[imported]} batches={BATCHES} />);

    // The distinction that stops a false read of the numbers.
    expect(screen.getByText(/1 of these predate tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/missing information, not evidence nobody used them/i)).toBeInTheDocument();
    expect(screen.getByText(/no tracking data/i)).toBeInTheDocument();
  });

  it("groups by recipient and counts the funnel", async () => {
    render(<PromoTracker used={[imported, live]} batches={BATCHES} />);

    expect(screen.getByText("NFBDE")).toBeInTheDocument();
    expect(screen.getByText("Kat Botner")).toBeInTheDocument();
    expect(screen.getByText(/1 opened · 1 tapped · 0 redeemed/)).toBeInTheDocument();
  });

  it("reveals individual codes only when a group is expanded", async () => {
    render(<PromoTracker used={[live]} batches={BATCHES} />);

    expect(screen.queryByText("BBB222")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Kat Botner/i }));
    expect(screen.getByText("BBB222")).toBeInTheDocument();
    // The row's own detail line, not the summary tile of the same name.
    expect(screen.getByText(/3 months free · Tapped redeem .* by Ada/)).toBeInTheDocument();
  });

  it("does not count a freshly reserved code as predating tracking", async () => {
    // Taken from the pool a minute ago via the tool — the opposite of untracked.
    const reserved = {
      ...base, code: "CCC333", slug: "s3", status: "assigned",
      assigned_to: null, assigned_by: "Ryan Higgins", sent_at: null,
    };
    render(<PromoTracker used={[imported, reserved]} batches={BATCHES} />);

    expect(screen.getByText(/1 of these predate tracking/i)).toBeInTheDocument();
    expect(screen.queryByText(/2 of these predate tracking/i)).not.toBeInTheDocument();
    expect(screen.getByText(/reserved, not handed out yet/i)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<PromoTracker used={[imported, live]} batches={BATCHES} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("tells you where codes will appear when none have gone out", () => {
    render(<PromoTracker used={[]} batches={BATCHES} />);
    expect(screen.getByText(/No codes have gone out yet/i)).toBeInTheDocument();
  });
});
