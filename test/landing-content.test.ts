import { createElement } from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MIN_IOS as LEGACY_MIN_IOS, PLUS, PLUS_SENTENCE, PLUS_TRIAL_LABEL } from "@/lib/landing-content";
import { MIN_IOS, PAYWALL, TRIAL_DAYS } from "@/lib/app-facts";
import { COPY_13 as COPY } from "@/lib/copy-13";
import { FathomLanding } from "@/components/FathomLanding";

// The homepage renders the 1.3 deck (lib/copy-13.ts), which test/copy.test.ts
// holds to the copy rules and the app facts. These tests pin that the page
// renders the deck itself, not a copy of it, and that the few 1.2 values the
// other pages still read from lib/landing-content.ts agree with the app until
// P5 folds the deck in there.

const text = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

describe("the homepage renders the deck", () => {
  const page = () => render(createElement(FathomLanding)).container;

  it("renders the hero from the deck", () => {
    const c = page();
    expect(text(c.querySelector(".hero-eyebrow"))).toBe(COPY.hero.eyebrow);
    // Two lines, one per phrase, read as one sentence.
    expect(text(c.querySelector(".hero-title"))).toBe(COPY.hero.title.join(" "));
    expect(Array.from(c.querySelectorAll(".hero-title > span")).map(text)).toEqual([...COPY.hero.title]);
    // .hero-title and .hero-lede are the speakable selectors in the JSON-LD (app/layout.tsx).
    expect(text(c.querySelector(".hero-lede"))).toBe(COPY.hero.lede);
    expect(text(c.querySelector(".hero-actions .btn-ghost"))).toBe(COPY.hero.ctas.secondary);
    // "Download", with " on the App Store" for readers only.
    expect(text(c.querySelector(".hero-actions .btn-primary"))).toBe(COPY.hero.ctas.primary);
  });

  it("renders the gap, the safety net and day to day from the deck", () => {
    const c = page();
    expect(text(c.querySelector("#gap-title"))).toBe(`${COPY.gap.eyebrow}: ${COPY.gap.title.join("")}`);
    expect(Array.from(c.querySelectorAll(".problem-body p")).map(text)).toEqual([COPY.gap.body, COPY.gap.accent]);
    expect(text(c.querySelector("#safety-title"))).toBe(`${COPY.safetyNet.eyebrow}: ${COPY.safetyNet.title.join("")}`);
    expect(Array.from(c.querySelectorAll(".everywhere-body p")).map(text)).toEqual([...COPY.safetyNet.body]);
    expect(text(c.querySelector("#spectrum-title"))).toBe(COPY.dayToDay.title);
    const cards = Array.from(c.querySelectorAll(".spec-card"));
    expect(cards.map((card) => text(card.querySelector("h3")))).toEqual(COPY.dayToDay.cards.map((card) => card.title));
    expect(cards.map((card) => text(card.querySelector("p")))).toEqual(COPY.dayToDay.cards.map((card) => card.body));
    expect(text(c.querySelector(".spectrum-footer"))).toBe(COPY.footerNote);
  });

  it("renders the download section from the deck", () => {
    const c = page();
    expect(text(c.querySelector("#download-title"))).toBe(COPY.download.title);
    expect(text(c.querySelector(".signup-lede"))).toBe(COPY.download.lede);
    expect(text(c.querySelector(".download-note"))).toBe(COPY.download.metaLine);
    expect(Array.from(c.querySelectorAll(".download-sub")).map(text)).toEqual([
      COPY.download.freeLine,
      COPY.download.plusLine,
      COPY.download.allowanceLine,
    ]);
  });

  it("links the last step to what Google keeps, on the privacy page", () => {
    const c = page();
    const choice = COPY.steps.find((s) => s.link);
    const link = c.querySelector<HTMLAnchorElement>(".step-link a");
    expect(link?.getAttribute("href")).toBe(choice?.link?.href);
    expect(text(link)).toBe(choice?.link?.label);
  });

  it("has no em dash anywhere on the page", () => {
    expect(page().textContent).not.toContain("—");
  });
});

describe("the 1.2 values other pages still read agree with the app", () => {
  it("prices fathom plus from the paywall", () => {
    // lib/faq.tsx and app/terms/page.tsx read PLUS until P5.
    expect(PLUS.price).toBe(PAYWALL.price.value);
    expect(PLUS.trialDays).toBe(TRIAL_DAYS);
    expect(PLUS_TRIAL_LABEL.startsWith("seven")).toBe(true);
    expect(PLUS_SENTENCE).toBe(`${PAYWALL.price.value} a month after a seven-day free trial`);
  });

  it("names the minimum iOS the app builds for", () => {
    // app/layout.tsx's JSON-LD reads it.
    expect(LEGACY_MIN_IOS).toBe(MIN_IOS.value);
  });
});
