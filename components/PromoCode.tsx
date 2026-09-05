/* ================================================================
   One offer code, rendered so it can actually be conveyed.

   A blind rep's job at this moment is to say 18 characters out loud to
   a stranger who is typing them. That requires three things the plain
   text did not give:

   1. A spelled-out reading. VoiceOver runs "338ATWNTWYA4YY3H3F"
      together into a part-word blur. Spacing the letters isn't enough
      either — B/D/E/P/T/V/Z collapse into the same phoneme across a
      noisy conference floor — so the spoken form is the NATO alphabet.
   2. That reading delivered WITHOUT `aria-label` on a paragraph, which
      ARIA prohibits (role="paragraph" takes no author name) and axe
      only ever reports as "incomplete", so it silently does nothing.
      A visually-hidden sibling works in every screen reader instead.
   3. A face that doesn't collide 0/O and 1/l/I. The display serif is
      the worst available choice for an alphanumeric string.
   ================================================================ */

const PHONETIC: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot",
  G: "Golf", H: "Hotel", I: "India", J: "Juliett", K: "Kilo", L: "Lima",
  M: "Mike", N: "November", O: "Oscar", P: "Papa", Q: "Quebec", R: "Romeo",
  S: "Sierra", T: "Tango", U: "Uniform", V: "Victor", W: "Whiskey",
  X: "X-ray", Y: "Yankee", Z: "Zulu",
  "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four",
  "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine",
};

/** "3, 3, 8, Alpha, Tango…" — for screen readers and aria-labels alike. */
export function spellCode(code: string): string {
  return code
    .split("")
    .map((c) => PHONETIC[c.toUpperCase()] ?? c)
    .join(", ");
}

export function PromoCode({
  code,
  label = "Code",
  className = "",
}: {
  code: string;
  /** Names the value, so a rotor jump doesn't land on a bare string. */
  label?: string;
  className?: string;
}) {
  return (
    <p className={`select-all font-mono text-2xl tracking-widest text-[var(--text-primary)] ${className}`}>
      <span aria-hidden="true" style={{ wordBreak: "break-all" }}>
        {code}
      </span>
      <span className="sr-only">
        {label}: {spellCode(code)}
      </span>
    </p>
  );
}
