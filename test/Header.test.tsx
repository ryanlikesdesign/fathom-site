import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { axe } from "jest-axe";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";

// The header reads the route to mark the current page; outside the App
// Router there is none, so pin it to /support.
vi.mock("next/navigation", () => ({ usePathname: () => "/support" }));

beforeEach(() => {
  localStorage.clear();
  // jsdom has no layout, so scrollTo is a stub the close path can call.
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

function renderHeader() {
  return render(
    <ThemeProvider>
      <Header />
      <main id="main" tabIndex={-1}>
        <a href="/x">Page link</a>
      </main>
      <footer>Footer</footer>
    </ThemeProvider>,
  );
}

describe("Header", () => {
  it("has no axe violations with the menu closed", async () => {
    const { container } = renderHeader();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("marks the current page in both navs", () => {
    renderHeader();
    const current = screen.getAllByRole("link", { name: "Support", current: "page" });
    expect(current).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Home" }).every((a) => !a.hasAttribute("aria-current"))).toBe(true);
  });

  it("opens as a modal with focus on Close, and Escape closes it back to the toggle", async () => {
    renderHeader();
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mobile-nav");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    expect(dialog).toHaveAttribute("id", "mobile-nav");
    expect(dialog).toHaveClass("is-open");
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveFocus();
    // The page behind is pinned and hidden from readers and the tab order.
    expect(document.body.style.position).toBe("fixed");
    expect(document.querySelector("main")).toHaveAttribute("inert");
    expect(document.querySelector("footer")).toHaveAttribute("inert");
    // The header is the dialog's sibling, painted under it: inert too, or
    // Tab walks out of the modal into its controls.
    expect(document.querySelector("header")).toHaveAttribute("inert");

    await userEvent.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(dialog).not.toHaveClass("is-open");
    expect(toggle).toHaveFocus();
    expect(document.body.style.position).toBe("");
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(document.querySelector("header")).not.toHaveAttribute("inert");
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
  });

  it("closes when a menu link is chosen", async () => {
    const { container } = renderHeader();
    // jsdom cannot navigate; keep the click from trying.
    container.addEventListener("click", (e) => e.preventDefault());
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    const links = screen.getAllByRole("link", { name: "Feedback" });
    await userEvent.click(links[links.length - 1]);
    expect(dialog).not.toHaveClass("is-open");
  });
});
