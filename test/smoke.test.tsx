import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

function Hello() {
  return <h1>Fathom</h1>;
}

describe("test harness", () => {
  it("renders", () => {
    render(<Hello />);
    expect(screen.getByRole("heading", { name: "Fathom" })).toBeInTheDocument();
  });
});
