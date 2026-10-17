import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The header's layout lives in app/globals.css. These checks pin the three
// decisions made for it so a later edit cannot quietly undo them: where the
// full nav gives way to the menu, the size of the nav text, and the gap in the
// phone menu's Download button.
const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

describe("header css", () => {
  it("keeps the full nav down to 900px, and groups the controls beside the menu button below it", () => {
    const block = css.match(/@media \(max-width: 900px\) \{[^}]*\.site-nav \{ display: none; \}[\s\S]*?\n\}/)?.[0] ?? "";
    expect(block).toContain(".site-nav { display: none; }");
    expect(block).toContain(".header-controls { margin-inline-start: auto; }");
    expect(block).toContain(".mobile-nav-toggle { display: inline-flex; }");
    // No 1024px rule hides the nav any more.
    expect(css).not.toMatch(/@media \(max-width: 1024px\) \{\s*\.site-nav \{ display: none/);
  });

  it("sets nav text at the site's callout size, not a raw pixel value", () => {
    expect(css).toMatch(/\.site-nav a \{[^}]*font-size: var\(--site-type-callout-size\)/);
  });

  it("keeps the header 44px tall inside: the Download pill sets no vertical padding", () => {
    expect(css).toMatch(/\.site-nav \.nav-cta \{[^}]*padding: 0 16px; line-height: 1\.3/);
  });

  it("gives the menu's Download button a gap between the Apple mark and the word", () => {
    expect(css).toMatch(/\.mobile-nav-overlay \.nav-cta \{[^}]*gap: 10px/);
  });

  it("shows the Pause motion words from 1280px and hides the tip then", () => {
    expect(css).toMatch(/@media \(min-width: 1280px\) \{[\s\S]*?\.motion-label \{ display: inline;[\s\S]*?\.motion-tip \{ display: none !important; \}/);
  });
});
