import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "jest-axe";

// posthog-js touches browser globals on import/use — stub it.
// vi.hoisted so the stub exists before the hoisted vi.mock factory runs.
const ph = vi.hoisted(() => ({ capture: vi.fn(), identify: vi.fn(), reset: vi.fn() }));
vi.mock("posthog-js", () => ({ default: ph }));

import { qrShape } from "@/lib/qr";
import { findCodeById, PROMO_TIERS } from "@/lib/promo";
import { PromoGate } from "@/components/PromoGate";

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe("qrShape (vendored encoder)", () => {
  it("encodes text into a positive, odd-sized module grid with a path", () => {
    const { size, path } = qrShape("https://fathomvision.app/promo/r/m3-001?rep=Ada");
    expect(size).toBeGreaterThan(0);
    expect(size % 2).toBe(1); // every QR version has an odd module count
    expect(path.length).toBeGreaterThan(0);
  });
});

describe("findCodeById", () => {
  it("finds a code and its tier across tiers", () => {
    const first = PROMO_TIERS[0].codes[0];
    const found = findCodeById(first.id);
    expect(found?.code.code).toBe(first.code);
    expect(found?.tier.id).toBe(PROMO_TIERS[0].id);
  });
  it("returns null for unknown ids", () => {
    expect(findCodeById("does-not-exist")).toBeNull();
  });
});

describe("PromoGate", () => {
  it("locked view has no axe violations", async () => {
    const { container } = render(<PromoGate />);
    // wait for mount effect to swap out the "Loading…" placeholder
    await screen.findByLabelText(/access password/i);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("rejects the wrong password with an alert", async () => {
    render(<PromoGate />);
    await userEvent.type(await screen.findByLabelText(/access password/i), "nope");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/isn't right/i);
  });

  it("unlocks and shows both offers as tabs, switching panels on click", async () => {
    const { container } = render(<PromoGate />);
    await userEvent.type(screen.getByLabelText(/your name/i), "Ada");
    await userEvent.type(await screen.findByLabelText(/access password/i), "fathom-crew");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));

    // Both offers are tabs; the first is selected and its panel heading shows.
    const yearTab = await screen.findByRole("tab", { name: /1 year free/i });
    expect(screen.getByRole("tab", { name: /3 months free/i })).toHaveAttribute("aria-selected", "true");
    expect(yearTab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("heading", { name: /3 months free/i })).toBeInTheDocument();
    // The hidden panel's heading is out of the a11y tree until its tab is chosen.
    expect(screen.queryByRole("heading", { name: /1 year free/i })).not.toBeInTheDocument();

    await userEvent.click(yearTab);
    expect(yearTab).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("heading", { name: /1 year free/i })).toBeInTheDocument();

    expect(screen.getByText(/sharing as/i)).toHaveTextContent("Ada");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PromoBoard sharing", () => {
  async function unlock() {
    render(<PromoGate />);
    await userEvent.type(screen.getByLabelText(/your name/i), "Ada");
    await userEvent.type(await screen.findByLabelText(/access password/i), "fathom-crew");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));
    await screen.findByRole("heading", { name: /3 months free/i });
  }

  it("copying a code records a promo_shared event and advances to the next code", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    await unlock();
    expect(screen.getByText(/code 1 of 26/i)).toBeInTheDocument();

    const [copyCode] = screen.getAllByRole("button", { name: /copy code/i });
    await userEvent.click(copyCode);

    expect(writeText).toHaveBeenCalled();
    expect(ph.capture).toHaveBeenCalledWith(
      "promo_shared",
      expect.objectContaining({ method: "copy_code", rep_name: "Ada" }),
    );
    // Auto-advanced to the next code, and the tier's shared tally went up.
    expect(await screen.findByText(/^Code 2 of 26$/)).toBeInTheDocument();
    expect(screen.getByText(/1 of 26 shared/i)).toBeInTheDocument();
  });

  it("resets shared markings and returns to the first code", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await unlock();
    await userEvent.click(screen.getAllByRole("button", { name: /copy code/i })[0]);
    expect(screen.getByText(/1 of 26 shared/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /reset shared/i }));
    expect(await screen.findByText(/0 of 26 shared/i)).toBeInTheDocument();
    expect(screen.getByText(/^Code 1 of 26$/)).toBeInTheDocument();
  });
});
