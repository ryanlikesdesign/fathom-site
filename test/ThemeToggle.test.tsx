import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

beforeEach(() => localStorage.clear());

describe("ThemeToggle", () => {
  it("toggles the dark class on the html element", async () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    const btn = screen.getByRole("button", { name: /switch to (dark|light) theme/i });
    await userEvent.click(btn);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
