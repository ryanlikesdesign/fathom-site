import type { ReactNode } from "react";
import { Glyph } from "./Glyph";
import { Layer } from "./scene/Layer";
import { Words } from "./Words";

export type HeadlineSize = "lg" | "md" | "sm";

/** AssistantHeadlineView's rule: title-lg under 26 characters, title-md under 58, title-sm beyond. */
export function headlineSize(line: string): HeadlineSize {
  const length = [...line].length;
  if (length < 26) return "lg";
  if (length < 58) return "md";
  return "sm";
}

export interface StageProps {
  /** The glow behind the stage in a still. In a scene, set the `glow` channel instead. */
  glow?: "none" | "listening" | "speaking";
  /**
   * An activity's stage (ConversationScreen.stageContent): the headline at
   * the top, s6 down, and the activity card filling the room below it.
   * Without it the stage fills the room and centers its content.
   */
  top?: boolean;
  children: ReactNode;
}

/**
 * The middle of the conversation screen (ConversationStage): the orb and
 * the headline centered in the room between the header and the footer,
 * over a soft glow while a voice channel is live.
 */
export function Stage({ glow = "none", top = false, children }: StageProps) {
  return (
    <div className={top ? "ph-stage ph-stage-top" : "ph-stage"}>
      <span className="ph-glow" data-glow={glow} aria-hidden="true" />
      <div className="ph-stage-group">{children}</div>
    </div>
  );
}

export interface StageHeadlineProps {
  /** The state word, drawn only when there is a separate headline (the app's rule). */
  eyebrow?: string;
  headline: string;
  /** One quiet line under the headline ("Tap anywhere to stop"). */
  subline?: string;
  /** Beats during which the headline arrives word by word, as speech reaches it. */
  reveal?: string;
  /** The eyebrow's tint follows the orb's: accent, or hazard for an error. */
  tone?: "accent" | "hazard" | "muted";
}

/** The eyebrow, the headline sized by its length, and the subline. */
export function StageHeadline({ eyebrow, headline, subline, reveal, tone = "accent" }: StageHeadlineProps) {
  return (
    <div className="ph-headline">
      {eyebrow ? (
        <p className="ph-eyebrow" data-tone={tone}>
          {eyebrow}
        </p>
      ) : null}
      <p className={`ph-hl ph-hl-${headlineSize(headline)}`}>{reveal ? <Words text={headline} show={reveal} /> : headline}</p>
      {subline ? <p className="ph-subline">{subline}</p> : null}
    </div>
  );
}

/** stop.circle.fill at the stage's top right while fathom speaks. */
export function StopControl({ show }: { show?: string }) {
  return (
    <Layer as="span" show={show} className="ph-stop">
      <Glyph name="stop-circle-fill" />
    </Layer>
  );
}

/**
 * ActivityCard: the room under an activity's stage (Lookout, Go, a Task in
 * Live mode). No surface in Dark and Light; under Contrast Boost, its one
 * concession to a box, a hairline edge on the raised ground (phone.css).
 * Each activity lays out its own content inside it.
 */
export function ActivityCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className ? `ph-activity ${className}` : "ph-activity"}>{children}</div>;
}

/**
 * Children laid in one grid cell, so states can cross-fade without moving
 * anything. Directly inside .ph-body it fills the room, and each child is a
 * view (a stage, a transcript) that takes the whole of it.
 */
export function Stack({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className ? `ph-stack ${className}` : "ph-stack"}>{children}</div>;
}
