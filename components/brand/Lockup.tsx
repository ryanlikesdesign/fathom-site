import { LOCKUP } from "@/design-system/generated/logo-paths";
import { brandA11y } from "./a11y";

export interface LockupProps {
  /** Rendered height in CSS px (the mark's height); the width follows. */
  height: number;
  /** Accessible name. Omit when the surrounding link or text names it. */
  label?: string;
  className?: string;
  /** Classes for the mark alone, e.g. a text color: it fills with currentColor. */
  markClassName?: string;
  /** Classes for the word alone. */
  wordClassName?: string;
}

/**
 * Mark and word together, drawn from the design system's one-path lockup.
 * The two halves are separate paths so each can take its own color; with
 * no classes both follow currentColor, the mono lockup.
 */
export function Lockup({ height, label, className, markClassName, wordClassName }: LockupProps) {
  const width = Number(((height * LOCKUP.width) / LOCKUP.height).toFixed(2));
  return (
    <svg
      viewBox={LOCKUP.viewBox}
      width={width}
      height={height}
      fill="currentColor"
      focusable="false"
      className={className}
      {...brandA11y(label)}
    >
      <path d={LOCKUP.markD} fill="currentColor" fillRule={LOCKUP.fillRule} className={markClassName} />
      <path d={LOCKUP.wordD} fill="currentColor" fillRule={LOCKUP.fillRule} className={wordClassName} />
    </svg>
  );
}
