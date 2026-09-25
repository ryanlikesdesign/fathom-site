"use client";

import { Fragment, type CSSProperties } from "react";
import { useOnAtRest } from "./scene/context";

export interface WordsProps {
  /** The whole line. It lays out at full size from the start; only the words' opacity changes. */
  text: string;
  /** Beats during which the words are shown, revealed one by one. Omit for plain text. */
  show?: string;
  /** Wait before the first word, in ms (a line that follows another). */
  delay?: number;
}

/**
 * A line revealed word by word, the way the app's headline follows speech
 * (AssistantHeadlineView). The whole line is in the DOM from the start, so
 * the box never grows and a test reads it as one string ([data-words]).
 */
export function Words({ text, show, delay }: WordsProps) {
  const on = useOnAtRest(show);
  const words = text.split(" ");
  const style = delay ? ({ "--ph-words-delay": `${delay}ms` } as CSSProperties) : undefined;
  return (
    <span className="ph-words" data-words="" data-show={show} data-on={show !== undefined && on ? "" : undefined} style={style}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 ? " " : null}
          <span className="ph-w" style={{ "--i": i } as CSSProperties}>
            {word}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
