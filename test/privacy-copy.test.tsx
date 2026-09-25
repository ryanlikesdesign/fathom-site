import type { JSX } from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import { FAQ, faqAnswerText } from "@/lib/faq";
import { BRITISH_SPELLINGS, EM_DASH, LEGAL_RETIRED, expectNoMatch, words } from "./helpers/copy-rules";

// The privacy policy is checked against the fathom app, not against its own
// earlier text. Each expected value below is copied from project-homer with
// its source, so this suite fails when the site drifts from what the app
// tells people before they agree to Cloud AI.

function textOf(Page: () => JSX.Element): string {
  const { container, unmount } = render(<Page />);
  const text = words(container.textContent ?? "");
  unmount();
  return text;
}

const privacyAnswer = () => {
  const item = FAQ.find((it) => it.q === "Is my camera data private?");
  if (!item) throw new Error("The FAQ lost its privacy question.");
  return words(faqAnswerText(item));
};

describe("privacy policy matches the app", () => {
  it("states what Google keeps in the consent screen's own words", () => {
    // CloudConsentView.swift, disclosureText: the retention sentence. Only
    // the consent screen says it in the app; this page quotes it, never
    // paraphrases it. If the app's sentence changes, this one changes with it.
    const retention =
      "Google uses this to answer you, and doesn’t use it to improve its products. " +
      "Google keeps it for a limited time, only to check for misuse.";
    expect(textOf(PrivacyPage)).toContain(words(retention));
  });

  it("says when voice leaves the phone the way the app does", () => {
    // CloudConsentView.swift disclosureText and the microphone purpose string.
    const text = textOf(PrivacyPage);
    expect(text).toContain("In Live mode, your voice is sent too, while the microphone is on.");
    expect(text).toContain("What you say is turned into text on your phone, and only the text is sent.");
  });

  it("says the GPS location is never sent", () => {
    // NSLocationWhenInUseUsageDescription, project.pbxproj.
    expect(textOf(PrivacyPage)).toContain("It never sends your GPS location.");
  });

  it("names the analytics switch the app has", () => {
    // SettingsView.swift, the Subscription & Privacy card.
    expect(textOf(PrivacyPage)).toContain("turn off the switch called Share anonymous usage data");
  });

  it("says pictures go every few seconds, not only when asked", () => {
    // ModelRouter.swift restNarrationInterval: 15, 8 or 5 seconds by
    // awareness level, 7 in a task, down to 3 near a Go destination.
    expect(textOf(PrivacyPage)).toContain(
      "While Lookout, Go, or a task is running, fathom sends one every few seconds, even when you haven't asked anything.",
    );
  });

  it("does not promise usage data can never identify anyone", () => {
    // Replay is unmasked (FathomAnalytics.swift) and About you shows the Name
    // field (MemorySettingsView.swift), so a recording can carry the name.
    const text = textOf(PrivacyPage);
    expect(text).not.toMatch(/connect it back to you/);
    expect(text).toContain("The screen recordings and the text you type can still show your name");
  });

  it("does not suggest that no names reach Google", () => {
    // PromptContextBuilder.swift withholds profile.name only; household and
    // guide dog names are sent with Send profile to AI on.
    const text = textOf(PrivacyPage);
    expect(text).not.toMatch(/leaves the name in your profile out/);
    expect(text).toContain("fathom leaves your own name out of what it sends with each request.");
  });

  it("adds Google's legal-disclosure purpose after the consent screen's words", () => {
    // ai.google.dev/gemini-api/terms, Paid Services: logged for abuse
    // detection "and any required legal or regulatory disclosures".
    expect(textOf(PrivacyPage)).toContain("also let it keep this data when the law requires it.");
  });

  it("names the consent pop-up's buttons the way the app does", () => {
    // CloudConsentView.swift: titleText, allowTitle, declineTitle, readTitle.
    const text = textOf(PrivacyPage);
    expect(text).toContain("a pop-up asks: Allow cloud AI?");
    expect(text).toContain("choose the Allow cloud AI button");
    expect(text).toContain("the Keep fathom on-device button");
    expect(text).toContain("choose the Read it to me button");
    // Nothing is spoken when it appears (CloudConsentSpeech).
    expect(text).toContain("Nothing is read aloud when the pop-up appears.");
  });

  it("says only Live mode connects to Google directly", () => {
    // GeminiRESTProvider.proxyURL builds every REST URL on gemini-rest; Live
    // connects with a one-use token from live-token (LiveTokenSource.swift).
    const text = textOf(PrivacyPage);
    expect(text).toContain("Everything except Live mode goes from your phone to fathom's own backend");
    expect(text).toContain("a short-lived key that works for one connection");
    expect(text).not.toMatch(/Most requests go/);
  });

  it("states the backend retention periods the scheduled deletes enforce", () => {
    // project-homer supabase/migrations/0008_retention.sql: usage rows before
    // the start of last UTC month (daily); rate-limit counts and challenges
    // older than 1 hour (hourly, so under two hours); sessions once expired
    // (daily). Supabase's own logs: 1 day on the Free plan.
    const text = textOf(PrivacyPage);
    expect(text).toContain(
      "Usage records are kept for the current month and the month before, then deleted.",
    );
    expect(text).toContain(
      "The counts of how often each install number asks, and the one-time codes, are deleted within two hours.",
    );
    expect(text).toContain("The 30-day pass is deleted within a day after it runs out.");
    expect(text).toContain("which include your phone's internet address, are kept for one day.");
    // The App Attest key is not pruned (a deleted row strands the install).
    expect(text).toContain("The App Attest security key has no end date");
    // The old line promised nothing checkable.
    expect(text).not.toMatch(/only as long as needed/);
  });

  it("states PostHog's retention for fathom's plan", () => {
    // Paid plan: events 7 years, not shortenable
    // (posthog.com/docs/data/events-retention); recordings 30 days (project
    // setting on both PostHog projects).
    const text = textOf(PrivacyPage);
    expect(text).toContain(
      "PostHog keeps usage data, including text you typed and your internet address, for seven years.",
    );
    expect(text).toContain("PostHog keeps screen recordings for 30 days.");
  });

  it("says PostHog stores the internet address, not only sees it", () => {
    // PostHog keeps the client IP with every event for the 7-year event
    // retention (posthog.com/docs/privacy/data-storage).
    const text = textOf(PrivacyPage);
    expect(text).toContain("PostHog does store your phone's internet address with it");
    expect(text).toContain("PostHog stores the address with the usage data");
    expect(text).toContain(
      "PostHog keeps visit and click data, including your browser and device details and your internet address, for seven years.",
    );
    expect(text).not.toMatch(/PostHog can use it to estimate/);
  });

  it("limits the promo-link deletion to fathom's own record", () => {
    // The backend's scheduled cleanup clears the promo link's browser details
    // and recipient note. RedeemActions.tsx also sends promo_link_opened and
    // promo_redeem_clicked to PostHog, which keeps them 7 years.
    const text = textOf(PrivacyPage);
    expect(text).toContain(
      "fathom's own record of your browser's details, and any note about who the code is for, are deleted 30 days after the offer ends.",
    );
    expect(text).toContain("PostHog also receives which code the link is for");
    expect(text).not.toMatch(/For a fathom plus code link, your browser's name/);
  });

  it("lists the attestation log and its 30 days", () => {
    // The backend logs each App Attest setup attempt and keeps the log 30 days.
    const text = textOf(PrivacyPage);
    expect(text).toContain(
      "The log of attempts to set up the App Attest security key, which can include the key's identifier, is deleted after 30 days.",
    );
  });

  it("says turning news off deletes the notification token", () => {
    // push-register v3 (deployed 2026-09-24) deletes the row on optedIn:false;
    // NotificationKind.announcementServerNote says the same in the app.
    const text = textOf(PrivacyPage);
    expect(text).toContain(
      "Turning News from fathom off stops announcements and deletes the token and those details.",
    );
    expect(text).not.toMatch(/marked as off/);
    // push-broadcast deletes a token only on an APNs 410 / BadDeviceToken
    // reply to a real send, so a removed app's token waits for one.
    expect(text).toContain(
      "If you remove fathom without turning it off, the token is deleted the next time we send that phone an announcement",
    );
    expect(text).not.toMatch(/kept only while News from fathom is on/);
  });

  it("claims processor terms only where they are in force", () => {
    // Names only the providers whose data processing terms are in force today.
    // Evidence: the private app repo, docs/privacy/SITE-PRIVACY-SOURCES.md.
    const text = textOf(PrivacyPage);
    expect(text).toContain(
      "Google, Supabase, and Resend handle this data for us under data processing terms",
    );
    expect(text).toContain("PostHog and Vercel handle it under their own terms of service.");
    expect(text).not.toMatch(/at least as well as this policy/);
    for (const name of ["Google (Gemini AI)", "Supabase", "PostHog", "Vercel", "Resend", "Apple"]) {
      expect(text).toContain(name);
    }
  });

  it("drops the problems 1.3 fixed", () => {
    // NarrationInstructions.swift: only Lookout's app-text instruction can be
    // put in a Gemini context cache; personal context and a Go or task goal
    // never are (ContextCachePrivacyTests).
    // FathomDataArchive.swift: both deletes remove the pre-1.3 .migrated and
    // .bak copies (FathomDataEraserFileTests).
    const text = textOf(PrivacyPage);
    expect(text).not.toMatch(/up to an hour/);
    expect(text).not.toMatch(/before updating stays on your phone/);
  });
});

describe("legal pages and the FAQ use the app's current words", () => {
  const pages: [string, () => string][] = [
    ["privacy policy", () => textOf(PrivacyPage)],
    ["terms", () => textOf(TermsPage)],
    ["FAQ privacy answer", privacyAnswer],
  ];

  // The rules live in test/helpers/copy-rules.ts, shared with every
  // marketing surface. The legal pages get only these three, unchanged.
  it.each(pages)("the %s drops claims 1.3 no longer makes", (_name, read) => {
    expectNoMatch(read(), LEGAL_RETIRED);
  });

  it.each(pages)("the %s has no em dashes or British spellings", (_name, read) => {
    expectNoMatch(read(), [EM_DASH, BRITISH_SPELLINGS]);
  });
});
