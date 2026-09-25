import type { ReactNode } from "react";
import { Glyph, type GlyphName } from "./Glyph";
import { Layer } from "./scene/Layer";

/**
 * The plan card's steps (AssistantPlanCard): one card; rows number
 * themselves. Rows given beats arrive one after another (.ph-stagger).
 */
export function PlanSteps({ show, children }: { show?: string; children: ReactNode }) {
  return (
    <Layer show={show} className="ph-plan ph-stagger">
      {children}
    </Layer>
  );
}

export interface PlanStepRowProps {
  /** The mode's glyph in the shared glyph column (AssistantStepMode.iconName: Go is location-fill). */
  glyph: GlyphName;
  text: string;
  /** The mode's name (PLAN.stepModes). */
  mode: string;
  /** Beats during which the row is shown. Omit for always. */
  show?: string;
}

/**
 * One step: its number (a CSS counter in mono-sm, so no stray digit sits
 * in the DOM), the mode glyph, the description and the mode name.
 */
export function PlanStepRow({ glyph, text, mode, show }: PlanStepRowProps) {
  return (
    <Layer show={show} className="ph-planstep">
      <span className="ph-plan-n" />
      <span className="ph-plan-glyph">
        <Glyph name={glyph} />
      </span>
      <span className="ph-plan-text">
        <span className="ph-plan-desc">{text}</span>
        <span className="ph-plan-mode">{mode}</span>
      </span>
    </Layer>
  );
}
