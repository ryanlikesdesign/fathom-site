/* ================================================================
   The essay's formations: one pool of pieces draws the whole page, from
   the phone seeing in the dark to the summit through the glasses.

   The drawings are the art director's refined storyboard ("Faithful
   artifacts", refined), drawn in scripts/why (r1.mjs, r2.mjs; gen.mjs
   matches every drawing onto one pool), generated into
   pieces.generated.ts (node scripts/why/gen.mjs && node
   scripts/why/convert.mjs) and decoded here. This file adds what the
   page decides: when each formation lands and holds (anchors in the
   page's sentences), which still it draws on the static page, and which
   pocket it ends on a phone.

   The story, in one reel:
     hero      F01 the phone sees a night street, F02 the far sign pulled
               into focus, F03 a room mapped in depth, F04 every piece
               gathered into the orb (300, 400, R 150), F05 a feed of
               identical cards with the orb buried, F05s the feed scrolling
               with the reader's own scroll, 1:1.
     arrives   F06 the desk CCTV, F07 the portable, F08 the DOS laptop,
               F09 Windows and ZoomText's lens, F10 the first smartphone.
     ceiling   F11 the line of progress lifted into the ceiling.
     pace      F12 F03's room re-targeted as a hallway in the viewfinder,
               F12a..d the reticle re-targets pair by pair: the hallway
               racks down into the menu, then the camera pans subject to
               subject (menu, curb, hallway, street).
     pivot     V13 the hallway collapses into its vanishing point, the orb
               back at F04's place and size; F13 its rings re-space onto
               the mark's bands; F13x the exact brand mark takes over (the
               pieces fade as one layer under it). The pivot's iris opens
               out of the mark (WhyDirector, pivot.ts).
     people    R2 the pieces come back under the mark, R2o the mark relaxes
               into the hero's orb in place, listening (a phone's people
               band rises as it), F14 the orb moves between two people who
               stream out of it, F14b their feedback travels in.
     hands     F15 a cane in one hand, a harness in the other: a Labrador
               in profile, the handle in the near fist, the long cane in
               the far hand, running past the dog's nose to the ground
               ahead of it; F16 the glasses that free them; F17 the
               horizon risen into the summit through the lenses. Each
               hand-over is figure by figure (the people into the hands
               and the dog, the dog and the hands into the lenses).
   ================================================================ */

import type { Anchor } from "../../engine";
import type { Formation, MorphSource, PhoneVariant, PocketRun, PoolPiece, TraceSpec, ViaZone } from "../formation";
import type { Fill, PieceKind, PieceSpec, Role } from "../pieces";
import { GEOM, POOL, type PackedFormation } from "./pieces.generated";

/* ---------------------------------------------------------------- *
 * Decoding the generated geometry
 * ---------------------------------------------------------------- */

const ROLE: Record<string, Role> = { i: "ink", s: "soft", a: "accent", g: "ghost" };
const FILL: Record<string, Fill> = { i: "ink", a: "accent", n: "navy", g: "glass" };

/** One packed piece: "nums|look" into a spec of its pool kind. */
export function decodePiece(kind: PieceKind, packed: string): PieceSpec {
  const [numsPart, look = "i"] = packed.split("|");
  const n = numsPart.trim().split(/\s+/).map(Number);
  const m = /^([isag])(?:F([iang]))?(?:W([\d.]+))?(?:B([\d.]+))?(?:O([\d.]+))?(P)?$/.exec(look);
  if (!m) throw new Error(`why/essay: bad look "${look}"`);
  const lk = {
    role: ROLE[m[1]],
    fill: m[2] ? FILL[m[2]] : ("none" as Fill),
    weight: m[3] !== undefined ? Number(m[3]) : 1,
    band: m[4] !== undefined ? Number(m[4]) : 0,
    o: m[5] !== undefined ? Number(m[5]) : 1,
    ...(m[6] ? { parked: true } : {}),
  };
  if (kind === "rect") return { kind, x: n[0], y: n[1], w: n[2], h: n[3], r: n[4] ?? 0, rot: n[5] ?? 0, ...lk };
  if (kind === "line") return { kind, x1: n[0], y1: n[1], x2: n[2], y2: n[3], ...lk };
  return { kind, cx: n[0], cy: n[1], r: n[2], a0: n[3], a1: n[4], ...lk };
}

/** A move's traced contours: "poolIndex i|o start len end;..." (in: drawn by this formation; out: leaving it). */
function decodeTrace(packed: string): Record<string, TraceSpec> {
  const out: Record<string, TraceSpec> = {};
  for (const entry of packed.split(";")) {
    const [k, phase, a, b, e] = entry.trim().split(/\s+/);
    const id = POOL[Number(k)].id;
    const seg = [Number(a), Number(b), e === "1" ? 1 : 0] as const;
    out[id] = { ...out[id], [phase === "i" ? "in" : "out"]: seg };
  }
  return out;
}

