import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "@/components/Button";

describe("Button", () => {
  it("renders a link when href is provided", () => {
    render(<Button href="/feedback">Send feedback</Button>);
    expect(screen.getByRole("link", { name: "Send feedback" })).toHaveAttribute("href", "/feedback");
  });
  it("renders a button element otherwise", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });
});
