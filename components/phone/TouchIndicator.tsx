"use client";

import { useOnInSceneAtRest } from "./scene/context";

/**
 * A soft finger-tap ring: where "the person" taps in a scene. Decorative,
 * drawn inside the control it taps (which must be position: relative),
 * and only ever on during its beats: never in a still or a resting frame.
 */
export function TouchIndicator({ show }: { show: string }) {
  const on = useOnInSceneAtRest(show);
  return <span className="ph-touch" aria-hidden="true" data-show={show} data-on={on ? "" : undefined} />;
}
