/* ================================================================
   Helpers for the homepage and phone tests: the strings a phone draws,
   a controllable IntersectionObserver, and a render at either width.
   ================================================================ */

import type { ReactElement } from "react";
import { render } from "@testing-library/react";

/**
 * Every string a phone draws, one per text node, except a word-by-word
 * line ([data-words]), which is read whole: its words are separate nodes
 * only so they can be revealed one at a time.
 */
export function phoneStrings(root: Element): string[] {
  const out: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) out.push(text);
      return;
    }
    if (node instanceof Element && node.hasAttribute("data-words")) {
      out.push((node.textContent ?? "").replace(/\s+/g, " ").trim());
      return;
    }
    node.childNodes.forEach(walk);
  };
  walk(root);
  return out;
}

/**
 * A stand-in IntersectionObserver the test drives by hand: jsdom has none,
 * and a real one would fire on layout jsdom doesn't do.
 */
export class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly targets = new Set<Element>();
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: number[];
  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    this.rootMargin = options.rootMargin ?? "0px";
    const t = options.threshold ?? 0;
    this.thresholds = Array.isArray(t) ? t : [t];
    FakeIntersectionObserver.instances.push(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  /** Reports `target` at `ratio` visible (0 = out of view). */
  fire(target: Element, ratio: number) {
    const entry = { target, isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
  /** Every live observer watching `target`. */
  static watching(target: Element) {
    return FakeIntersectionObserver.instances.filter((io) => io.targets.has(target));
  }
  static reset() {
    FakeIntersectionObserver.instances = [];
  }
}

/**
 * Renders at a desktop or a phone width: test/setup.ts answers min-width
 * queries as a desktop window, so narrowing it swaps the sticky phone for
 * one inline phone per step (lib/useWide.ts reads the query on mount).
 */
export function renderAt(width: "wide" | "narrow", ui: ReactElement) {
  const original = window.matchMedia;
  window.matchMedia = (query: string) => ({ ...original(query), matches: width === "wide" && query.includes("min-width") });
  try {
    return render(ui);
  } finally {
    window.matchMedia = original;
  }
}
