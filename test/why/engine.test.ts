// The /why scroll vocabulary: easing tokens parsed as the site's CSS
// would ease, and the number format every written string uses.
import { describe, expect, it } from "vitest";
import { cubicBezier, defaultEasings, fmt, parseEasing, readEasings } from "@/components/why/engine";

describe("parseEasing", () => {
  it("parses cubic-bezier and the keywords", () => {
    expect(parseEasing("ease")(0.5)).toBeCloseTo(0.8024, 3);
    expect(parseEasing("ease-in")(0)).toBe(0);
    expect(parseEasing("ease-in-out")(1)).toBe(1);
    expect(parseEasing("ease-in-out")(0.5)).toBeCloseTo(0.5, 4);
    expect(parseEasing("linear")(0.37)).toBe(0.37);
    // --ease-standard approximates an ease-out cubic.
    const std = parseEasing("cubic-bezier(0.33, 1, 0.68, 1)");
    expect(std(0.5)).toBeCloseTo(1 - 0.5 ** 3, 1);
    expect(std(0.5)).toBeCloseTo(cubicBezier(0.33, 1, 0.68, 1)(0.5), 10);
  });

  it("parses linear() lists, with the settle spring's overshoot", () => {
    const f = parseEasing("linear(0, 0.25 75%, 1)");
    expect(f(0.75)).toBeCloseTo(0.25, 6);
    expect(f(0.375)).toBeCloseTo(0.125, 6);
    expect(f(0.875)).toBeCloseTo(0.625, 6);
    const flat = parseEasing("linear(0, 0.5 25% 75%, 1)");
    expect(flat(0.5)).toBeCloseTo(0.5, 6);
    expect(flat(0.125)).toBeCloseTo(0.25, 6);
    const even = parseEasing("linear(0, 1.005, 1)");
    expect(even(0.5)).toBeCloseTo(1.005, 6);
    expect(even(0.75)).toBeCloseTo(1.0025, 6);
    expect(even(1)).toBe(1);
  });

  it("falls back for anything it cannot read", () => {
    const fb = (t: number) => t * t;
    for (const v of ["", "  ", "steps(4, end)", "cubic-bezier(2, 0, 1, 1)", "cubic-bezier(0, 0)", "linear(a, b)", "linear(0)"]) {
      expect(parseEasing(v, fb)(0.5), v).toBe(0.25);
    }
    expect(parseEasing(undefined)(0.5)).toBeCloseTo(parseEasing("ease-out")(0.5), 10);
  });

  it("reads the tokens, falling back when they are missing", () => {
    const tokens: Record<string, string> = {
      "--ease-standard": "linear",
      "--fathom-motion-settle-easing": "linear(0, 1.005 80%, 1)",
      "--fathom-motion-crossfade-easing": "ease-in",
    };
    const e = readEasings((k) => tokens[k] ?? "");
    expect(e.standard(0.3)).toBe(0.3);
    expect(e.settle(0.8)).toBeCloseTo(1.005, 6);
    expect(e.crossfade(0.5)).toBeCloseTo(parseEasing("ease-in")(0.5), 10);
    const none = readEasings(() => "");
    expect(none.standard(0.5)).toBeCloseTo(defaultEasings().standard(0.5), 10);
  });
});

describe("fmt", () => {
  it("formats numbers in their shortest form", () => {
    expect(fmt(2, 2)).toBe("2");
    expect(fmt(2.006, 2)).toBe("2.01");
    expect(fmt(-0.004, 2)).toBe("0");
  });
});
