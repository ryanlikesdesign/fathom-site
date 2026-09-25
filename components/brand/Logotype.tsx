import { LOGOTYPE } from "@/design-system/generated/logo-paths";
import { brandA11y } from "./a11y";

export interface LogotypeProps {
  /** Rendered height in CSS px; the width follows the drawing's proportions. */
  height: number;
  /** Accessible name. Omit when the surrounding link or text names it. */
  label?: string;
  className?: string;
}

/** The word fathom, lowercase, in currentColor. */
export function Logotype({ height, label, className }: LogotypeProps) {
  const width = Number(((height * LOGOTYPE.width) / LOGOTYPE.height).toFixed(2));
  return (
    <svg
      viewBox={LOGOTYPE.viewBox}
      width={width}
      height={height}
      fill="currentColor"
      focusable="false"
      className={className}
      {...brandA11y(label)}
    >
      <path d={LOGOTYPE.d} fillRule={LOGOTYPE.fillRule} />
    </svg>
  );
}
