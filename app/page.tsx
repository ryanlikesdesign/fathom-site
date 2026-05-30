import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { ModeCard } from "@/components/ModeCard";
import { ContactForm } from "@/components/ContactForm";

const modes = [
  { name: "Snapshot", description: "One tap describes the space around you — what's ahead, left, right, and any signs or landmarks." },
  { name: "Lookout", description: "Always-on awareness. Fathom watches the path and speaks only when something matters. Silence means it's clear." },
  { name: "Go", description: "Turn-by-turn indoor navigation. Say where you're headed and Fathom reads signs and calls turns until you arrive." },
  { name: "Task", description: "Real-time, step-by-step guidance for a task in front of you — like finding a specific door or item." },
];

const features = [
  "On-device AI vision and depth sensing at 10fps",
  "Haptic feedback in under 100ms",
  "Spatial audio with distinct earcons for each state",
  "Works without a network connection",
  "No beacons, maps, or building setup",
  "Clock-face directions — \"door at 2 o'clock\"",
];

export default function Home() {
  return (
    <>
      <Section labelledBy="hero-h" className="text-center">
        <h1 id="hero-h" className="font-display text-5xl sm:text-6xl">Navigate any building. Your first time in.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          Fathom is an AI companion for blind and low-vision people. It sees what's ahead and guides you where
          you're going, straight from your iPhone — no maps, no beacons, no setup.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button href="#early-access" variant="primary" size="xl">Request early access</Button>
          <Button href="#modes" variant="secondary" size="xl">See how it works</Button>
        </div>
      </Section>

      <Section labelledBy="gap-h" className="bg-[var(--bg-subtle)]">
        <h2 id="gap-h" className="font-display text-4xl">Indoor navigation is still unsolved</h2>
        <p className="mt-4 max-w-3xl text-lg text-[var(--text-secondary)]">
          GPS dies the moment you step inside. The tools that try to fill the gap need pre-built maps most
          buildings don't have, or a sighted person on the other end. Fathom needs neither. It's a full sensory
          companion — for getting around, understanding a space, and finishing the task you came to do.
        </p>
      </Section>

      <Section labelledBy="modes-h">
        <h2 id="modes-h" className="font-display text-4xl">Four ways to use it</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {modes.map((m) => <ModeCard key={m.name} {...m} />)}
        </ul>
      </Section>

      <Section labelledBy="features-h" className="bg-[var(--bg-subtle)]">
        <h2 id="features-h" className="font-display text-4xl">Built to be trusted</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <li key={f} className="flex gap-3 text-[var(--text-secondary)]">
              <span aria-hidden="true">—</span><span>{f}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="a11y-h">
        <h2 id="a11y-h" className="font-display text-4xl">Accessibility isn't a setting. It's the design.</h2>
        <p className="mt-4 max-w-3xl text-lg text-[var(--text-secondary)]">
          High-contrast visuals, large targets, and full VoiceOver support are the starting point, not an
          afterthought. Fathom is built low-vision-first, by a designer who navigates the world with impaired
          vision. Every signal reaches you three ways — sight, sound, and touch.
        </p>
      </Section>

      <Section labelledBy="early-access" className="bg-[var(--bg-subtle)]">
        <h2 id="early-access" className="font-display text-4xl">Request early access</h2>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          Fathom launches summer 2026. Join the TestFlight beta and lock in founding-member pricing.
        </p>
        <div className="mt-8 max-w-md">
          <ContactForm formType="early-access" />
        </div>
      </Section>
    </>
  );
}