/** A packed list, laid over `base`: what the formation changed since the one before. */
function decodeList(packed: string, base: Readonly<Record<string, PieceSpec>>): Record<string, PieceSpec> {
  const out: Record<string, PieceSpec> = { ...base };
  if (!packed) return out;
  for (const entry of packed.split(";")) {
    const space = entry.indexOf(" ");
    const i = Number(entry.slice(0, space));
    const p = POOL[i];
    out[p.id] = decodePiece(p.kind, entry.slice(space + 1));
  }
  return out;
}

export const ESSAY_POOL: readonly PoolPiece[] = POOL.map((p) => ({ id: p.id, kind: p.kind, clip: p.clip || undefined }));

/* ---------------------------------------------------------------- *
 * Timing: where each formation lands and holds
 * ---------------------------------------------------------------- */

/** The hero pins on the stage while its abilities play: x svh into its runway. */
const hero = (offset: number): Anchor => ({ at: "hero-run", edge: "top", line: 1, offset });
/**
 * Where a move may run, relative to the reading line (engine.ts LINE, 60%
 * down the viewport). A formation holds until the last line of its text
 * has risen well clear of the reading line (leave: its bottom edge at
 * READ + d, 47% down, about 115px above the line on a 900px window), so a
 * move never starts while that sentence is still being read; the next
 * formation is complete once the next text's first line has come up to
 * READ - d (enter, 39%): the move runs while the gap between the two
 * passes the reader's eye, and each one runs over 120px or more of scroll
 * (test/why/morph-continuity.test.ts).
 */
const READ = 0.45;
const leave = (at: string, d = 0.02): Anchor => ({ at, edge: "bottom", line: READ + d });
const enter = (at: string, d = 0.06): Anchor => ({ at, edge: "top", line: READ - d });
/** svh scrolled since the pivot stage's top reached the bottom of the viewport. */
const pivot = (d: number): Anchor => ({ at: "pivot-stage", edge: "top", line: 1, offset: d });
/**
 * The four pairs pin on the stage this far down the viewport (why.css
 * --why-frame-top); svh scrolled since the list pinned. Their anchors are
 * natural positions (the director measures pinned blocks where the flow
 * put them), so the pinned list keys its steps to its own runway: 96svh.
 */
export const FRAME_TOP = 0.32;
const pairs = (d: number): Anchor => ({ at: "pace-pairs", edge: "top", line: FRAME_TOP, offset: d });
/**
 * The five eras never pin: the list is plain flow beside the sticky pane, its eras about 106px apart at
 * 1440 x 900 (two lines and the list's unit step). Each machine is whole as its era's first line comes up
 * to ERA_LAND, just under the reading line, so it is there before the era is read, and holds while the
 * era crosses the reading line; the move into the next runs over ERA_MOVE svh (81px at 1440 x 900) as the
 * next era rises to its own landing. Without a pin a list this tight cannot give every machine both a
 * hold and the 120px the page's other moves take (test/why/morph-continuity.test.ts allows the eras 80px).
 * The reading tie keeps each machine level with its era's line as the list passes (WhyDirector Leader).
 */
export const ERA_LAND = 0.56;
export const ERA_MOVE = 9;
const eraLand = (n: number): Anchor => ({ at: `era-${n}`, edge: "top", line: ERA_LAND });

/**
 * The pivot's stage on the desktop (why.css --why-pivot-stage, 220svh: it
 * rises 100svh, pins, and its section leaves from 220, about a third of a
 * screen after the line is built, and the line stays in view while it
 * goes: the hold, without a long stretch of the same frame). The returning orb
 * holds while "at the same speed, not a decade behind." leaves the reading
 * line; then, on the run-out, its rings re-space onto the mark's band
 * centerlines and widen to the bands (PIVOT_RESPACE - 18 to PIVOT_RESPACE),
 * and the exact mark takes over (to PIVOT_MARKED), once the pace section's
 * edge has passed above the mark, so the brand mark first rests on one
 * ground. It holds still before the iris opens out of it (PIVOT_IRIS,
 * WhyDirector measurePivot).
 */
export const PIVOT_STAGE = 220;
export const PIVOT_RESPACE = 68;
export const PIVOT_MARKED = 76;
export const PIVOT_IRIS = 84;
/**
 * After the pivot: the exact mark holds at full strength for as long as the pinned line is read, and the
 * pieces come back under it (a crossfade, nothing moving) only once the section starts to leave
 * (PIVOT_STAGE), over PIVOT_HANDBACK svh; the mark relaxes into the orb the moment that ends, so no
 * approximation of the mark ever rests on screen. The navy is still behind the mark then, so the pieces
 * come back in its on-accent colors and turn to ink as its edge passes them (MorphStage draws them twice).
 * test/why/morph-continuity.test.ts checks it on the measured page.
 */
export const PIVOT_HANDBACK = 2;
export const PIVOT_RELEASE = PIVOT_STAGE + PIVOT_HANDBACK;

