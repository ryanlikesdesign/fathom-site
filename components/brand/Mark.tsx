import { MARK, type MarkMaster } from "@/design-system/generated/logo-paths";
import { brandA11y } from "./a11y";

/**
 * The design system's size ladder: each master is drawn on its own pixel
 * grid, so a size uses the largest master that fits it, rounding down.
 * 40 and up: the 120 master. 32 to 39: the 32. 24 to 31: the 24. Below 24: the 16.
 */
export function markMasterFor(size: number): MarkMaster {
  if (size >= 40) return 120;
  if (size >= 32) return 32;
  if (size >= 24) return 24;
  return 16;
}

export interface MarkProps {
  /** Rendered width and height in CSS px. Picks the master (see markMasterFor). */
  size: number;
  /** Accessible name. Omit when the surrounding link or text names it. */
  label?: string;
  className?: string;
}

/** The fathom mark, in currentColor. */
export function Mark({ size, label, className }: MarkProps) {
  const master = MARK[markMasterFor(size)];
  return (
    <svg
      viewBox={master.viewBox}
      width={size}
      height={size}
      fill="currentColor"
      focusable="false"
      className={className}
      {...brandA11y(label)}
    >
      <path d={master.d} fillRule={master.fillRule} />
    </svg>
  );
}
