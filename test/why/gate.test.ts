// The motion gate: computeMode() and the pre-paint WHY_GATE_SCRIPT are two
// copies of one decision. They must agree on every combination of inputs.
import { describe, expect, it } from "vitest";
import { applyMode, computeMode, GATE_QUERIES, MODE_ATTR, readEnv, WHY_GATE_SCRIPT, type GateEnv } from "@/components/why/gate";

const FLAGS = ["io", "raf", "motion", "unpaused", "contrast", "unforced", "big", "fit"] as const;

function envs(): GateEnv[] {
  const out: GateEnv[] = [];
  for (let bits = 0; bits < 1 << FLAGS.length; bits++) {
    for (const rootPx of [16, 24]) {
      const env = { rootPx } as GateEnv;
      FLAGS.forEach((f, i) => {
        env[f] = Boolean(bits & (1 << i));
      });
      out.push(env);
    }
  }
  return out;
}

/** A window that answers exactly as `env` says, with a recording <html>. */
function fakeWindow(env: GateEnv, preset?: string) {
  const attrs = new Map<string, string>();
  if (!env.unpaused) attrs.set("data-motion", "reduce");
  if (preset) attrs.set(MODE_ATTR, preset);
  const documentElement = {
    getAttribute: (k: string) => attrs.get(k) ?? null,
    setAttribute: (k: string, v: string) => void attrs.set(k, String(v)),
    removeAttribute: (k: string) => void attrs.delete(k),
  };
  const answers: Record<string, boolean> = {
    [GATE_QUERIES.motion]: env.motion,
    [GATE_QUERIES.contrast]: env.contrast,
    [GATE_QUERIES.forced]: env.unforced,
    [GATE_QUERIES.big]: env.big,
    [GATE_QUERIES.fit]: env.fit,
  };
  const w: Record<string, unknown> = {
    document: { documentElement },
    matchMedia: (q: string) => ({ matches: answers[q] ?? false }),
    getComputedStyle: () => ({ fontSize: Number.isNaN(env.rootPx) ? "" : `${env.rootPx}px` }),
  };
  if (env.io) w.IntersectionObserver = function IntersectionObserver() {};
  if (env.raf) w.requestAnimationFrame = () => 0;
  return { w, attrs };
}

function runScript(w: unknown) {
  // The script is a compile-time constant (gate.ts), run here exactly as the
  // browser runs it, against a fake window.
  new Function("window", WHY_GATE_SCRIPT)(w);
}

describe("computeMode", () => {
  it("covers all 256 combinations of the eight inputs at 16px and 24px", () => {
    expect(envs()).toHaveLength(512);
  });

  it("stages big windows, pockets the rest that fit, and leaves everything else static", () => {
    for (const env of envs()) {
      const motionOK = env.io && env.raf && env.motion && env.unpaused && env.contrast && env.unforced;
      const expected = !motionOK || env.rootPx > 20 ? "static" : env.big ? "stage" : env.fit ? "pocket" : "static";
      expect(computeMode(env), JSON.stringify(env)).toBe(expected);
    }
  });

  it("gives phones at normal text size motion: pockets", () => {
    const phone = { io: true, raf: true, motion: true, unpaused: true, contrast: true, unforced: true, big: false, fit: true, rootPx: 16 };
    expect(computeMode(phone)).toBe("pocket");
    // Landscape phones, heavy page zoom (under 320 x 520), and text zoom: the finished page.
    expect(computeMode({ ...phone, fit: false })).toBe("static");
    expect(computeMode({ ...phone, rootPx: 21 })).toBe("static");
    expect(computeMode({ ...phone, big: true, rootPx: 21 })).toBe("static");
  });

  it("treats a root size the engine does not report as the default", () => {
    const all = { io: true, raf: true, motion: true, unpaused: true, contrast: true, unforced: true, big: true, fit: true };
    expect(computeMode({ ...all, rootPx: NaN })).toBe("stage");
    expect(computeMode({ ...all, rootPx: 20 })).toBe("stage");
    expect(computeMode({ ...all, rootPx: 20.5 })).toBe("static");
    expect(computeMode({ ...all, big: false, rootPx: NaN })).toBe("pocket");
  });
});

describe("readEnv", () => {
  it("reads each input from the window", () => {
    for (const env of envs()) expect(readEnv(fakeWindow(env).w as never)).toEqual(env);
  });
});

describe("WHY_GATE_SCRIPT", () => {
  it("agrees with computeMode on every combination", () => {
    for (const env of [...envs(), ...envs().map((e) => ({ ...e, rootPx: NaN }))]) {
      const expected = computeMode(env);
      for (const preset of [undefined, "stage", "pocket"]) {
        const { w, attrs } = fakeWindow(env, preset);
        runScript(w);
        expect(attrs.get(MODE_ATTR) ?? "static", `${JSON.stringify(env)} from ${preset}`).toBe(expected);
      }
    }
  });

  it("leaves the static page when anything throws", () => {
    const { w, attrs } = fakeWindow(
      { io: true, raf: true, motion: true, unpaused: true, contrast: true, unforced: true, big: true, fit: true, rootPx: 16 },
      "stage",
    );
    (w as { matchMedia: unknown }).matchMedia = () => {
      throw new Error("no media queries here");
    };
    runScript(w);
    expect(attrs.has(MODE_ATTR)).toBe(false);
  });

  it("is one self-contained expression that touches nothing but its argument", () => {
    expect(WHY_GATE_SCRIPT.startsWith("(function(w){")).toBe(true);
    expect(WHY_GATE_SCRIPT.endsWith("})(window)")).toBe(true);
    const body = WHY_GATE_SCRIPT.slice("(function(w){".length, -"})(window)".length);
    // Globals only as properties of w (w.document), never bare.
    expect(body).not.toMatch(/(^|[^.\w])(window|document|self|globalThis|matchMedia|getComputedStyle)\b/);
    expect(WHY_GATE_SCRIPT).not.toMatch(/visualViewport/);
  });
});

describe("under the test setup's matchMedia stub", () => {
  it("lands on the static page", () => {
    expect(computeMode(readEnv(window))).toBe("static");
  });

  it("would stay static even with IntersectionObserver, since reduced-motion queries answer false", () => {
    const env = { ...readEnv(window), io: true, raf: true };
    expect(env.big).toBe(true);
    expect(env.motion).toBe(false);
    expect(computeMode(env)).toBe("static");
  });
});

describe("applyMode", () => {
  it("writes the mode, and static removes it", () => {
    const html = document.createElement("html");
    applyMode(html, "stage");
    expect(html.getAttribute(MODE_ATTR)).toBe("stage");
    applyMode(html, "pocket");
    expect(html.getAttribute(MODE_ATTR)).toBe("pocket");
    applyMode(html, "static");
    expect(html.hasAttribute(MODE_ATTR)).toBe(false);
  });
});
