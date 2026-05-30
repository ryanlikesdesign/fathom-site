import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Surface } from "@/components/Surface";

describe("Surface", () => {
  it("renders children and applies register data attribute", () => {
    render(<Surface register="lift">hello</Surface>);
    const el = screen.getByText("hello");
    expect(el).toHaveAttribute("data-register", "lift");
  });
});