/**
 * The hands' two hand-overs are matched cuts, part by part: the strokes of the drawing that leaves travel
 * whole into the strokes at the same place in the drawing that arrives (gen.mjs warp: each figure's box
 * mapped onto its counterpart's, the near person onto the hands and the arms, the far one onto the dog;
 * the dog onto the right lens, the hands onto the left), sweeping across the frame left to right so only
 * a band of strokes is ever in flight. Only what the next drawing has no place for folds away first, into
 * where it belongs (the dog's legs up into its underline, a face's small features toward the face, the
 * knuckles into the hands), down to three fifths of its size and no smaller (FIGURE_FLOOR), thinning as
 * it goes; what the next drawing adds opens the same way. Halfway through each move, 70% of the stroke on
 * screen is at full ink (test/why/morph-continuity.test.ts).
 */
const FIGURE_FLOOR = 0.6;
/** the dog's head (scripts/why/r2.mjs hands()): where what is left of the people folds toward by default */
const DOG_HEAD = [352, 412] as const;
/** the two fists (r2.mjs hands(): the far one on the cane's grip, the near one on the handle) and their middles */
const HANDS_BOX = [
  [70, 248, 66, 64],
  [108, 356, 58, 54],
] as const;
const HAND_SINKS = [
  [101, 280],
  [137, 383],
] as const;
const HAND_KEEPS = ["hzL", "hzR", "body", "screen", "wall", "core"];
const peopleToHands = {
  trace: {},
  bend: 0,
  stagger: 0.6,
  sweep: true,
  travel: [0.15, 0.9] as const,
  slot: { body: [0.1, 0.85], screen: [0.1, 0.85], wall: [0.1, 0.85], core: [0.1, 0.85], hzL: [0.2, 0.8], hzR: [0.2, 0.8] } as Record<string, readonly [number, number]>,
  via: {
    cap: 2000,
    keep: HAND_KEEPS,
    sink: { x: DOG_HEAD[0], y: DOG_HEAD[1] },
    out: 0.25,
    in: 0.6,
    zones: [
      // leaving: what each person says folds into the orb; the small features draw in toward each face
      { box: [220, 330, 200, 120], phase: "out", sink: { x: 326, y: 398 }, focus: true, floor: FIGURE_FLOOR, window: [0, 0.25] },
      { box: [-400, 200, 640, 700], phase: "out", sink: { x: 150, y: 404 }, focus: true, floor: FIGURE_FLOOR, window: [0, 0.25] },
      { box: [400, 200, 400, 700], phase: "out", sink: { x: 484, y: 404 }, focus: true, floor: FIGURE_FLOOR, window: [0, 0.25] },
      // arriving: the dog's legs grow down out of its underline, its features and the hands' knuckles open in place
      { box: [0, 548, 460, 120], phase: "in", sink: { y: 548 }, window: [0.62, 1] },
      { box: [318, 372, 110, 80], phase: "in", sink: { x: 352, y: 412 }, focus: true, floor: FIGURE_FLOOR, window: [0.6, 1] },
      { box: HANDS_BOX[0], phase: "in", sink: { x: HAND_SINKS[0][0], y: HAND_SINKS[0][1] }, focus: true, floor: FIGURE_FLOOR, window: [0.6, 1] },
      { box: HANDS_BOX[1], phase: "in", sink: { x: HAND_SINKS[1][0], y: HAND_SINKS[1][1] }, focus: true, floor: FIGURE_FLOOR, window: [0.6, 1] },
    ] as readonly ViaZone[],
  },
};
/**
 * The hands on a phone (F15's PhoneVariant): scaled about the phone view's center (300, 400) by `scale`,
 * then moved so the far forearm's start (r2.mjs hands(): x 5) runs out of the band's left edge and the
 * drawing's middle (y 446) sits at the view's.
 */
const HANDS_SCALE = 1.2;
const HANDS_PHONE = { scale: HANDS_SCALE, shift: [-5 - (300 + (5 - 300) * HANDS_SCALE), -(446 - 400) * HANDS_SCALE] as const };
/** the glasses' lenses and bridge (r2.mjs G: the right lens's middle, mirrored; the camera in the bridge) */
const LENS_R = [445, 312] as const;
const LENS_L = [155, 312] as const;
const BRIDGE = [300, 266] as const;
/**
 * Hands to glasses, a matched cut: the identities r2.mjs pins carry each part of the frame out of the
 * part of the drawing it was, whole (they travel, turn and bend; they never shrink): the dog's torso
 * squares into the right rim (its topline the top bar, the ribcage its outer bottom corner, the forechest
 * its outer top corner, the rump its inner top corner), the far forearm into the left rim's top bar and
 * the left temple, the near forearm into the left rim's bottom bar and the lens edge inside it, the fist
 * into the left hinge, the handle into the bridge, the cane into the right temple, the ground into the
 * horizon. Every other stroke of the outline travels too, into the frame's piece nearest it (gen.mjs's
 * assignment, with the drawing's affinities). The rims and lens edges move first (slot), so at the
 * move's midpoint both lenses are already closed contours; what the glasses do not need (the legs, the
 * small details) lies down along the horizon and the frame's straight runs, whole until the last of
 * its trip (pieces.ts PieceMove.fade).
 */
