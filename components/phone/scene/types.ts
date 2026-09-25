/* ================================================================
   Scenes: a phone screen as a short, timed sequence of beats.

   A scene is a list of beats. Each beat has an id, how long it holds, and
   the channels it sets. The LAST beat is the resting frame: what the
   server renders, what reduced motion and Pause motion show, and where a
   played scene stops. The FIRST beat is the opening frame the scene waits
   on until its screen is on show; it sets every channel the scene uses.

   Channels are small state words the engine writes on the screen root as
   data attributes (`set: { mic: "listening" }` becomes data-mic="listening"),
   and the kit's CSS draws them: the mic, the orb, the stage glow, the
   transcript toggle. Channels are cumulative: a beat only names what
   changes. Everything else a beat shows is a Layer (./Layer.tsx), which
   names the beats it is on for.

   Pure data and pure functions: no React, no DOM. See README.md.
   ================================================================ */

export interface Beat {
  /** Unique within the scene. Written as data-beat on the screen root. */
  readonly id: string;
  /** How long the beat holds before the next one, in ms. The last beat rests; its ms is ignored. */
  readonly ms: number;
  /** Channels this beat changes (data-<name> on the root). Beat 0 sets every channel the scene uses. */
  readonly set?: Readonly<Record<string, string>>;
}

export interface Scene {
  readonly beats: readonly Beat[];
  /** The resting beat's id: the last beat. */
  readonly rest: string;
}

/**
 * How long every finger-tap beat holds, in every scene. At least the
 * TouchIndicator's ring (--ph-tap in phone.css: press plus settle, 555ms),
 * so the ring finishes before what the tap does appears, and one length
 * everywhere so every phone's taps keep the same pace.
 */
export const TAP_MS = 600;

/** Attribute names the engine and the kit already use; a channel can't take one. */
const RESERVED = new Set(["beat", "scene", "screen", "show", "on", "words", "who", "mood", "size"]);
const CHANNEL = /^[a-z][a-z-]*$/;
const BEAT_ID = /^[a-z][a-z0-9-]*$/;

/**
 * Builds a scene, and throws on a mistake the page would otherwise show as
 * a frozen or half-drawn phone: no beats, a repeated or malformed id, a
 * negative hold, a channel with a reserved or malformed name, or a channel
 * that beat 0 does not set (the opening frame would inherit the resting
 * frame's value).
 */
export function defineScene(beats: readonly Beat[]): Scene {
  if (beats.length === 0) throw new Error("defineScene: a scene needs at least one beat.");
  const ids = new Set<string>();
  const channels = new Set<string>();
  for (const beat of beats) {
    if (!BEAT_ID.test(beat.id)) throw new Error(`defineScene: beat id "${beat.id}" must be lowercase words and hyphens.`);
    if (ids.has(beat.id)) throw new Error(`defineScene: beat "${beat.id}" appears twice.`);
    ids.add(beat.id);
    if (!(beat.ms >= 0)) throw new Error(`defineScene: beat "${beat.id}" needs a hold of 0 ms or more.`);
    for (const key of Object.keys(beat.set ?? {})) {
      if (!CHANNEL.test(key) || RESERVED.has(key)) throw new Error(`defineScene: "${key}" can't be a channel name.`);
      channels.add(key);
    }
  }
  const first = beats[0].set ?? {};
  for (const key of channels) {
    if (!(key in first)) throw new Error(`defineScene: beat "${beats[0].id}" must set channel "${key}", the opening frame.`);
  }
  return { beats, rest: beats[beats.length - 1].id };
}

/** Every channel's value at beat `index`, merged from beat 0. */
export function channelsAt(scene: Scene, index: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i <= index && i < scene.beats.length; i++) Object.assign(out, scene.beats[i].set);
  return out;
}

/** Channels as root attributes: { mic: "idle" } becomes { "data-mic": "idle" }. */
export function channelAttributes(channels: Record<string, string>): Record<`data-${string}`, string> {
  const out: Record<`data-${string}`, string> = {};
  for (const [k, v] of Object.entries(channels)) out[`data-${k}`] = v;
  return out;
}

/** True when a space-separated beat list names `beat`. */
export function beatIn(show: string, beat: string): boolean {
  return show.split(/\s+/).includes(beat);
}

/** Time from the opening frame to the resting frame, in ms. */
export function sceneLength(scene: Scene): number {
  return scene.beats.slice(0, -1).reduce((sum, b) => sum + b.ms, 0);
}
