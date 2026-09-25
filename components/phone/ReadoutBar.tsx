import { READOUT } from "@/lib/app-facts";
import { Glyph } from "./Glyph";
import { Layer } from "./scene/Layer";

/** One position the bar shows during a scene, and the beats it shows it for. */
export interface ReadoutCount {
  /** fill(READOUT.counter, { n, total }): "2 of 5". */
  text: string;
  show: string;
}

export interface ReadoutBarProps {
  /**
   * The position: one string for a still ("2 of 5"), or, in a scene, each
   * position with its beats, so only the count changes as the reading moves.
   */
  counter: string | readonly ReadoutCount[];
  /** Adds "Paused" under the position. */
  paused?: boolean;
  /** Beats during which the bar is shown. Omit for always. */
  show?: string;
}

/**
 * ReadoutPlaybackBar in its compact row: Repeat, the position (with
 * "Paused" under it), the overflow menu, and the pinned Stop.
 */
export function ReadoutBar({ counter, paused = false, show }: ReadoutBarProps) {
  return (
    <Layer show={show} className="ph-readout">
      <span className="ph-readout-button">
        <Glyph name="repeat" />
      </span>
      <span className="ph-readout-position">
        {typeof counter === "string" ? (
          <span className="ph-readout-counter">{counter}</span>
        ) : (
          <span className="ph-stack ph-readout-counts">
            {counter.map(({ text, show: beats }) => (
              <Layer as="span" key={text} show={beats} className="ph-readout-counter">
                {text}
              </Layer>
            ))}
          </span>
        )}
        {paused ? <span className="ph-readout-paused">{READOUT.paused.value}</span> : null}
      </span>
      <span className="ph-readout-button">
        <Glyph name="ellipsis" />
      </span>
      <span className="ph-readout-button ph-readout-stop">
        <Glyph name="xmark" />
      </span>
    </Layer>
  );
}
