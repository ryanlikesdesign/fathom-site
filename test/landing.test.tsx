import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { FathomLanding } from "@/components/FathomLanding";
import { COPY_13 as COPY } from "@/lib/copy-13";
import { isPhoneString, marketingViolations } from "./helpers/copy-rules";
import { phoneStrings, renderAt } from "./helpers/phones";

// The mockups are decorative (aria-hidden phones), but their text is in the
// DOM, which is exactly what lets these tests hold the site to the app: every
// string a phone draws is an app string or a marked example.
describe("the homepage tells the 1.3 story", () => {
  it("opens on the hero line, then the gap", () => {
    render(<FathomLanding />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/visual assistance you can talk to/i);
    expect(screen.getByRole("heading", { level: 2, name: /Most of the day\s*asks you to look/ })).toBeInTheDocument();
  });

  it("tells ten steps, each with its eyebrow, two-line headline, body and tier line", () => {
    const { container } = render(<FathomLanding />);
    const steps = Array.from(container.querySelectorAll<HTMLElement>(".scrolly .step"));
    expect(steps).toHaveLength(10);
    steps.forEach((el, i) => {
      const step = COPY.steps[i];
      expect(el.dataset.step).toBe(step.screen);
      expect(el.dataset.tier).toBe(step.tier);
      expect(el.querySelector(".eyebrow")?.textContent).toBe(step.eyebrow);
      const h2 = within(el).getByRole("heading", { level: 2 });
      // The eyebrow rides along as an sr-only prefix, so it is heard once.
      expect(h2.textContent).toBe(`${step.eyebrow}: ${step.headline[0]}${step.headline[1]}`);
      expect(Array.from(el.querySelectorAll(".step-body")).map((p) => p.textContent)).toEqual([...step.body]);
      expect(el.querySelector(".step-whisper")?.textContent).toBe(step.whisper);
      if (step.example) expect(el.querySelector(".step-example")?.textContent).toBe(`“${step.example}”`);
      else expect(el.querySelector(".step-example")).toBeNull();
    });
  });

  it("renders one phone set per width", () => {
    const desktop = renderAt("wide", <FathomLanding />);
    expect(desktop.container.querySelectorAll(".scrolly-sticky")).toHaveLength(1);
    expect(desktop.container.querySelectorAll(".scrolly-sticky .screen")).toHaveLength(10);
    expect(desktop.container.querySelectorAll(".step-phone")).toHaveLength(0);
    desktop.unmount();

    const mobile = renderAt("narrow", <FathomLanding />);
    expect(mobile.container.querySelectorAll(".scrolly-sticky")).toHaveLength(0);
    expect(mobile.container.querySelectorAll(".step-phone")).toHaveLength(10);
    // Every inline phone is its step's screen, shown.
    mobile.container.querySelectorAll<HTMLElement>(".scrolly .step").forEach((step) => {
      const shown = step.querySelectorAll<HTMLElement>(".step-phone .screen");
      expect(shown).toHaveLength(1);
      expect(shown[0].dataset.screen).toBe(step.dataset.step);
      expect(shown[0].classList.contains("is-active")).toBe(true);
    });
  });

  it.each(["wide", "narrow"] as const)("draws only app strings and marked examples in every phone (%s)", (width) => {
    const { container } = renderAt(width, <FathomLanding />);
    const phones = container.querySelectorAll(".phone-screen");
    expect(phones.length).toBeGreaterThan(1);
    const invented: string[] = [];
    phones.forEach((phone) => {
      for (const text of phoneStrings(phone)) if (!isPhoneString(text)) invented.push(text);
    });
    expect(invented).toEqual([]);
  });

  it.each(["wide", "narrow"] as const)("keeps every phone string to the copy rules, no em dash (%s)", (width) => {
    const { container } = renderAt(width, <FathomLanding />);
    container.querySelectorAll(".phone-screen").forEach((phone) => {
      expect(phone.textContent).not.toMatch(/—/);
      for (const text of phoneStrings(phone)) expect(marketingViolations(text), text).toEqual([]);
    });
  });

  it("keeps the page's own words to the copy rules", () => {
    const { container } = render(<FathomLanding />);
    const page = container.cloneNode(true) as HTMLElement;
    page.querySelectorAll(".phone").forEach((phone) => phone.remove());
    expect(marketingViolations(page.textContent ?? "")).toEqual([]);
  });

  it.each(["wide", "narrow"] as const)("puts nothing focusable inside the decorative phones (%s)", (width) => {
    const { container } = renderAt(width, <FathomLanding />);
    const hidden = container.querySelectorAll(
      '[aria-hidden="true"] :is(a, button, input, select, textarea, [tabindex], [contenteditable])',
    );
    expect(hidden).toHaveLength(0);
    container.querySelectorAll(".phone").forEach((phone) => {
      expect(phone.closest('[aria-hidden="true"]'), "every phone is inside an aria-hidden wrapper").not.toBeNull();
    });
  });

  it("gives every section a heading and passes axe", async () => {
    const { container } = render(<FathomLanding />);
    const sections = container.querySelectorAll("section");
    expect(sections.length).toBe(6);
    sections.forEach((s) => {
      expect(s.querySelector("h1, h2"), s.className).not.toBeNull();
    });
    expect(await axe(container)).toHaveNoViolations();
  }, 20000);

  it("passes axe at a phone width too", async () => {
    const { container } = renderAt("narrow", <FathomLanding />);
    expect(await axe(container)).toHaveNoViolations();
  }, 20000);
});
