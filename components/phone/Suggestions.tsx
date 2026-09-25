import type { ReactNode } from "react";
import { STARTERS } from "@/lib/app-facts";
import { Glyph } from "./Glyph";
import { Layer } from "./scene/Layer";
import { TouchIndicator } from "./TouchIndicator";

export interface SuggestionsProps {
  /** Beats during which the strip is shown. Omit for always. */
  show?: string;
  className?: string;
  children: ReactNode;
}

/** The suggestion strip above the composer, on the footer's ground. */
export function Suggestions({ show, className, children }: SuggestionsProps) {
  return (
    <Layer show={show} className={className ? `ph-suggest ${className}` : "ph-suggest"}>
      <div className="ph-suggest-rows">{children}</div>
    </Layer>
  );
}

export interface SuggestionRowProps {
  label: string;
  /** A fathom plus feature: the "Plus" badge. */
  plus?: boolean;
  /** Beats during which the row is shown. Omit for always. */
  show?: string;
  /** Beats in which a finger taps the row. */
  touch?: string;
  className?: string;
}

/** One suggestion chip (SuggestionRow): the label, a Plus badge when it applies, arrow.up.right. */
export function SuggestionRow({ label, plus = false, show, touch, className }: SuggestionRowProps) {
  return (
    <Layer show={show} className={className ? `ph-chip ${className}` : "ph-chip"}>
      <span className="ph-chip-label">{label}</span>
      {plus ? <span className="ph-chip-plus">{STARTERS.plusBadge.value}</span> : null}
      <Glyph name="arrow-up-right" className="ph-chip-arrow" />
      {touch ? <TouchIndicator show={touch} /> : null}
    </Layer>
  );
}