const HAND_IDS = ["dBack", "dBelly", "dChest", "dRump", "armF1", "armF2", "armN1", "armN2", "fist", "handleA", "cane"];
/** where F15's parts are (r2.mjs hands(): the dog's legs under its underline, its head, the two hands) */
const DOG_LEGS = [0, 548, 460, 120] as const;
const DOG_HEAD_BOX = [318, 372, 110, 80] as const;
const handsToGlasses = {
  trace: {},
  bend: 0,
  stagger: 0.55,
  sweep: true,
  travel: [0.22, 1] as const,
  slot: { hzL: [0.25, 0.9], hzR: [0.25, 0.9] } as Record<string, readonly [number, number]>,
  via: {
    cap: 2000,
    keep: [...HAND_IDS, ...HAND_KEEPS],
    sink: { x: BRIDGE[0], y: BRIDGE[1] },
    out: 0.32,
    in: 0.55,
    zones: [
      // the legs fold up into the underline while the torso squares into the lens
      { box: DOG_LEGS, phase: "out", sink: { y: 548 }, window: [0, 0.32] },
      // the head's small details (eye, nose, mouth, the ear's fold) draw in toward the head
      { box: DOG_HEAD_BOX, phase: "out", sink: { x: 352, y: 412 }, focus: true, floor: FIGURE_FLOOR, window: [0, 0.32] },
      // the knuckles, the fingers and the grip close into the hands
      { box: HANDS_BOX[0], phase: "out", sink: { x: HAND_SINKS[0][0], y: HAND_SINKS[0][1] }, focus: true, floor: FIGURE_FLOOR, window: [0, 0.32] },
      { box: HANDS_BOX[1], phase: "out", sink: { x: HAND_SINKS[1][0], y: HAND_SINKS[1][1] }, focus: true, floor: FIGURE_FLOOR, window: [0, 0.32] },
    ] as readonly ViaZone[],
  },
};

/**
 * The viewfinder's re-targets. Into the first (the hallway to the menu) as a rack focus: the hallway
 * contracts to half its size toward the reticle's center while the menu opens out of half its size
 * there, the two overlapping (in before out), so the reticle never empties and nothing passes through
 * a point. Then, pair to pair, as a pan (ViaSpec.pan): the subject the camera leaves slides out of the
 * reticle's left edge while the next slides in from its right, both riding with the reticle, so the
 * frame is always full and nothing scales: re-aiming the same camera. The viewfinder itself (its
 * brackets, the orb, the phone) travels as one rigid unit, level with each pair's job on the stage
 * (cy: the target reticle's center, r1.mjs reticleAt); a phone's viewfinder holds still at the band's center.
 */
const PHONE_AND_ORB = ["ring1", "ring2", "ring3", "core", "body", "screen", "island", "btnA", "btnU", "btnD", "btnP", "hzL", "hzR"];
const VIEWFINDER = ["brk0", "brk1", "brk2", "brk3", "brk4", "brk5", "brk6", "brk7", "ring1", "ring2", "ring3", "core", "body", "screen", "island", "btnA", "btnU", "btnD", "btnP", "hzL", "hzR"];
const rack = (cy: number) => ({ all: true, focus: true, floor: 0.5, keep: VIEWFINDER, sink: { x: 300, y: cy }, phoneSink: { x: 300, y: 377 }, out: 0.62, in: 0.38 });
const pan = (cy: number) => ({ pan: true, cap: 2000, keep: VIEWFINDER, sink: { x: 300, y: cy }, phoneSink: { x: 300, y: 377 } });

/** F11's phone's shoulders (r1.mjs: the body at x 178..422, its top at y 170, just under the ceiling at 160): where the ceiling's halves fold in, level. */
const CEIL_SHOULDERS = [178, 422] as const;

/**
 * Leaving the viewfinder: its four brackets fold into their own corners (within the move's first quarter,
 * while the outline still holds them), and every other stroke of the subject retracts toward the orb's
 * center within that same quarter, so no loose stroke is left inside the phone while its outline rounds
 * into the orb.
 */
const corner = (ids: readonly string[], x: number, y: number) => ({ ids, phase: "out" as const, sink: { x, y }, window: [0, 0.25] as const });
const RETICLE_CLOSES = [
  corner(["brk0", "brk1"], -2000, -2000),
  corner(["brk2", "brk3"], 2600, -2000),
  corner(["brk4", "brk5"], 2600, 2800),
  corner(["brk6", "brk7"], -2000, 2800),
  { box: [-2000, -2000, 4600, 4800] as const, phase: "out" as const, sink: { x: 300, y: 400 }, window: [0, 0.25] as const },
];

