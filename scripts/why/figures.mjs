// The figures of reel 2, drawn as curves (bez.mjs cuts them into the pool's
// arcs and lines): the guide dog, the two hands, the long cane, the profiles,
// the ridge. Each is a reduction of the real thing at its real proportions,
// one stroke system (--why-stroke, and the emphasis weight for the rigid
// handle), ink for what is near, soft for what is behind.
import { parsePath } from "./bez.mjs";

/** sample a path into a polygon (for occlusion tests) */
export function samplePath(d, n = 14) {
  const pts = [];
  for (const s of parsePath(d)) {
    if (s.type === "L") { pts.push(s.p); continue; }
    for (let i = 0; i < n; i++) {
      const t = i / n, v = 1 - t;
      pts.push([0, 1].map((k) => v * v * v * s.p0[k] + 3 * v * v * t * s.p1[k] + 3 * v * t * t * s.p2[k] + t * t * t * s.p3[k]));
    }
  }
  return pts;
}
export function insidePoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ================================================================ the guide dog
// A Labrador in profile, walking right in harness. Local units: the withers
// at the origin, 208 to the ground (the breed's proportions: about as long
// from the point of the shoulder to the point of the buttock as it is tall,
// the chest down to the elbow at half the height, a level back, a neck of
// medium length rising at 45 degrees, a broad skull with a moderate stop and
// a muzzle as long as the skull, the ear set back and hanging close to the
// cheek, the otter tail thick at the root and no longer than the hock). The
// near side is one contour, in named runs, each ending where the next begins:
// the topline, the rump and the near hind leg (the buttock, the back of the
// thigh to the point of the hock, the rear pastern, the foot, then the front
// of the pastern, the gaskin and the stifle up to the flank), the underline
// (a Labrador's short tuck), the near foreleg standing under the withers, the
// forechest and the throat, the head, the crest of the neck. The far legs
// (soft) show only where the near ones leave them room: the far foreleg
// reaching ahead of the near one, the far hind leg under the loin.
export const DOG = {
  H: 208,
  body: [
    ["back", "M 0 0 C -36 3 -80 3 -110 2 C -124 2 -138 5 -148 12"],
    // the near hind leg, one open stroke (an S, never an I): the rump rounding over the point of the
    // buttock, the back of the thigh drawing in to the gaskin, out again to the point of the hock (about
    // 45% of the leg's height), the rear pastern near vertical, the paw rounded at the heel and the toes;
    // then up the front of the pastern, the hock's angle, and the stifle's one convex curve forward and
    // up into the flank, where it stops: the underline meets it there, below its end, so the thigh lies
    // over the belly and never closes into a slab
    ["hind leg", "M -148 12 C -158 18 -166 30 -166 46 C -166 68 -156 88 -151 104 C -148 116 -153 134 -162 146 C -165 152 -165 158 -163 166 C -160 176 -158 186 -157 194 C -156 202 -153 208 -147 208 L -134 208 C -127 208 -125 203 -128 198 C -133 190 -137 178 -138 166 C -139 154 -132 142 -120 132 C -108 122 -98 114 -97 102 C -96.5 97 -97.5 93 -99 89"],
    // the underline: out of the thigh in one gentle tuck, then level along the chest floor to the elbow
    ["belly", "M -100 104 C -86 104 -72 107 -56 109 C -36 111 -12 112 8 113 C 12 113 14 114 16 116"],
    // the near foreleg: the elbow's point under the brisket, the back of the forearm straight down to the
    // carpal pad, the pastern breaking a little forward at the carpus (about 20% up), the paw with its
    // heel and its toes; then up the front of the pastern and the forearm to the point of the shoulder
    ["foreleg", "M 16 116 C 18 119 19 124 19 130 C 19 144 19 155 18 163 C 17 167 17 171 19 175 C 22 184 25 192 29 198 C 30 203 32 208 38 208 L 51 208 C 57 208 59 204 57 199 C 55 190 52 180 50 170 C 49 152 49 130 51 112 C 53 98 58 86 66 76"],
    ["chest", "M 66 76 C 74 66 77 52 80 42 C 86 24 98 6 112 -8"],
    ["head", "M 112 -8 C 128 -14 146 -20 160 -24 C 168 -26 174 -32 175 -40 C 176 -48 172 -54 166 -56 C 156 -58 146 -60 136 -62 C 130 -68 122 -76 110 -78 C 98 -80 88 -76 82 -70"],
    ["neck", "M 82 -70 C 60 -56 34 -24 0 0"],
  ],
  nose: [163, -59, 13, 10, 4.5],
  eye: [126, -62, 3.2],
  mouth: "M 173 -33 C 166 -31 157 -30 149 -30 C 145 -30 142 -29 140 -26",
  ear: "M 90 -72 C 104 -66 112 -50 112 -32 C 112 -21 106 -14 98 -16 C 88 -19 84 -40 86 -64",
  // the otter tail: thick at the root, tapering, carried level
  tail: "M -148 12 C -168 14 -192 20 -214 30 C -221 33 -220 40 -212 39 C -192 37 -174 35 -162 33",
  farFore: "M 53 112 C 64 136 76 162 86 184 C 90 193 96 197 99 202 C 101 207 98 208 94 208 L 80 208 C 74 208 72 204 72 199 C 67 184 59 168 51 154",
  // the far hind leg, in the gap the near one leaves: out of the underline (joined to it), the far stifle,
  // the gaskin back to the hock, the pastern and the paw, and up its rear until the near thigh covers it
  farHind: "M -78 108 C -72 118 -72 130 -80 140 C -88 150 -92 158 -92 168 C -92 180 -90 192 -88 200 C -87 205 -90 208 -95 208 L -106 208 C -111 208 -112 204 -110 199 C -108 188 -108 176 -111 164 C -114 154 -121 146 -130 141",
  // the harness: one strap loop over the back just behind the withers, round the barrel to behind the
  // elbow (its two edges, bowed with the ribs); the chest strap from its top down across the point of the
  // shoulder to the forechest; the ring where the handle clips on, high on the loop where they meet
  girth: ["M -20 1 C -25 36 -19 76 -8 111", "M -8 1 C -13 36 -7 76 4 112"],
  chest: ["M -6 18 C 20 26 48 40 77 50", "M -5 32 C 20 40 46 54 70 64"],
  ring: [-13, 25],
};

