// Logo geometry and the brand components. The generated paths must be the
// vendored SVGs' own `d` strings, byte for byte: an optimizer that rounds
// coordinates would pull the pixel-fitted masters off their grid.
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";
import { APP_ICON, LOCKUP, LOCKUP_MARK, LOGOTYPE, MARK, MARK_MASTERS, type LogoPath } from "@/design-system/generated/logo-paths";
import { Mark, markMasterFor } from "@/components/brand/Mark";
import { Logotype } from "@/components/brand/Logotype";
import { Lockup } from "@/components/brand/Lockup";

const logos = path.resolve(__dirname, "../design-system/vendor/logos");
function vendored(file: string) {
  const svg = readFileSync(path.join(logos, file), "utf8");
  const path_ = /<path\b[^>]*>/.exec(svg)![0];
  return {
    viewBox: /viewBox="([^"]+)"/.exec(svg)![1],
    d: /\sd="([^"]+)"/.exec(path_)![1],
    fillRule: /fill-rule="([^"]+)"/.exec(path_)?.[1] ?? "nonzero",
  };
}

const PAIRS: [string, LogoPath, string][] = [
  ["mark 120", MARK[120], "fathom-mark"],
  ["mark 32", MARK[32], "fathom-mark-32"],
  ["mark 24", MARK[24], "fathom-mark-24"],
  ["mark 16", MARK[16], "fathom-mark-16"],
  ["lockup mark", LOCKUP_MARK, "fathom-lockup-mark"],
  ["logotype", LOGOTYPE, "fathom-logotype"],
  ["lockup", LOCKUP, "fathom-lockup"],
];

describe("logo paths", () => {
  it.each(PAIRS)("%s keeps the vendored path byte for byte (ink and bone)", (_, generated, base) => {
    for (const tone of ["ink", "bone"]) {
      const v = vendored(`${base}-${tone}.svg`);
      expect(generated.d).toBe(v.d);
      expect(generated.viewBox).toBe(v.viewBox);
      expect(generated.fillRule).toBe(v.fillRule);
    }
  });

  it("keeps the app icon's path and its DS colors", () => {
    const v = vendored("fathom-app-icon.svg");
    expect(APP_ICON.d).toBe(v.d);
    expect(APP_ICON.viewBox).toBe(v.viewBox);
    expect(APP_ICON.backgroundToken).toBe("fathom-900");
    expect(APP_ICON.foregroundToken).toBe("bone-100");
  });

  it("splits the lockup into mark and word without changing a byte", () => {
    expect(`${LOCKUP.markD} ${LOCKUP.wordD}`).toBe(LOCKUP.d);
    expect(LOCKUP.markD.match(/M/g)).toHaveLength(7); // a core and three rings, each ring two subpaths
    expect(LOCKUP.markBox.maxX).toBeLessThanOrEqual(LOCKUP_MARK.width);
    expect(LOCKUP.wordBox.minX).toBeGreaterThan(LOCKUP.markBox.maxX);
  });

  it("carries no metadata into the generated file", () => {
    const text = readFileSync(path.resolve(__dirname, "../design-system/generated/logo-paths.ts"), "utf8");
    expect(text).not.toMatch(/c2pa|<metadata|<title|aria-label/i);
  });
});

describe("Mark", () => {
  it("follows the DS size ladder, rounding down", () => {
    const cases: [number, number][] = [
      [200, 120], [48, 120], [40, 120],
      [39, 32], [32, 32],
      [31, 24], [28, 24], [24, 24],
      [23, 16], [16, 16], [12, 16],
    ];
    for (const [size, master] of cases) expect(markMasterFor(size), `size ${size}`).toBe(master);
    expect([...MARK_MASTERS]).toEqual([120, 32, 24, 16]);
  });

  it("draws the chosen master at the asked size, in currentColor", () => {
    for (const size of [16, 24, 28, 32, 48]) {
      const { container } = render(<Mark size={size} />);
      const svg = container.querySelector("svg")!;
      const master = MARK[markMasterFor(size)];
      expect(svg.getAttribute("viewBox")).toBe(master.viewBox);
      expect(svg.getAttribute("width")).toBe(String(size));
      expect(svg.getAttribute("fill")).toBe("currentColor");
      expect(container.querySelector("path")!.getAttribute("d")).toBe(master.d);
      expect(container.querySelector("path")!.getAttribute("fill-rule")).toBe("evenodd");
    }
  });

  it("is hidden from assistive tech unless it is given a label", () => {
    const hidden = render(<Mark size={24} />).container.querySelector("svg")!;
    expect(hidden).toHaveAttribute("aria-hidden", "true");
    expect(hidden).not.toHaveAttribute("role");
    const named = render(<Mark size={24} label="fathom" />).container.querySelector("svg")!;
    expect(named).toHaveAttribute("role", "img");
    expect(named).toHaveAttribute("aria-label", "fathom");
    expect(named).not.toHaveAttribute("aria-hidden");
  });
});

describe("Lockup and Logotype", () => {
  it("colors the mark and the word separately", () => {
    const { container } = render(<Lockup height={28} markClassName="mark-tone" wordClassName="word-tone" />);
    const [mark, word] = container.querySelectorAll("path");
    expect(mark.getAttribute("d")).toBe(LOCKUP.markD);
    expect(word.getAttribute("d")).toBe(LOCKUP.wordD);
    expect(mark).toHaveClass("mark-tone");
    expect(word).toHaveClass("word-tone");
    expect(mark.getAttribute("fill")).toBe("currentColor");
    expect(word.getAttribute("fill")).toBe("currentColor");
  });

  it("keeps the drawing's proportions", () => {
    const svg = render(<Lockup height={28} />).container.querySelector("svg")!;
    expect(Number(svg.getAttribute("width"))).toBeCloseTo((28 * LOCKUP.width) / LOCKUP.height, 1);
    const word = render(<Logotype height={20} />).container.querySelector("svg")!;
    expect(Number(word.getAttribute("width"))).toBeCloseTo((20 * LOGOTYPE.width) / LOGOTYPE.height, 1);
  });

  it("has no axe violations, named on its own or decorative inside a named link", async () => {
    const { container } = render(
      <main>
        <h1>Brand</h1>
        <Lockup height={28} label="fathom" />
        <Link href="/" aria-label="fathom, home">
          <Lockup height={28} />
        </Link>
        <Link href="/">
          <Logotype height={20} label="fathom" />
        </Link>
        <p>
          <Mark size={16} /> Made by fathom
        </p>
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
