import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { FathomLanding } from "@/components/FathomLanding";
import { ACTIVE_MODE_CONTROLS, SNAPSHOT_OPTIONS } from "@/lib/landing-content";

// The setup stub answers matchMedia as a desktop window, so a plain render
// carries the sticky phone set. Narrowing it renders the inline set instead
// (lib/useWide.ts reads the query on mount, so the swap is per render).
function renderAt(width: "wide" | "narrow") {
  const original = window.matchMedia;
  window.matchMedia = (query: string) => ({ ...original(query), matches: width === "wide" && query.includes("min-width") });
  try {
    return render(<FathomLanding />);
  } finally {
    window.matchMedia = original;
  }
}

// The mockups are decorative (aria-hidden phones), but their text still ends
// up in the DOM, which is exactly what lets these tests hold the site to the
// app: only controls that exist, none that were invented.
describe("the homepage tells the truth about the app", () => {
  it("shows only controls the app has, in every active mode", () => {
    const { container } = render(<FathomLanding />);
    const text = container.textContent ?? "";
    for (const invented of ["Ask or Command", "Quick Scan", "End Navigation", "Ask a Question", "End Session"]) {
      expect(text).not.toContain(invented);
    }
    // Lookout, Point, Go, Live Task and the Assistant's active session: one
    // per active mode on the rendered desktop set.
    expect(container.querySelectorAll(".mode-actions").length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText(ACTIVE_MODE_CONTROLS.primary).length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText(ACTIVE_MODE_CONTROLS.end).length).toBeGreaterThanOrEqual(5);
  });

  it("renders one phone set per width, and the mobile set has every active mode too", () => {
    const desktop = renderAt("wide");
    expect(desktop.container.querySelectorAll(".scrolly-sticky").length).toBe(1);
    expect(desktop.container.querySelectorAll(".step-phone").length).toBe(0);
    desktop.unmount();

    const mobile = renderAt("narrow");
    expect(mobile.container.querySelectorAll(".scrolly-sticky").length).toBe(0);
    expect(mobile.container.querySelectorAll(".step-phone").length).toBeGreaterThanOrEqual(11);
    expect(mobile.container.querySelectorAll(".mode-actions").length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText(ACTIVE_MODE_CONTROLS.primary).length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText(ACTIVE_MODE_CONTROLS.end).length).toBeGreaterThanOrEqual(5);
  });

  it("names the Snapshot options and the pointing feature as the app does", () => {
    render(<FathomLanding />);
    for (const o of SNAPSHOT_OPTIONS) expect(screen.getAllByText(o).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Point at anything/ })).toBeInTheDocument();
    expect(screen.getAllByText("Looking where you're pointing.").length).toBeGreaterThan(0);
    // HomeView.swift:378-386: BETA appears only with the live Task backend,
    // which also swaps the subtitle. The mockup shows the default row, so
    // the badge must never sit beside "Step-by-step guidance".
    expect(screen.getAllByText("Step-by-step guidance").length).toBeGreaterThan(0);
    expect(screen.queryByText("BETA")).toBeNull();
  });

  it("counts five modes and states the tiers plainly", () => {
    render(<FathomLanding />);
    expect(screen.getByRole("heading", { name: /Five modes/ })).toBeInTheDocument();
    expect(screen.getByText(/\$12\.99 a month after a seven-day free trial/)).toBeInTheDocument();
    expect(screen.getByText(/free forever/)).toBeInTheDocument();
  });

  it("does not overstate what the app does", () => {
    const { container } = render(<FathomLanding />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/10 fps/);
    expect(text).not.toMatch(/ahead, behind/);
  });

  it("shows the Assistant's real listening bar, with no invented prompt or em dashes in the mockups", () => {
    const { container } = render(<FathomLanding />);
    expect(container.textContent).not.toContain("Go ahead, I'm listening");
    // Short copy never carries an em dash. Scoped to the phone screens for now;
    // the long-copy em dashes come out with the editorial pass.
    container.querySelectorAll(".phone-screen").forEach((phone) => {
      expect(phone.textContent).not.toMatch(/—/);
    });
  });

  it("puts nothing focusable inside the decorative phones", () => {
    const { container } = render(<FathomLanding />);
    const hidden = container.querySelectorAll('[aria-hidden="true"] button, [aria-hidden="true"] a, [aria-hidden="true"] [tabindex]');
    expect(hidden.length).toBe(0);
  });

  it("has a heading for every section and passes axe", async () => {
    const { container } = render(<FathomLanding />);
    container.querySelectorAll("section").forEach((s) => {
      expect(s.querySelector("h1, h2")).not.toBeNull();
    });
    expect(await axe(container)).toHaveNoViolations();
  }, 20000);
});
