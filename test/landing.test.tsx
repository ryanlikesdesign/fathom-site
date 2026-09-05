import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { FathomLanding } from "@/components/FathomLanding";
import { ACTIVE_MODE_CONTROLS, SNAPSHOT_OPTIONS } from "@/lib/landing-content";

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
    // Lookout, Go, Live Task and Point, on desktop and mobile copies.
    expect(container.querySelectorAll(".mode-actions").length).toBeGreaterThanOrEqual(6);
    expect(screen.getAllByText(ACTIVE_MODE_CONTROLS.primary).length).toBeGreaterThanOrEqual(6);
    expect(screen.getAllByText(ACTIVE_MODE_CONTROLS.end).length).toBeGreaterThanOrEqual(6);
  });

  it("names the Snapshot options and the pointing feature as the app does", () => {
    render(<FathomLanding />);
    for (const o of SNAPSHOT_OPTIONS) expect(screen.getAllByText(o).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Point at anything/ })).toBeInTheDocument();
    expect(screen.getAllByText("Looking where you're pointing.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BETA").length).toBeGreaterThan(0);
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