/**
 * orderFirst: these pieces lead the move, ahead of the drawing's own order. sweep: the pieces move in
 * the order of where they land, left to right, so the new drawing forms across the frame figure by
 * figure and only a band of strokes is ever in flight (the hands' two reforms).
 */
type Timing = Omit<Formation, "id" | "pieces" | "phone"> & { phone?: Partial<PhoneVariant>; orderFirst?: readonly string[]; sweep?: boolean };

const TIMING: Record<string, Timing> = {
  // Hero: the text block pins for 150svh; each ability lands, then holds a little longer than it took to form.
  "F01-dark": { hold: hero(8), cue: "hero-dark", still: "hero", crop: [0, 60, 600, 700] },
  "F02-sign": { anchor: hero(22), hold: hero(38), cue: "hero-sign" },
  "F03-room": { anchor: hero(52), hold: hero(68), cue: "hero-room" },
  // The small orb merges into the core first, so the cue never points at "no connection" beside two orbs.
  "F04-orb": { anchor: hero(82), hold: hero(98), cue: "hero-ai", gather: true, orderFirst: ["ring1", "ring2", "ring3", "core"] },
  "F05-feed": { anchor: hero(112), hold: hero(128), cue: "hero-scroll" },
  // The feed scrolls with the reader's own scroll, exactly: 320 grid units of travel over 320 units of scroll.
  "F05s-scroll": { anchor: hero(150), leadUnits: 320, cue: "hero-scroll", pocket: "hero", phone: { run: 60 } },
  // Arrives: the feed holds until the hero's words have left the reading line, then folds into the
  // CCTV's screen as the section's headline arrives (its cards sink into the monitor); it holds through
  // the section's two paragraphs and the first era. Then each machine reforms into the next as the next
  // era comes up (eraLand, ERA_MOVE), and holds while that era is read.
  "F06-cctv": {
    anchor: enter("arrives-h2"),
    lead: 26,
    still: "arrives",
    crop: [0, 120, 600, 560],
    stagger: 0.3,
    bend: 0,
    // The feed's cards fold into the monitor where they lie, all of them before the ground rises under it.
    slot: { hzL: [0.12, 0.42], hzR: [0.12, 0.42] },
    via: {
      sink: { x: 300, y: 300 },
      phoneSink: { x: 303, y: 342 },
      in: 0.3,
      zones: [{ box: [-2000, -2000, 4600, 4800], phase: "out", sink: { x: 300, y: 300 }, window: [0, 0.2] }],
      phoneZones: [{ box: [-2000, -2000, 4600, 4800], phase: "out", sink: { x: 303, y: 342 }, window: [0, 0.12] }],
    },
  },
  // The monitor's housing and screen lead, squatting into the case; the CCTV's lens travels as one orb (its
  // rings and core together) down to the mouse camera; every long trip hands over in two strokes, so nothing
  // of the CCTV crosses the list as a loose fragment.
  "F07-portable": { anchor: eraLand(2), lead: ERA_MOVE, orderFirst: ["body", "screen", "ring1", "ring2", "ring3", "core"], via: { sink: { x: 300, y: 300 } } },
  "F08-dos": { anchor: eraLand(3), lead: ERA_MOVE },
  // The matched cut: the lid becomes the monitor's bezel and the trackball rises into ZoomText's lens, while
  // the rest of the laptop folds away where it lies and the desktop grows inside the screen (no stroke flies
  // from the desk into the monitor); the keyboard's keys, a short step apart, travel.
  "F09-windows": {
    anchor: eraLand(4),
    lead: ERA_MOVE,
    via: { cap: 60, capAll: true, sink: { x: 314, y: 306 }, keep: ["body", "screen", "core", "ring1", "ring2", "ring3"], out: 0.55, in: 0.35 },
  },
  // On a phone the band sits in flow above the list and never pins: each machine forms as its era comes
  // up the screen (morph/index.ts KEYED).
  // The monitor narrows into the phone and the lens drops into its orb; the desktop and the keyboard fold
  // away where they lie and the app grid grows in place.
  "F10-smartphone": {
    anchor: eraLand(5),
    lead: ERA_MOVE,
    hold: leave("era-5"),
    pocket: "arrives",
    phone: { run: "item" },
    via: { cap: 60, capAll: true, sink: { x: 300, y: 400 }, keep: ["body", "screen", "core", "ring1", "ring2", "ring3"], out: 0.55, in: 0.35 },
  },
  // "Then it stopped.": the line of progress lifts into the ceiling and holds through the ceiling section.
  // It rises first (the move's first 40%), parted by the phone while it passes it (part: it never crosses
  // the phone, either half ends on its outline), and joins again above it; its hatching stays folded flat
  // into the line, unseen, until the line has long cleared the phone's top, then unfolds over the move's
  // last 30%, above the phone, so nothing ever crosses the phone out.
  "F11-ceiling": {
    anchor: enter("beat-stop"),
    hold: leave("ceil-p"),
    still: "ceiling",
    crop: [60, 40, 480, 640],
    // On a phone the line lifts into the ceiling while the band rises into view, and the band never pins:
    // there is nothing left to play once it is up, so no empty runway under it (formation.ts "rise").
    phone: { run: "rise" },
    slot: { hzL: [0, 0.4], hzR: [0, 0.4] },
    part: { left: "hzL", right: "hzR" },
    via: { cap: 2000, sink: { y: 640 }, zones: [{ box: [-1000, 110, 2600, 52], phase: "in", sink: { y: 160 }, window: [0.7, 1] }] },
  },
  // Pace: F03's room again, re-targeted. The pairs pin while the viewfinder re-targets to each one's job, level with it.
  // The phone breaks through the ceiling: the hatching folds down into the ceiling line, the line's two halves
  // draw in to the phone's two shoulders (CEIL_SHOULDERS), where it breaks through, while the phone grows up through the gap
  // (its buttons ride with its outline; on a phone, where it turns to landscape, they fold away instead);
  // the app grid folds away where it lies and the hallway grows out of its own vanishing point, nothing
  // crossing the phone's outline. The hallway holds while the section's opening paragraph is read, and the
  // reticle lands on the menu as the pairs arrive (before they pin), so "Reading a menu" is never read
  // beside a hallway.
  "F12-hallway": {
    anchor: enter("pace-h2"),
    hold: leave("pace-p1"),
    still: "pace",
    crop: [120, 60, 360, 680],
    bend: 0,
    slot: { body: [0.12, 0.62], screen: [0.12, 0.62], island: [0.14, 0.64], btnA: [0.14, 0.64], btnU: [0.14, 0.64], btnD: [0.14, 0.64] },
    via: {
      all: true,
      sink: { x: 300, y: 340 },
      phoneSink: { x: 300, y: 392 },
      keep: PHONE_AND_ORB.filter((id) => id !== "btnP"),
      phoneKeep: ["ring1", "ring2", "ring3", "core", "body", "screen"],
      zones: [
        { ids: ["hzL"], phase: "out", sink: { x: CEIL_SHOULDERS[0], y: 160 }, focus: true, window: [0.04, 0.5] },
        { ids: ["hzR"], phase: "out", sink: { x: CEIL_SHOULDERS[1], y: 160 }, focus: true, window: [0.04, 0.5] },
        { box: [-1000, 0, 2600, 166], phase: "out", sink: { y: 160 }, window: [0, 0.15] },
      ],
      phoneZones: [
        { ids: ["hzL"], phase: "out", sink: { x: 202, y: 217.6 }, focus: true, window: [0.04, 0.5] },
        { ids: ["hzR"], phase: "out", sink: { x: 398, y: 217.6 }, focus: true, window: [0.04, 0.5] },
        { box: [-1000, 0, 2600, 221], phase: "out", sink: { y: 217.6 }, window: [0, 0.15] },
      ],
      out: 0.45,
      in: 0.22,
    },
  },
  // The reticle re-targets as one rigid shape: no stagger, no curve. Each move 14svh (over 120px), each hold
  // 18svh, longer than the move, inside the pairs' 96svh pin: the reader sees the subject, not the change.
  // Into the menu, a rack focus (rack); pair to pair, a pan (pan): the subject inside the reticle
  // (clipped to it, r1.mjs) slides out of one side as the next slides in from the other.
  "F12a-menu": { anchor: enter("pace-pairs"), hold: pairs(18), stagger: 0, bend: 0, via: rack(269) },
  "F12b-curb": { anchor: pairs(32), hold: pairs(50), stagger: 0, bend: 0, via: pan(343) },
  "F12c-hall": { anchor: pairs(64), hold: pairs(82), stagger: 0, bend: 0, via: pan(419) },
  // On a phone the band sits in flow above the pairs and never pins: the viewfinder re-targets as each
  // pair comes up the screen (morph/index.ts KEYED).
  "F12d-street": { anchor: pairs(96), hold: pairs(98), stagger: 0, bend: 0, via: pan(494), pocket: "pace", phone: { run: "item" } },
  // Once the pairs let go, the viewfinder rises with them, the street in it, to the statement that closes
  // them: one rigid move at the scroll's own pace, so the reading tie hands over from "Describing a street"
  // to "Point that tech at the right problems" and the camera is level with it while it is read. A phone's
  // viewfinder holds still in its band (the same drawing there), so a phone skips it.
  "F12e-statement": { anchor: enter("pace-p2"), hold: leave("pace-p2"), ease: "linear", stagger: 0, bend: 0, pocketSkip: true },
  // The orb returns at F04's place and size for "Then it has to keep up", and holds through it.
  // The phone's outline rounds into the orb's outer ring, its screen into the next, all in one slot, while the
  // small orb rides up into the core; the street retracts toward the orb's center and the reticle into its
  // corners in the move's first quarter, nothing crossing the rings.
  "V13-orb-returns": {
    anchor: enter("pace-p3"),
    hold: leave("pace-p3"),
    gather: true,
    // One rigid phone: the shell, its screen, its sensor and buttons and the small orb all share one slot,
    // so the outline shrinks straight onto the orb as one nested shape, never two contours sliding apart.
    slot: Object.fromEntries(
      ["body", "screen", "island", "btnA", "btnU", "btnD", "btnP", "core", "ring1", "ring2", "ring3"].map((id) => [id, [0.05, 0.75] as const]),
    ),
    via: {
      sink: { x: 300, y: 400 },
      phoneSink: { x: 300, y: 400 },
      keep: ["ring1", "ring2", "ring3", "core", "body", "screen", "island", "btnA", "btnU", "btnD", "btnP"],
      zones: RETICLE_CLOSES,
      phoneZones: RETICLE_CLOSES,
      out: 0.4,
      in: 0.35,
    },
  },
  // On the run-out into the pivot: the rings re-space onto the mark's centerlines and widen to its bands
  // (18svh, all together, no curve, at the scroll's own even pace so the reader feels the geometry change), then
  // the exact mark takes over (8svh, nothing moving).
  "F13-mark": { anchor: pivot(PIVOT_RESPACE), lead: 18, ease: "linear", stagger: 0, bend: 0 },
  "F13x-exact": { anchor: pivot(PIVOT_MARKED), lead: 8, ease: "crossfade", stagger: 0, bend: 0, layer: 0, pocket: "climax", phone: { run: 40 } },
  // After the pivot, once its section starts to leave, the pieces come back under the mark, nothing moving
  // (the pane only: a phone's band leaves with the navy, the mark in it, and the people's band rises as
  // the orb it relaxes into).
  "R2-pieces": { anchor: pivot(PIVOT_RELEASE), lead: PIVOT_HANDBACK, ease: "crossfade", stagger: 0, bend: 0, layer: 1, mark: { cx: 300, cy: 400, size: 327.27, o: 0 }, pocketSkip: true },
  // Then, straight on, the mark relaxes into the orb, in place (the hero's orb, listening); on a
  // phone the people's band rises as this orb (opens) while the pivot's band and the mark leave above it.
  "R2o-orb": { anchor: pivot(PIVOT_RELEASE + 14), lead: 14, stagger: 0, bend: 0, opens: true },
  // Out of the orb: it moves to its listening place between the two people and draws in to their scale
  // (100/84/68% of its radius) while the people draw themselves out of it, one pen line through every
  // profile from its first point (traced), nothing flying across the navy's edge. It runs over 28svh and is
  // done as the headline's first line reaches the reading line, so the headline is read beside the
  // finished people.
  "F14-people": { anchor: enter("people-h2", 0), lead: 28, ease: "settle", hold: leave("people-p1"), still: "people", via: { sink: { x: 326, y: 398 }, out: 0.45, in: 0.2 } },
  // Their voices travel in to the orb in the gap before the paragraph that says feedback comes in (why.css
  // gives it a unit step): small marks on short straight trips; then it holds through the paragraph and the
  // goal, until the goal's last line has left the reading line.
  // On a phone the people's band pins alone above their headline for 15svh: one move's worth (100px),
  // so the ground under it is never empty for long.
  "F14b-listening": { anchor: enter("people-p2"), hold: leave("people-p3", 0), pocket: "people", phone: { run: 15 } },
  // Hands, in two movements: the cane and the harness hold while their sentence is read; the wearable that
  // frees them forms in the gap before its paragraph (why.css gives that paragraph a group step: the
  // problem, then the answer) and holds through the testing paragraph; then the horizon rises into the
  // summit. Each drawing hands over figure by figure (peopleToHands, handsToGlasses), the orb travelling
  // from the listening orb to the harness ring and up to the bridge, where the glasses' camera is.
  // On a phone the people-to-hands hand-over is the hands band's entry, played while the band rises.
  // The glasses form in the gap before their paragraph (why.css gives it a movement's step: the problem,
  // then the answer) and are whole before its first line comes up to the reading line; the horizon then
  // rises into the summit in the gap before the testing paragraph, so the summit is whole, and the pane
  // still pinned, while the rest of the section and "That’s the next summit." are read.
  // On a phone the hands draw a fifth larger than the stage's, their forearms still entering from the
  // band's left edge, so they fill the band the glasses span: the band is as wide as the glasses and as
  // tall as the hands (morph/index.ts POCKET_VIEWS).
  "F15-hands": {
    anchor: enter("hands-h2", 0),
    hold: leave("hands-p1"),
    still: "hands",
    crop: [0, 150, 600, 520],
    phone: { scale: HANDS_PHONE.scale, shift: HANDS_PHONE.shift },
    ...peopleToHands,
  },
  // On a phone the hands' band is keyed (morph/index.ts KEYED): it rises as the people and reforms them into
  // the cane and the harness, holds while their paragraph is read, and reforms them into the glasses in the
  // turn before the wearable's paragraph, done as its first line reaches the reading line. The summit's band
  // then rises as these glasses, whole (morph/index.ts OPEN_WHOLE), and only lifts the ridge; as it rises,
  // the hands' band folds its glasses down into their line (KEYED fold), so one pair is whole at a time.
  "F16-wearable": { anchor: enter("hands-p2", -0.01), hold: leave("hands-p2"), pocket: "hands", ...handsToGlasses },
  // On a phone the ridge lifts through the lenses while the summit's band rises, and the band never pins:
  // "That’s the next summit." follows it a unit under it, with no empty runway between them.
  "F17-summit": { anchor: enter("hands-p3", 0.1), still: "summit", crop: [0, 186, 600, 252], phone: { run: "rise" } },
};

