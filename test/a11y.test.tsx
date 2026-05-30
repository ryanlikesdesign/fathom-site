import type { JSX } from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import Home from "@/app/page";
import SupportPage from "@/app/support/page";
import FeedbackPage from "@/app/feedback/page";
import ReleaseNotesPage from "@/app/release-notes/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";

const pages: [string, () => JSX.Element][] = [
  ["Home", Home],
  ["Support", SupportPage],
  ["Feedback", FeedbackPage],
  ["ReleaseNotes", ReleaseNotesPage],
  ["Privacy", PrivacyPage],
  ["Terms", TermsPage],
];

describe("accessibility", () => {
  it.each(pages)("%s has no axe violations", async (_name, Page) => {
    const { container } = render(<Page />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
