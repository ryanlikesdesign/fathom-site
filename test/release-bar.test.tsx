import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "./helpers/axe";
import { ReleaseBar, RELEASE_BAR } from "@/components/ReleaseBar";
import { RELEASES, releaseId, versionName } from "@/lib/releases";
import { SETTINGS_NAMES } from "@/lib/app-facts";

describe("ReleaseBar", () => {
  it("names the latest release and links to its notes", () => {
    render(<ReleaseBar />);
    const latest = RELEASES[0];
    expect(screen.getByText(`New in fathom ${latest.version.replace(/\.0$/, "")}`)).toBeTruthy();
    const link = screen.getByRole("link", { name: /Read the release notes/ });
    expect(link.getAttribute("href")).toBe(`/release-notes#${releaseId(latest.version)}`);
  });

  it("is a heading, so heading navigation reaches it, and names the version the notes' heading names", () => {
    render(<ReleaseBar />);
    const latest = RELEASES[0];
    expect(screen.getByRole("heading", { level: 2, name: `New in fathom ${versionName(latest.version)}` })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Read the release notes/ }).textContent).toContain(`for version ${versionName(latest.version)}`);
  });

  it("names, in the 1.3.0 notes, only settings the app build has (lib/app-facts.ts SETTINGS_NAMES)", () => {
    const r = RELEASES.find((x) => x.version === "1.3.0")!;
    const text = [r.intro, ...(r.sections ?? []).flatMap((s) => [s.label, ...s.items])].join(" ");
    for (const f of Object.values(SETTINGS_NAMES)) expect(text, f.value).toContain(f.value);
  });

  it("has a summary written for the latest release", () => {
    // When a release is added, RELEASE_BAR.summary must be rewritten for it.
    expect(RELEASE_BAR.version).toBe(RELEASES[0].version);
  });

  it("has no axe violations", async () => {
    const { container } = render(<ReleaseBar />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