/** Every formation in essay order. */
export const ESSAY_ORDER = Object.keys(TIMING);

type Win = { x: number; y: number; w: number; h: number };

/** A piece's box, roughly: enough to tell whether it lies wholly outside a clip window. */
function boxOf(p: PieceSpec): Win {
  if (p.kind === "rect") return { x: p.x, y: p.y, w: p.w, h: p.h };
  if (p.kind === "line") return { x: Math.min(p.x1, p.x2), y: Math.min(p.y1, p.y2), w: Math.abs(p.x2 - p.x1), h: Math.abs(p.y2 - p.y1) };
  return { x: p.cx - p.r, y: p.cy - p.r, w: 2 * p.r, h: 2 * p.r };
}
const outside = (b: Win, w: Win) => b.x > w.x + w.w || b.x + b.w < w.x || b.y > w.y + w.h || b.y + b.h < w.y;
const sameWin = (a?: Win, b?: Win) => !!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

/**
 * A clipped piece wholly outside its formation's window is not seen. If
 * the next formation opens a different window, it would come into view
 * at once as the window moves, wherever it waits (a card scrolled off the
 * top of the feed): so while it is hidden it is also unseen (o 0), and it
 * fades in on its way to where it is drawn next.
 */
function hideClipped(pieces: Record<string, PieceSpec>, win: Win | undefined, next: Win | undefined): Record<string, PieceSpec> {
  if (!win || sameWin(win, next)) return pieces;
  const out = { ...pieces };
  for (const p of ESSAY_POOL) {
    const spec = out[p.id];
    if (p.clip && spec && outside(boxOf(spec), win)) out[p.id] = { ...spec, o: 0 };
  }
  return out;
}

