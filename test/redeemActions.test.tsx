import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { axe } from "jest-axe";

const ph = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: ph }));

import { RedeemActions } from "@/components/RedeemActions";

// The recipient is often blind too. This surface had no test at all, which is
// how a prohibited aria-label on a <p> shipped unquestioned.
const props = {
  slug: "abcdefghij",
  code: "A1B2C3",
  offerName: "Outreach",
  durationLabel: "3 months free",
  rep: null,
  href: "/promo/r/abcdefghij/redeem",
};

describe("RedeemActions", () => {
  it("has no axe violations", async () => {
    const { container } = render(<RedeemActions {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("spells the code out and never labels a paragraph", () => {
    render(<RedeemActions {...props} />);
    expect(screen.getByText("Alpha, One, Bravo, Two, Charlie, Three", { exact: false })).toBeInTheDocument();
    expect(document.querySelector("p[aria-label]")).toBeNull();
  });

  it("copies the code and confirms it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<RedeemActions {...props} />);
    await userEvent.click(screen.getByRole("button", { name: /^copy/i }));
    expect(writeText).toHaveBeenCalledWith("A1B2C3");
    expect(await screen.findByRole("status")).toHaveTextContent(/copied/i);
  });

  it("redeem link goes to the tracking route, not Apple directly", () => {
    render(<RedeemActions {...props} />);
    expect(screen.getByRole("link", { name: /redeem in the app store/i })).toHaveAttribute(
      "href",
      "/promo/r/abcdefghij/redeem",
    );
  });
});
