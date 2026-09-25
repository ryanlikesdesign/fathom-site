import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { Footer } from "@/components/Footer";

describe("Footer", () => {
  it("has no axe violations", async () => {
    const { container } = render(<Footer />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("titles its three columns with level-2 headings", () => {
    render(<Footer />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["Product", "Help", "Legal"]);
  });

  it("signs off with the lockup and the tagline", () => {
    render(<Footer />);
    expect(screen.getByRole("img", { name: "fathom" })).toHaveClass("brand-lockup");
    expect(screen.getByText("Visual assistance you can talk to.")).toBeInTheDocument();
  });

  it("opens the App Store link in the same tab", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Download on the App Store" })).not.toHaveAttribute("target");
  });
});
