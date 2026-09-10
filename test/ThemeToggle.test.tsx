import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("ThemeToggle", () => {
  it("toggles the data-theme attribute on the html element", async () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    // Icon-only control: the name is the action, and it flips with the state.
    const btn = screen.getByRole("button", { name: "Switch to light theme" });
    // Default is dark; first activation flips to light and persists the choice.
    await userEvent.click(btn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("fathom-theme")).toBe("light");
    expect(btn).toHaveAccessibleName("Switch to dark theme");
  });
});
