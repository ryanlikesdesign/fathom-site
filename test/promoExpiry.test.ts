import { describe, it, expect } from "vitest";
import { expiryState, formatExpiry, todayInOfferZone } from "@/lib/promoExpiry";

describe("expiryState", () => {
  it("is still valid on the expiration date itself", () => {
    const s = expiryState("2026-10-31", "2026-10-31");
    expect(s.expired).toBe(false);
    expect(s.daysLeft).toBe(0);
    expect(s.badge).toBe("Expires today");
  });

  it("flips to expired the day after", () => {
    const s = expiryState("2026-10-31", "2026-11-01");
    expect(s.expired).toBe(true);
    expect(s.label).toBe("Expired October 31, 2026");
    expect(s.badge).toBe("Expired");
  });

  it("counts days left and warns only inside 30 days", () => {
    expect(expiryState("2026-10-31", "2026-10-01").daysLeft).toBe(30);
    expect(expiryState("2026-10-31", "2026-10-01").badge).toBe("30 days left");
    // Further out there's nothing to act on, so no badge.
    expect(expiryState("2026-12-20", "2026-09-05").badge).toBeNull();
    expect(expiryState("2026-12-20", "2026-09-05").expired).toBe(false);
  });

  it("counts across a DST change without drifting", () => {
    // US DST ends 2026-11-01; a plain hour-based diff would slip a day here.
    expect(expiryState("2026-11-05", "2026-10-30").daysLeft).toBe(6);
  });

  it("handles a missing expiry date", () => {
    const s = expiryState(null, "2026-09-05");
    expect(s.expired).toBe(false);
    expect(s.badge).toBeNull();
  });
});

describe("date handling", () => {
  it("formats deterministically regardless of the machine's locale", () => {
    // Server and browser must agree or hydration breaks.
    expect(formatExpiry("2026-12-20")).toBe("December 20, 2026");
  });

  it("reads today as a sortable YYYY-MM-DD in Apple's zone", () => {
    // 07:00 UTC on the 1st is still the previous evening in Los Angeles.
    expect(todayInOfferZone(new Date("2026-11-01T06:00:00Z"))).toBe("2026-10-31");
    expect(todayInOfferZone(new Date("2026-11-01T08:00:00Z"))).toBe("2026-11-01");
  });
});
