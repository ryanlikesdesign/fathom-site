import type { CSSProperties } from "react";

export type OrbMood = "idle" | "listening" | "working" | "speaking";

export interface OrbProps {
  /** The mood in a still. In a scene, set the `orb` channel instead. */
  mood?: OrbMood;
  /** 128 (size-orb, the conversation stage) or 120 (an activity's own orb). */
  size?: 128 | 120;
}

/*
 * AssistantOrbIndicator, drawn on a canvas 1.3x the orb so moving rings are
 * never cropped: rings at 100%, 84% and 68% of the radius (strokes 1.7, 2.0,
 * 2.3 at 128; opacity 34%, 55%, 78%), a core 22/130 of the size in a 30%
 * glow, and an orbit dot (11/130) for working. In units where the orb's
 * radius is 50. Motion lives in phone.css: idle breathes (4s), listening
 * pulls the rings in (2.2s, 0.32s apart), speaking pushes them out (1.9s,
 * 0.3s apart), working spins the dot (1.2s). A still is the app's Reduce
 * Motion frame: every ring at rest.
 */
const RINGS = [
  { r: 50, stroke: 1.33, o: 0.34 },
  { r: 42, stroke: 1.56, o: 0.55 },
  { r: 34, stroke: 1.8, o: 0.78 },
];
const CORE_R = 8.46;
const DOT_R = 4.23;

export function Orb({ mood = "idle", size = 128 }: OrbProps) {
  return (
    <span className="ph-orb" data-mood={mood} data-size={size} aria-hidden="true">
      <span className="ph-orb-halo" />
      <svg className="ph-orb-svg" viewBox="-65 -65 130 130" focusable="false">
        {RINGS.map((ring, i) => (
          <circle
            key={ring.r}
            className="ph-orb-ring"
            r={ring.r}
            strokeWidth={ring.stroke}
            style={{ "--o": ring.o, "--i": i } as CSSProperties}
          />
        ))}
        <circle className="ph-orb-core" r={CORE_R} />
        <g className="ph-orb-orbit">
          <circle r={50 + DOT_R} fill="none" />
          <circle cy={-50} r={DOT_R} />
        </g>
      </svg>
    </span>
  );
}
