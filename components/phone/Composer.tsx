import type { ReactNode } from "react";
import { COMPOSER, READOUT } from "@/lib/app-facts";
import { Glyph } from "./Glyph";
import { TouchIndicator } from "./TouchIndicator";

export type MicState = "idle" | "listening" | "end";
export type SessionControl = "none" | "pause" | "resume" | "readout";

export interface ComposerProps {
  /** The mic in a still. In a scene, set the `mic` channel ("idle" | "listening" | "end") instead. */
  mic?: MicState;
  /** Row 2: nothing (its space kept), Pause, Resume, or the readout transport. */
  session?: SessionControl;
  /** A <Suggestions> strip, drawn above the controls on the same ground. */
  suggestions?: ReactNode;
  micTouch?: string;
  typeTouch?: string;
  moreTouch?: string;
  /** Beats in which a finger taps the session control (Pause, Resume, or the transport's Pause). */
  sessionTouch?: string;
  /** Beats in which a finger taps the readout transport's backward control. */
  backTouch?: string;
}

/**
 * AssistantFooterControls: Type, the mic and More on one 252pt row, and
 * the session control on the row beneath. The mic never moves; row 2
 * keeps its space when empty. Every control carries a word but the mic.
 */
export function Composer({
  mic = "idle",
  session = "none",
  suggestions,
  micTouch,
  typeTouch,
  moreTouch,
  sessionTouch,
  backTouch,
}: ComposerProps) {
  return (
    <div className="ph-footer">
      {suggestions}
      <div className="ph-controls">
        <div className="ph-cluster">
          <span className="ph-ctl">
            <span className="ph-ctl-disc">
              <Glyph name="keyboard" />
              {typeTouch ? <TouchIndicator show={typeTouch} /> : null}
            </span>
            <span className="ph-ctl-label">{COMPOSER.type.value}</span>
          </span>
          <span className="ph-mic" data-mic={mic}>
            <span className="ph-mic-glow" />
            <span className="ph-mic-face ph-mic-speak">
              <Glyph name="mic" />
            </span>
            <span className="ph-mic-face ph-mic-send">
              <Glyph name="arrow-up" />
            </span>
            <span className="ph-mic-face ph-mic-end">
              <span className="ph-mic-stop" />
              <span>{COMPOSER.end.value}</span>
            </span>
            {micTouch ? <TouchIndicator show={micTouch} /> : null}
          </span>
          <span className="ph-ctl">
            <span className="ph-ctl-disc">
              <Glyph name="plus" />
              {moreTouch ? <TouchIndicator show={moreTouch} /> : null}
            </span>
            <span className="ph-ctl-label">{COMPOSER.more.value}</span>
          </span>
        </div>
        <div className="ph-session" data-session={session}>
          {session === "pause" || session === "resume" ? (
            <span className="ph-session-button">
              <Glyph name={session === "pause" ? "pause" : "play"} />
              <span>{session === "pause" ? COMPOSER.pause.value : COMPOSER.resume.value}</span>
              {sessionTouch ? <TouchIndicator show={sessionTouch} /> : null}
            </span>
          ) : null}
          {session === "readout" ? (
            <>
              <span className="ph-session-icon">
                <Glyph name="backward" />
                {backTouch ? <TouchIndicator show={backTouch} /> : null}
              </span>
              <span className="ph-session-button">
                <Glyph name="pause" />
                <span>{READOUT.pause.value}</span>
                {sessionTouch ? <TouchIndicator show={sessionTouch} /> : null}
              </span>
              <span className="ph-session-icon">
                <Glyph name="forward" />
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
