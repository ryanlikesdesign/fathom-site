"use client";

import type { CSSProperties, ReactNode } from "react";
import { useOnAtRest } from "./context";

export interface LayerProps {
  /** Space-separated beat ids the layer is on for. Omit for always on. */
  show?: string;
  /**
   * "fade" (default): the kit hides the layer while it is off (.ph-layer).
   * "flag": the layer stays drawn and data-on is only a state its own CSS
   * reads (a checkbox that unchecks, a list that shifts).
   */
  mode?: "fade" | "flag";
  as?: "div" | "span" | "li" | "p";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Part of a screen that comes and goes with the beats. The engine toggles
 * data-on as beats change; the server renders it as the resting frame needs.
 */
export function Layer({ show, mode = "fade", as: Tag = "div", className, style, children }: LayerProps) {
  const on = useOnAtRest(show);
  if (show === undefined) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }
  const classes = [mode === "fade" ? "ph-layer" : null, className].filter(Boolean).join(" ") || undefined;
  return (
    <Tag className={classes} style={style} data-show={show} data-on={on ? "" : undefined}>
      {children}
    </Tag>
  );
}
