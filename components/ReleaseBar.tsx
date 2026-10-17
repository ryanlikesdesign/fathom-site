import { RELEASES, releaseId, versionName } from "@/lib/releases";

// The latest release, in one line, at the top edge of the plane that rides
// up over the homepage hero. Version and anchor come from RELEASES, so the
// bar follows the release notes; the summary is written for the release it
// names and must be rewritten with the next one (RELEASE_BAR.version guards
// that in test/release-bar.test.tsx). A plain link, not next/link: Link's
// prefetch schedules a timer, and the homepage's scenes promise none at rest
// (test/scrolly.test.tsx).
export const RELEASE_BAR = {
  version: "1.3.0",
  summary: "One conversation for asking, looking and getting around. Hazards have sounds, and fathom remembers what you tell it.",
  link: "Read the release notes",
};

export function ReleaseBar() {
  const latest = RELEASES[0];
  const short = versionName(latest.version);
  return (
    <aside className="release-bar" aria-labelledby="release-bar-title">
      <div className="release-bar-inner">
        <h2 id="release-bar-title" className="release-bar-title">New in fathom {short}</h2>
        <p className="release-bar-text">{RELEASE_BAR.summary}</p>
        <a href={`/release-notes#${releaseId(latest.version)}`} className="release-bar-link">
          {RELEASE_BAR.link}
          <span className="sr-only"> for version {short}</span>
        </a>
      </div>
    </aside>
  );
}
