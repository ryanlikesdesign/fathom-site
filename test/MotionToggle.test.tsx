import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { axe } from "jest-axe";
import { MotionToggle } from "@/components/MotionToggle";

const originalMatchMedia = window.matchMedia;

// The setup stub answers every non-width query as "no preference". This
// swaps in a window whose OS Reduce Motion setting is on, with a change
// listener the test can fire.
function withOsReduceMotion(matches: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_: string, cb: () => void) => { listeners.add(cb); },
    removeEventListener: (_: string, cb: () => void) => { listeners.delete(cb); },
    dispatchEvent: () => false,
  };
  window.matchMedia = (query: string) =>
    query.includes("prefers-reduced-motion") ? (mql as unknown as MediaQueryList) : originalMatchMedia(query);
  return {
    set(next: boolean) {
      mql.matches = next;
      listeners.forEach((cb) => cb());
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-motion");
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("MotionToggle", () => {
  it("renders as an unpressed toggle with a visible label", () => {
    render(<MotionToggle />);
    const btn = screen.getByRole("button", { name: "Pause motion" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).not.toHaveAttribute("aria-disabled");
    expect(document.documentElement.hasAttribute("data-motion")).toBe(false);
  });

  it("pauses and resumes motion on the html element and persists the choice", async () => {
    render(<MotionToggle />);
    const btn = screen.getByRole("button", { name: "Pause motion" });
    await userEvent.click(btn);
    // One cue: the name holds still and aria-pressed carries the state, so a
    // screen reader never hears "Resume motion, pressed".
    expect(screen.getByRole("button", { name: "Pause motion" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.getAttribute("data-motion")).toBe("reduce");
    expect(localStorage.getItem("fathom-motion")).toBe("reduce");

    await userEvent.click(btn);
    expect(screen.getByRole("button", { name: "Pause motion" })).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.hasAttribute("data-motion")).toBe(false);
    expect(localStorage.getItem("fathom-motion")).toBeNull();
  });

  it("adopts a choice the anti-flash script already applied", () => {
    document.documentElement.setAttribute("data-motion", "reduce");
    render(<MotionToggle />);
    expect(screen.getByRole("button", { name: "Pause motion" })).toHaveAttribute("aria-pressed", "true");
  });

  it("reports the OS setting truthfully and offers no action it cannot perform", async () => {
    const os = withOsReduceMotion(true);
    render(<MotionToggle />);
    const btn = screen.getByRole("button", { name: "Motion off, set by your device" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(document.documentElement.getAttribute("data-motion")).toBe("reduce");

    // Pressing it changes nothing: the page is still by CSS alone.
    await userEvent.click(btn);
    expect(screen.getByRole("button", { name: "Motion off, set by your device" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.getAttribute("data-motion")).toBe("reduce");
    expect(localStorage.getItem("fathom-motion")).toBeNull();

    // The setting turning off hands control back to the reader's own choice
    // (none stored here), so the page and the control both return to motion on.
    os.set(false);
    const back = await screen.findByRole("button", { name: "Pause motion" });
    expect(back).toHaveAttribute("aria-pressed", "false");
    expect(back).not.toHaveAttribute("aria-disabled");
    expect(document.documentElement.hasAttribute("data-motion")).toBe(false);
  });

  it("keeps a stored pause when the OS setting turns off", async () => {
    const os = withOsReduceMotion(true);
    localStorage.setItem("fathom-motion", "reduce");
    render(<MotionToggle />);
    os.set(false);
    const btn = await screen.findByRole("button", { name: "Pause motion" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.getAttribute("data-motion")).toBe("reduce");
  });

  it("has no axe violations", async () => {
    const { container } = render(<MotionToggle />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations while the OS setting holds it", async () => {
    withOsReduceMotion(true);
    const { container } = render(<MotionToggle />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("MotionToggle: its words", () => {
  it("shows its words and a tip as aria-hidden copies, so the name is read once", () => {
    const { container } = render(<MotionToggle />);
    const button = screen.getByRole("button", { name: "Pause motion" });
    const hidden = Array.from(button.querySelectorAll("[aria-hidden='true']")).map((e) => e.textContent?.trim());
    expect(hidden).toContain("Pause motion"); // the visible label and the tip
    expect(container.querySelector(".motion-label")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".motion-tip")?.getAttribute("aria-hidden")).toBe("true");
    // The visible words are contained in the accessible name (WCAG 2.5.3).
    expect(button.getAttribute("aria-label")).toContain(container.querySelector(".motion-label")!.textContent!);
  });

  it("says what the device did when the OS setting is on, in the label and in the name", () => {
    withOsReduceMotion(true);
    const { container } = render(<MotionToggle />);
    const button = screen.getByRole("button", { name: "Motion off, set by your device" });
    expect(container.querySelector(".motion-label")?.textContent).toBe("Motion off");
    expect(button.getAttribute("aria-label")).toContain("Motion off");
  });

  it("has no axe violations with the label and tip in place", async () => {
    const { container } = render(<MotionToggle />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