// ================================================================ hands
// Both hands are drawn at life size against the dog (the dog is the
// subject: the hands sit quieter), in local units with the wrist at the
// origin and the hand pointing +x, the thumb's side up (-y). Each is one
// closed contour the forearm carries on past the wrist: the back of the hand
// to the knuckles, the knuckle line round the front of the fist as one
// gentle curve, the curled fingers' underside and the heel of the palm back
// to the wrist; the thumb laid over the top; the fingers' two folds on the
// front. No scallops: the fist is a closed form, not a row of bumps.
const fistOutline = "M 0 -10 C 10 -12 22 -16 30 -19 C 35 -21 40 -20 42 -16 C 44 -8 44.5 4 43 11 C 41.5 17 36 21 29 21 C 22 21 14 18 8 15 C 5 13 2 11 0 10";
// the thumb lies along the side of the fist, from its root behind the knuckles forward over the folded
// index finger to its tip on the finger's middle joint: the line that makes a closed hand read as a fist
const fistThumb = "M 7 -9 C 15 -9 24 -8 31 -6 C 35 -5 38 -3 38 0";
// the folded fingers' two divisions on the front of the fist, under the thumb's tip: index from middle, middle from ring
const fistFingers = ["M 44.2 3.5 C 41.5 4 39.2 5.2 37.6 7", "M 43 11.5 C 40.4 12 38.2 13.2 36.6 15"];
// The near hand: closed round the harness handle's crossbar (it runs into
// the page, inside the fist); the handle's rod leaves the fist under the
// curled little finger and runs down to the harness, so the hand reads as
// holding something, never as a mitten and never with a bar through it.
export const FIST = {
  outline: fistOutline,
  thumb: fistThumb,
  fingers: fistFingers,
  // where the handle's rod leaves the fist (local)
  grip: [32, 21],
  base: [[0, -11], [0, 11]],
};
// The far hand on the long cane, the same fist (the two read as one
// person's hands), closed round the cane's grip, which runs through it near
// square to the hand: the grip's top shows above the knuckles, the thumb
// wraps it, and the shaft leaves the fist under the little finger on the
// grip's own axis. The grip is the cane's wider end, a slightly flared
// cylinder, continuous with the shaft.
export const CANE_FIST = {
  outline: fistOutline,
  thumb: fistThumb,
  // the two finger segments wrapping the front of the grip
  fingers: fistFingers,
  // the grip's axis crosses the fist here (local), in the palm behind the folded fingers
  through: [27, 1],
  // the grip: its half-width at the top and at the fist's underside, how far its top end stands above
  // the fist's outline, and how far under the fist it narrows into the shaft
  grip: { w0: 4, w1: 4.6, above: 11, taper: 18 },
  base: [[0, -11], [0, 11]],
};

