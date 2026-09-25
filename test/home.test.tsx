import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import Home from "@/app/page";

describe("Home", () => {
  it("renders a single level-1 hero heading: the line Ryan chose", () => {
    render(<Home />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/visual assistance you can talk to/i);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(<Home />);
    expect(await axe(container)).toHaveNoViolations();
  }, 20000);
});
