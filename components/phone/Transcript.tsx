import type { ReactNode } from "react";
import { Layer } from "./scene/Layer";

/** The live conversation (TranscriptView): turns on the gutter, anchored to the bottom. */
export function Transcript({ children }: { children: ReactNode }) {
  return <div className="ph-transcript">{children}</div>;
}

export interface TranscriptTurnProps {
  /** Your turns sit trailing in secondary text; fathom's lead with the accent rail. */
  who: "user" | "fathom";
  /** The overline time (an example, EXAMPLES.time). */
  time: string;
  /** An overline label before the time, in the accent (READOUT.overline: "Look Now"). */
  label?: string;
  /** The turn's words. For a turn whose words carry their own parts (a readout's items), pass children instead. */
  text?: string;
  children?: ReactNode;
  /** Beats during which the turn is shown. Omit for always. */
  show?: string;
}

/**
 * One turn: the overline (label and time), then the text. A turn arrives
 * whole, as TranscriptView appends it: it fades in and settles up. Word by
 * word is the stage headline's (Words), which follows speech.
 */
export function TranscriptTurn({ who, time, label, text, children, show }: TranscriptTurnProps) {
  const body = text ?? children;
  return (
    <Layer show={show} className={`ph-turn ph-turn-${who}`}>
      <span className="ph-turn-meta">
        {label ? <span className="ph-turn-label">{label}</span> : null}
        <span className="ph-turn-time">{time}</span>
      </span>
      <p className="ph-turn-text">{body}</p>
    </Layer>
  );
}
