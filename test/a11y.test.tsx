import type { JSX } from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { axe } from "jest-axe";

// The redeem page reads the request and the code database on the server;
// both are stubbed so it renders its "found" state for a fixed id. posthog-js
// is stubbed so the redeem panel's on-demand analytics load never reaches the
// network from a test.
vi.mock("posthog-js", () => ({ default: { init: vi.fn(), capture: vi.fn() } }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "vitest" }),
}));
vi.mock("@/lib/promoDb", () => ({
  findBySlug: async (slug: string) =>
    slug === "stub"
      ? { code: "A1B2C3", slug, status: "reserved", offerName: "Outreach", durationLabel: "3 months free", shortLabel: "3 mo" }
      : null,
  markOpened: async () => undefined,
  trackQuietly: async () => undefined,
}));

import Home from "@/app/page";
import SupportPage from "@/app/support/page";
import FeedbackPage from "@/app/feedback/page";
import ReleaseNotesPage from "@/app/release-notes/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import AccessibilityPage from "@/app/accessibility/page";
import NotFound from "@/app/not-found";
import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";
import RedeemPage from "@/app/promo/r/[id]/page";

const stubError = Object.assign(new Error("stub"), { digest: "stub-digest" });

const pages: [string, () => JSX.Element | Promise<JSX.Element>][] = [
  ["Home", Home],
  ["Support", SupportPage],
  ["Feedback", FeedbackPage],
  ["ReleaseNotes", ReleaseNotesPage],
  ["Privacy", PrivacyPage],
  ["Terms", TermsPage],
  ["Accessibility", AccessibilityPage],
  ["NotFound", NotFound],
  ["Error", () => <ErrorPage error={stubError} reset={() => {}} />],
  ["GlobalError", () => <GlobalError error={stubError} reset={() => {}} />],
  ["Redeem", () => RedeemPage({ params: Promise.resolve({ id: "stub" }), searchParams: Promise.resolve({}) })],
];

describe("accessibility", () => {
  it.each(pages)("%s has no axe violations", async (_name, Page) => {
    const { container } = render(await Page());
    // One level-one heading per page is a promise the accessibility statement
    // makes. Read from the document: GlobalError renders its own <html> and
    // <body>, which React 19 binds to the document's singletons.
    expect(document.querySelectorAll("h1").length).toBe(1);
    expect(await axe(container)).toHaveNoViolations();
  });
});