/** Every piece seen in a drawing, by where it lies, left to right (its box's center). */
function sweepOrder(pieces: Readonly<Record<string, PieceSpec>>): string[] {
  return Object.entries(pieces)
    .filter(([, p]) => (p.o ?? 1) > 0 && !p.parked)
    .map(([id, p]) => {
      const b = boxOf(p);
      return [id, b.x + b.w / 2] as const;
    })
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
}

function build(): Formation[] {
  const out: Formation[] = [];
  let desk: Record<string, PieceSpec> = {};
  let own: Record<string, PieceSpec> | null = null;
  for (const id of ESSAY_ORDER) {
    const g: PackedFormation | undefined = GEOM[id];
    if (!g) throw new Error(`why/essay: no geometry for ${id}`);
    desk = decodeList(g.d, desk);
    own = g.p !== undefined ? decodeList(g.p, own ?? {}) : null;
    const { orderFirst, sweep, ...t } = TIMING[id];
    const m = g.meta;
    const move = m.move ?? {};
    const drawn = Array.isArray(move.order) ? move.order : [];
    const swept = sweep ? sweepOrder(desk) : null;
    const order = orderFirst ? [...orderFirst, ...(swept ?? drawn).filter((x) => !orderFirst.includes(x))] : (swept ?? move.order);
    const phone: PhoneVariant = {
      ...(own ? { pieces: own } : { shift: t.phone?.shift ?? m.phone.shift, scale: t.phone?.scale ?? m.phone.scale }),
      ...(m.phone.window ? { window: m.phone.window } : {}),
      run: (t.phone?.run ?? (m.phone.run as PocketRun | undefined)) ?? "section",
    };
    const nextId = ESSAY_ORDER[ESSAY_ORDER.indexOf(id) + 1];
    const nextMeta = nextId ? GEOM[nextId]?.meta : undefined;
    const pieces = hideClipped(desk, m.window, nextMeta?.window);
    const ownPieces = own ? hideClipped(own, m.phone.window ?? m.window, nextMeta?.phone.window ?? nextMeta?.window) : null;
    out.push({
      id,
      ease: (move.ease as Formation["ease"]) ?? "standard",
      stagger: move.stagger,
      bend: move.bend,
      order: order as Formation["order"],
      ...(g.tr ? { trace: decodeTrace(g.tr) } : {}),
      window: m.window,
      mark: m.mark,
      ...t,
      phone: ownPieces ? { ...phone, pieces: ownPieces } : phone,
      pieces,
    });
  }
  return out;
}

export const essay: MorphSource = { reel: "r1", pool: ESSAY_POOL, formations: build() };
