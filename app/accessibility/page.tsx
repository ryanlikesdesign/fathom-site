import Link from "next/link";
import { LEGAL_PROSE, Section } from "@/components/Section";
import { SUPPORT_EMAIL } from "@/lib/faq";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta(
  "Accessibility",
  "How this site is built for blind and low-vision readers: the WCAG 2.2 AAA target, what it was tested with, the gaps we know about, and how to tell us about one.",
  "/accessibility",
);

// Same prose rhythm as the legal pages: this is a statement, read start to
// finish, and its reader is the app's reader.
export default function AccessibilityPage() {
  return (
    <Section labelledBy="ax-h" className={LEGAL_PROSE}>
      <p className="eyebrow">Accessibility</p>
      <h1 id="ax-h" className="font-display text-5xl">Accessibility statement</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last reviewed: September 9, 2026</p>

      <p>
        Fathom is made for blind and low-vision people, and this site is held to the same
        standard as the app. It is designed and tested by people who use a screen reader and
        magnification every day, not checked for them afterward.
      </p>

      <h2>What we aim for</h2>
      <p>
        The target is WCAG 2.2 Level AAA wherever it is feasible, with Level AA as the floor on
        every page. In practice that means:
      </p>
      <ul>
        <li>
          Body text sits at 11.2:1 or better against its background, and secondary text at
          5.6:1 or better, in both the dark and light themes. Nothing is painted pure black or
          pure white.
        </li>
        <li>Every button, link, and control is at least 44 by 44 pixels.</li>
        <li>
          Color never carries a meaning on its own. State is also shown with a border, an
          underline, position, or words.
        </li>
        <li>
          Every animation has a still version. The site honors the reduce-motion setting on
          your device, and the Pause motion button in the header does the same thing for a
          device that has no such setting. When your device setting is on, that button reads
          Motion off and stays that way, because the setting wins.
        </li>
        <li>
          A dark theme and a light theme, chosen from your system setting or the Toggle theme
          button in the header, and a stronger-contrast set of colors when your system asks for
          more contrast.
        </li>
        <li>
          A skip link, one level-one heading per page, a heading on every section, a visible
          focus ring on everything you can reach with a keyboard, and no keyboard traps.
        </li>
        <li>
          Text you can scale to 200 percent and beyond without anything clipping or scrolling
          sideways.
        </li>
      </ul>

      <h2>What we tested with</h2>
      <ul>
        <li>VoiceOver on iOS and on macOS, in Safari.</li>
        <li>Keyboard only, with no pointer.</li>
        <li>200 percent browser zoom, on a phone-sized window and on a desktop.</li>
        <li>Reduce Motion turned on in the system settings, and the site&apos;s own Pause motion button.</li>
        <li>Increase Contrast on iOS and macOS, and Windows high contrast (forced colors).</li>
        <li>Automated checks with axe on every page, run with every change.</li>
      </ul>

      <h2>Known gaps</h2>
      <p>Two things fall short of AAA today. We would rather tell you than have you find them.</p>
      <ul>
        <li>
          On the home page on a desktop, the feature steps that are not in the middle of the
          window are dimmed to 28 percent while a phone mockup follows along beside them. That
          dimmed text is below the contrast target until the step scrolls to the center.
          Workaround: Reduce Motion on your device, the Pause motion button in the header,
          Increase Contrast, or Windows high contrast each show every step at full strength.
        </li>
        <li>
          The phone mockups on the home page show the app&apos;s own screens in the app&apos;s own
          colors. A few pairs inside them meet AA (4.5:1) but not AAA. They are pictures: they
          are hidden from screen readers, and everything they say is also written in the page
          text next to them.
        </li>
      </ul>

      <h2>Tell us about a problem</h2>
      <p>
        If anything on this site is hard to use with your screen reader, your magnifier, your
        keyboard, or your eyes, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or
        use the <Link href="/feedback">feedback form</Link>. Say what you were trying to do and
        what you use to browse. A person reads it and replies within a week, and the fix goes
        into the site, not into a workaround list.
      </p>
      <p>
        This statement covers fathomvision.app. Accessibility in the Fathom app itself is covered
        on the <Link href="/support">support page</Link>.
      </p>
    </Section>
  );
}