// ================================================================ the people (F14)
// A head in profile, facing +x, in units of its height (100 from the crown to
// the chin), the eye at the origin: the forehead, the brow, the nose's bridge
// and tip, the two lips, the chin, under the jaw and the throat; the hair's
// silhouette over the skull to the nape, the ear, the eye's lid; the neck, the
// collar, the shoulder and the chest running out of the frame.
export const HEAD = {
  face: `M 9 -36 C 13 -30 15 -20 15 -12 C 15 -9 14 -7 13 -5 C 16 2 21 10 25 15 C 26 17 25 19 22 20
    C 20 21 18 20 16 21 C 17 24 19 26 19 28 C 18 29 17 30 15 30.5 C 17 31.5 18 33 17 35
    C 16 37 13 38 13 40 C 13 44 16 48 15 51 C 14 54 10 56 5 56 C -2 56 -7 57 -10 60 C -10 68 -9 78 -8 88`,
  // hers: a smaller, lifted nose, fuller lips, a softer chin, a slimmer neck
  faceB: `M 9 -36 C 13 -30 15 -20 15 -12 C 15 -9 14 -7 13 -5 C 15 1 19 8 22 13 C 23.5 15.5 23 18 20 19
    C 18 19.5 17 19.5 16 20 C 17 23 19.5 25 19.5 27.5 C 19 29 17.5 30 15.5 30.5 C 18 31.5 19 33.5 17.5 35.5
    C 16 37.5 13 38 13 40 C 13 44 15 47 14 50 C 13 53 9 55 4 55 C -2 55 -6 56 -8 59 C -8 68 -7 78 -6 88`,
  ear: "M -18 -5 C -24 -8 -30 -4 -30 5 C -30 15 -26 21 -20 21 C -17 21 -15 19 -15 16",
  lid: "M 5 -2 C 7 -3 10 -2 11 0",
  // short hair: its mass over the skull to the nape, the hairline from the forehead to the sideburn
  short: "M 9 -36 C 5 -47 -13 -54 -31 -52 C -48 -50 -58 -36 -58 -16 C -58 0 -54 12 -47 21 C -42 30 -40 60 -40 86",
  shortLine: "M 9 -36 C 2 -33 -5 -27 -9 -19 C -11 -13 -12 -9 -13 -6",
  // hair drawn back into a bun: the hairline over the temple and the top of the ear, the pull of the hair toward the bun
  long: "M 9 -36 C 4 -48 -16 -54 -32 -52 C -48 -50 -58 -36 -58 -18 C -58 0 -54 14 -48 21 C -43 30 -41 60 -41 86",
  longLine: "M 9 -36 C 0 -32 -7 -25 -11 -17 C -14 -11 -20 -10 -27 -10 C -32 -10 -36 -7 -38 -3",
  pull: "M -4 -30 C -18 -37 -32 -39 -46 -35",
  bun: [-59, -36, 13],
  collar: "M -40 84 C -30 92 -18 94 -8 90",
  // a bust, cropped where every figure is cropped (r2.mjs: one crop line across the frame): the shoulder
  // rounding over into the upper arm, the chest sweeping forward; their ends meet the crop, never a lone line
  shoulder: (crop) => `M -40 84 C -54 88 -68 92 -82 97 C -104 105 -118 ${Math.min(crop, 124)} -122 ${crop}`,
  chest: (crop) => `M -8 90 C -4 ${90 + (crop - 90) * 0.4} 4 ${90 + (crop - 90) * 0.75} 10 ${crop}`,
};

// ================================================================ the ridge (F17)
// The hero's horizon, risen. Level at both ends at the hero's own horizon
// height (y 340: the line the lede sat on in the first viewport), it runs
// the pane's full width behind the glasses: soft outside the frames, ink
// through the lenses, broken only where the rims cover it. A long, slow rise
// to one rounded foothill through the left lens, a saddle behind the bridge,
// the climb easing at a shoulder, then one crisp summit set off center (68%
// of the pane, in the right lens's upper third), a steeper fall with a small
// spur, and back to level. Long, short, long: a real range seen from afar.
export const RIDGE_Y0 = 340;
export const RIDGE_PATH = `M -80 340 L 40 340
  C 80 340 120 322 160 316 C 185 312 205 314 228 320 C 255 327 282 330 306 326
  C 330 322 350 307 368 297 C 378 292 386 290 392 288 C 398 285 404 279 410 272
  C 420 282 432 293 446 300 C 452 302.5 456 301.5 462 303 C 482 310 500 330 522 337
  C 530 339.5 538 340 548 340 L 760 340`;
export const SUMMIT = [410, 272];
/** the ridge as straight runs: sampled finely, then simplified to within tol (the summit kept exact) */
export function ridgeStations(tol = 0.2) {
  const pts = samplePath(RIDGE_PATH, 60);
  pts.push([760, RIDGE_Y0]);
  // Douglas-Peucker, keeping the summit
  const keep = new Set([0, pts.length - 1]);
  let si = 0, sd = 1e9;
  pts.forEach((p, i) => { const d = Math.hypot(p[0] - SUMMIT[0], p[1] - SUMMIT[1]); if (d < sd) { sd = d; si = i; } });
  pts[si] = [...SUMMIT];
  keep.add(si);
  const dp = (a, b) => {
    let m = -1, md = tol;
    for (let i = a + 1; i < b; i++) {
      const [x1, y1] = pts[a], [x2, y2] = pts[b], [x, y] = pts[i];
      const L = Math.hypot(x2 - x1, y2 - y1) || 1e-9, d = Math.abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1)) / L;
      if (d > md) { md = d; m = i; }
    }
    if (m >= 0) { keep.add(m); dp(a, m); dp(m, b); }
  };
  dp(0, si); dp(si, pts.length - 1);
  return [...keep].sort((x, y) => x - y).map((i) => pts[i]).filter((p, i, arr) => i === 0 || p[0] > arr[i - 1][0] + 0.5);
}
