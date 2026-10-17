// Reel 2 after the pivot: the people who shape it, your hands, the wearable, the summit.
// One rule for every drawing here: a considered reduction of the real thing,
// two weights (--why-stroke and the emphasis), ink for what is seen clearly,
// soft for what is far or behind, and the orb as the one accent. The figures
// are drawn as curves (figures.mjs), which bez.mjs cuts into the pool's arcs
// and lines, so they reform between formations like every other drawing.
import { INK, SOFT, ACC, INK2, toward, dist, insetPoly, mirrorX, chain, clipChain, yOnChain } from "./lib.mjs";
import { drawPath, place } from "./bez.mjs";
import { DOG, FIST, CANE_FIST, HEAD, RIDGE_Y0, ridgeStations, samplePath, insidePoly } from "./figures.mjs";

const OUT = 1000;

/** the listening orb, drawn by the pieces that were the mark's bands (body, screen, wall) */
export function orbR2(a, cx, cy, R, o = {}) {
  const big = R >= 90;
  const sws = [1.33, 1.56, 1.8].map((w) => (w * R) / 50);
  const lk = (i) => (big ? { ...ACC, sw: sws[i] } : ACC);
  const single = o.single ?? R < 24; // below this the three rings would blob at phone size: one ring and the core
  const radii = single ? [R, R, R] : [R, 0.84 * R, 0.68 * R];
  // rings drawn as circles (rects with r = w/2): the same pieces that were the mark's bands
  a.circ(cx, cy, radii[0], lk(0), "orb ring 1", { pin: "body" });
  a.circ(cx, cy, radii[1], lk(1), "orb ring 2", { pin: "screen" });
  a.circ(cx, cy, radii[2], lk(2), "orb ring 3", { pin: "wall" });
  const coreR = o.coreR ?? Math.max(4.4, 0.1692 * R);
  a.disk(cx, cy, coreR, "accent", "orb core", { pin: "core" });
  // the small orb's own rings stay condensed in the core all through reel 2: at its center, radius 0,
  // unseen, so nothing of them can show beside the core while it relaxes out of the mark
  [0, 1, 2].forEach((i) => a.arc(cx, cy, 0, -90, -90, { ...ACC, o: 0 }, "condensed in the core", { pin: `ring${i + 1}`, hidden: true }));
  a.parkLens(cx, cy, o.park ?? 80, "accent");
  return { coreR, radii };
}

// ================================================================ F14: the people who shape it
// Two heads in profile at eye level with the reader, talking to the orb: near
// and large on the left (Delaware, short hair), farther and smaller on the
// right (Minneapolis, hair drawn back into a bun). Each is one continuous
// profile drawn from a real head (figures.mjs HEAD), the hair's mass and its
// hairline, the ear, the lid, then the neck, the collar, a shoulder and the
// chest running out of the frame. The hero's horizon is their eye line.
const HZ2 = 404;
/** the people are cropped as busts on this line */
const CROP_Y = 660;
const PEOPLE = { L: { x: 150, y: HZ2, k: 2.0 }, R: { x: 484, y: HZ2, k: 1.42, flip: true }, orb: [326, HZ2 - 6], R0: 52 };
PEOPLE.mouthL = place(PEOPLE.L)([20, 30]);
PEOPLE.mouthR = place(PEOPLE.R)([20, 30]);
/** speech: short dashes from the mouth toward the orb, ending short of its outer ring */
function speech(a, mouth, orb, R, n, o = {}) {
  const d = dist(...mouth, ...orb), L = o.len ?? 16, gap = o.gap ?? 13, start = o.start ?? 18;
  const room = d - R - 12 - start;
  const shift = o.advance ? Math.max(0, room - (n * L + (n - 1) * gap)) : 0;
  for (let i = 0; i < n; i++) {
    const s0 = start + shift + i * (L + gap), s1 = s0 + L;
    if (s1 > d - R - 10) break;
    a.seg(toward(mouth, orb, s0), toward(mouth, orb, s1), o.look ?? SOFT, "what breaks, said to the orb");
  }
}
/** the part of a circle outside a polygon, as one arc (the bun against the head) */
function arcOutside(a, cx, cy, r, poly, lk, tag) {
  const out = [];
  for (let d = 0; d < 360; d += 2) { const t = (d * Math.PI) / 180; out.push(!insidePoly(poly, cx + r * Math.cos(t), cy + r * Math.sin(t))); }
  // the longest run of outside angles, wrapping
  let best = [0, 0];
  const i0 = out.indexOf(false);
  if (i0 < 0) return a.ring(cx, cy, r, lk, tag);
  for (let k = 0, run = null; k <= 180; k++) {
    const i = (i0 + k) % 180;
    if (out[i] && run === null) run = k;
    if ((!out[i] || k === 180) && run !== null) { if (k - run > best[1] - best[0]) best = [run, k]; run = null; }
  }
  const a0 = (i0 + best[0]) * 2 + 4, a1 = (i0 + best[1]) * 2 - 4;
  return a.arc(cx, cy, r, a0, a1, lk, tag);
}
function head(a, at, who, o = {}) {
  const xf = place(at), H = HEAD;
  const hair = o.bun ? H.long : H.short;
  drawPath(a, o.bun ? H.faceB : H.face, INK, `${who}: face`, {}, { xf });
  drawPath(a, hair, INK, `${who}: hair`, {}, { xf });
  drawPath(a, o.bun ? H.longLine : H.shortLine, INK, `${who}: hairline`, {}, { xf });
  if (o.bun) drawPath(a, H.pull, INK, `${who}: hair`, {}, { xf });
  drawPath(a, H.ear, INK, `${who}: ear`, {}, { xf });
  drawPath(a, H.lid, INK, `${who}: eye`, {}, { xf });
  if (o.bun) {
    const poly = samplePath(hair + " L 20 86 L 20 -60 Z").map(xf), c = xf(H.bun.slice(0, 2));
    arcOutside(a, c[0], c[1], H.bun[2] * at.k, poly, INK, `${who}: hair in a bun`);
  }
  drawPath(a, H.collar, INK, `${who}: collar`, {}, { xf });
  // both figures crop on one line across the frame
  const crop = (CROP_Y - at.y) / at.k;
  // the shoulder and the chest become the forearms that hold the cane and the harness (F15)
  drawPath(a, H.shoulder(crop), INK, `${who}: shoulder`, o.pins ? { pin: o.pins[0] } : {}, { xf, within: [-16, 616] });
  drawPath(a, H.chest(crop), INK, `${who}: chest`, o.pins ? { pin: o.pins[1] } : {}, { xf, within: [-16, 616] });
  return { mouth: xf([20, 30]), front: xf([15, 0]), back: xf([o.bun ? -58 : -56, 0]) };
}
function people(a, o = {}) {
  const ORB = PEOPLE.orb, R = PEOPLE.R0;
  head(a, PEOPLE.L, "Delaware");
  head(a, PEOPLE.R, "Minneapolis", { bun: true });
  // the horizon drops to the busts' crop: one base line across the frame that every bust's chest line ends on
  // (a drawn terminal, never a loose end), and that the ground of the next drawing rises out of; nothing
  // horizontal runs beside the heads
  a.line(-OUT, CROP_Y, 300, CROP_Y, SOFT, "the base line", { pin: "hzL" });
  a.line(300, CROP_Y, OUT, CROP_Y, SOFT, "the base line", { pin: "hzR" });
  orbR2(a, ...ORB, R);
  // what the hands will hold (the cane, the handle, the forearms) waits unseen in the orb's core, so it
  // draws itself out in the hands' drawing, never flying out of a stroke of these faces
  for (const pin of ["cane", "armN1", "armN2", "armF1", "armF2"]) a.line(...ORB, ...ORB, { ...ACC, o: 0 }, "waiting in the core", { pin, hidden: true });
  a.arc(...ORB, 0, -90, -90, { ...ACC, o: 0 }, "waiting in the core", { pin: "handleA", hidden: true });
  speech(a, PEOPLE.mouthL, ORB, R, 3, { advance: o.advance, start: 14 });
  speech(a, PEOPLE.mouthR, ORB, R, 2, { len: 13, gap: 11, start: 12, advance: o.advance });
  a.parkTiles(-60, CROP_Y, 660, CROP_Y, 14, 24, SOFT, "tiled into the base line");
}

// ================================================================ F15: a cane in one hand, a harness in the other
// Side elevation, walking right, cropped to what the sentence names. The dog
// is the subject: a Labrador in profile in its harness (figures.mjs DOG),
// large and low in the frame, with room ahead of it. The handler is out of
// the picture to the left: both forearms come in from the pane's left edge at
// one height, each out of its sleeve's cuff, and part there like a V: the near
// arm (ink) runs on nearly level to the fist closed round the harness handle,
// whose rod runs down at its own angle to the ring high on the strap loop; the
// far arm (soft: it is behind) rises to the fist closed round the long cane's
// grip, the grip's top above the fist and the shaft on its axis, steeply down
// behind the dog's neck and out ahead of its chest to the roller tip on the
// ground ahead of its front paws. The cane and the handle part from the two
// fists and never cross; the cane is cut wherever the dog covers it.
// The orb, the one accent, is the harness's ring.
const GND = 640;
const DOGAT = { x: 236, y: GND - DOG.H * 0.9, k: 0.9 };
/** the hands at life size against the dog (the dog is the subject) */
const HK = 1.12;
/**
 * The two arms come in from the pane's left edge, the far one above the near one, and reach for what each
 * hand holds: `y0` where the forearm's axis crosses the pane's edge, `deg` its heading (negative rises),
 * `len` from the cuff to the wrist (a little over twice the fist's width), `w` its half-width at the cuff.
 */
/**
 * the near arm, low: the handle's rod rises from the ring at `handleDeg` for `handle` into the fist, and the
 * forearm comes in to that fist from the pane's edge at y0, a little rising
 */
const NEAR = { y0: 410, handle: 104, handleDeg: 42, w: 16 };
/**
 * the far arm, high: above the near one at the pane's edge, rising at about 30 degrees to the fist closed
 * round the cane's grip, the wrist turned so the grip runs square through the fist (its top above the
 * knuckles); the cane's heading on screen
 */
const FAR = { y0: 340, deg: -28, len: 76, w: 15, cane: 46 };
/** where the cuff stands from the pane's edge (stage units), and how much wider the sleeve is than the arm */
const CUFF_X = 14;
const SLEEVE = 5;
/** the gap the cane leaves at the dog's outline where it passes behind it (stage units) */
const CANE_TUCK = 7;
/** the orb is the harness ring (DOG.ring): its radius */
const HANDS_ORB_R = 10;
function dog(a, at = DOGAT) {
  const D = DOG, xf = place(at), P = (x, y) => xf([x, y]), k = at.k;
  for (const [part, d] of D.body) drawPath(a, d, INK, `dog: ${part}`, {}, { xf, tol: 0.9 });
  // the nose: the leather outlined at the line weight, a rounded rect on the muzzle's tip
  const [nx, ny, nw, nh, nr] = D.nose, nc = P(nx + nw / 2, ny + nh / 2);
  a.rectC(nc[0], nc[1], nw * k, nh * k, nr * k, INK, "dog: nose");
  const e = P(D.eye[0], D.eye[1]);
  a.disk(e[0], e[1], D.eye[2], "ink", "dog: eye");
  drawPath(a, D.ear, INK, "dog: ear", {}, { xf, tol: 0.9 });
  drawPath(a, D.mouth, INK, "dog: mouth", {}, { xf });
  drawPath(a, D.tail, INK, "dog: tail", {}, { xf, tol: 0.9 });
  drawPath(a, D.farFore, SOFT, "dog: far foreleg", {}, { xf, tol: 0.9 });
  drawPath(a, D.farHind, SOFT, "dog: far hind leg", {}, { xf, tol: 0.9 });
  for (const d of D.girth) drawPath(a, d, INK, "harness girth", {}, { xf, tol: 0.6 });
  for (const d of D.chest) drawPath(a, d, INK, "harness strap", {}, { xf, tol: 0.6 });
  // the identities that carry the dog into the right lens (F16): its torso squares into the frame, the
  // topline into the rim's top bar, the ribcage's curve into its outer bottom corner, the forechest into its
  // outer top corner, the rump into its inner top corner
  const arcLen = (sp) => sp.g.r * Math.abs(sp.g.a1 - sp.g.a0);
  const midY = (sp) => sp.g.cy + sp.g.r * Math.sin((((sp.g.a0 + sp.g.a1) / 2) * Math.PI) / 180);
  pinWhere(a, "line", "dog: back", (sp) => Math.hypot(sp.g.x2 - sp.g.x1, sp.g.y2 - sp.g.y1), "dBack");
  // the underline runs nearly straight (a Labrador's short tuck): the ribcage's curve is the elbow's, where it turns into the foreleg
  pinWhere(a, "arc", ["dog: belly", "dog: foreleg"], (sp) => (sp.tag.startsWith("dog: belly") ? 1e4 + arcLen(sp) : -sp.seq), "dBelly");
  pinWhere(a, "arc", "dog: chest", arcLen, "dChest");
  pinWhere(a, "arc", "dog: hind leg", (sp) => -midY(sp), "dRump");
  // the dog's silhouette (the near side's one contour, and the far legs): what the cane passes behind
  const body = D.body.flatMap(([, d]) => samplePath(d, 24).map(xf));
  const far = [D.farFore, D.farHind].map((d) => samplePath(d, 24).map(xf));
  return { body, far };
}
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
const dirOf = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
/**
 * A forearm out of its sleeve: the sleeve from past the pane's edge to the cuff (a little wider than the
 * arm), the cuff across it, then the forearm's two edges from the cuff to the wrist, straight for most of
 * the way, then easing in to the hand's base (`top`, `bot`): the wrist reads as a joint, never a board.
 * `axis0`: where the forearm's axis crosses the pane's left edge; deg its heading (negative rises).
 */
function forearm(a, top, bot, deg, w, lk, who, pins) {
  const d = dirOf(deg), n = [-d[1], d[0]];
  const wrist = [(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2];
  // the cuff: where the axis is CUFF_X in from the pane's edge
  const cuff = add(wrist, d, -(wrist[0] - CUFF_X) / d[0]);
  const len = dist(...cuff, ...wrist);
  const edge = (end, pin, side) => {
    const e0 = add(cuff, n, w * side);
    const m = add(add(cuff, d, len * 0.55), n, w * side);
    const c1 = add(add(cuff, d, len * 0.8), n, w * side);
    const c2 = add(end, d, -len * 0.1);
    drawPath(a, `M ${e0[0]} ${e0[1]} L ${m[0]} ${m[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${end[0]} ${end[1]}`, lk, `${who} forearm`, { pin }, { tol: 0.6 });
  };
  edge(top, pins[0], -1);
  edge(bot, pins[1], 1);
  // the sleeve, out past the pane's edge, and its cuff: a shallow curve, the sleeve's round edge
  const W = w + SLEEVE;
  for (const side of [-1, 1]) {
    const p = add(cuff, n, W * side), q = add(add(cuff, d, -120), n, W * side);
    a.seg(p, q, lk, `${who} sleeve`);
  }
  a.arc3(add(cuff, n, -W), add(cuff, d, 3), add(cuff, n, W), lk, `${who} cuff`);
}
/** the parts of segment p..q outside every polygon, each cut back by `gap` where it meets one */
function outsideRuns(p, q, polys, gap) {
  const N = 400, runs = [];
  let start = null;
  const at = (t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const L = Math.hypot(q[0] - p[0], q[1] - p[1]), g = gap / L;
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = at(t), hidden = polys.some((poly) => insidePoly(poly, x[0], x[1]));
    if (!hidden && start === null) start = t;
    if ((hidden || i === N) && start !== null) {
      const t1 = hidden ? t - 1 / N : 1;
      runs.push([start === 0 ? 0 : start + g, t1 === 1 ? 1 : t1 - g]);
      start = null;
    }
  }
  return runs.filter(([t0, t1]) => t1 - t0 > 0.02).map(([t0, t1]) => [at(t0), at(t1)]);
}
/** a hand's wrist placed so its forearm's axis meets the pane's edge at y0, `len` from the cuff */
function wristOf(arm) {
  const d = dirOf(arm.deg), cuff = add([0, arm.y0], d, CUFF_X / d[0]);
  return add(cuff, d, arm.len);
}
function hands(a) {
  a.line(-OUT, GND, 300, GND, SOFT, "the ground", { pin: "hzL" });
  a.line(300, GND, OUT, GND, SOFT, "the ground", { pin: "hzR" });
  const sil = dog(a);

  // the far hand on the long cane (soft: behind); the cane's grip and shaft in ink
  const fw = wristOf(FAR);
  const fx = place({ x: fw[0], y: fw[1], rot: FAR.cane - 84, k: HK });
  // what covers the grip: the fist and the thumb laid over it
  const fist = samplePath(CANE_FIST.outline, 16).map(fx);
  const thumb = fist;
  forearm(a, fx(CANE_FIST.base[0]), fx(CANE_FIST.base[1]), FAR.deg, FAR.w, SOFT, "right", ["armF1", "armF2"]);
  drawPath(a, CANE_FIST.outline, SOFT, "right hand", {}, { xf: fx, tol: 0.5 });
  drawPath(a, CANE_FIST.thumb, SOFT, "right thumb", {}, { xf: fx, tol: 0.5 });
  for (const d of CANE_FIST.fingers) drawPath(a, d, SOFT, "right hand", {}, { xf: fx, tol: 0.5 });
  // the cane's axis, through the fist on screen at FAR.cane: its grip from above the fist to under it, then the shaft
  const u = dirOf(FAR.cane), nn = [-u[1], u[0]];
  const c = fx(CANE_FIST.through);
  const G = CANE_FIST.grip;
  // where the axis leaves the fist's outline above and below
  const exitAt = (sgn) => {
    let s = 0;
    while ((insidePoly(fist, ...add(c, u, s)) || insidePoly(thumb, ...add(c, u, s))) && Math.abs(s) < 200) s += sgn * 0.25;
    return s;
  };
  const sTop = exitAt(-1) - G.above, sBot = exitAt(1);
  const sGrip = sBot + G.taper;
  const tip = add(c, u, (GND - 6 - c[1]) / u[1]);
  // the grip's two edges (flaring a little toward the shaft), cut where the fist covers them; its rounded top
  const wAt = (s) => G.w0 + ((G.w1 - G.w0) * (s - sTop)) / (sBot - sTop);
  for (const side of [-1, 1]) {
    const p = add(add(c, u, sTop), nn, G.w0 * side), q = add(add(c, u, sBot), nn, wAt(sBot) * side);
    for (const [r0, r1] of outsideRuns(p, q, [fist, thumb], 1.2)) a.seg(r0, r1, INK, "long cane, its grip");
    // under the fist the grip narrows into the shaft
    a.seg(q, add(c, u, sGrip), INK, "long cane, its grip");
  }
  a.arc3(add(add(c, u, sTop), nn, -G.w0), add(c, u, sTop - G.w0), add(add(c, u, sTop), nn, G.w0), INK, "long cane, its grip");
  const runs = outsideRuns(add(c, u, sGrip), toward(tip, c, 7), [sil.body, ...sil.far], CANE_TUCK);
  const longest = runs.reduce((m, r, i) => (dist(...r[0], ...r[1]) > dist(...runs[m][0], ...runs[m][1]) ? i : m), 0);
  runs.forEach((r, i) => a.seg(r[0], r[1], INK, "long cane", i === longest ? { pin: "cane" } : {}));
  a.rectC(tip[0], tip[1], 15, 10, 5, INK, "roller tip", { rot: FAR.cane });

  // the near hand on the harness: the handle's rod rises from the ring high on the strap loop into the fist,
  // and leaves it under the curled little finger
  const ring = place(DOGAT)(DOG.ring);
  const hg = add(ring, dirOf(NEAR.handleDeg), -NEAR.handle);
  // the fist sits so the rod leaves it under the little finger, the hand turned a little down from its forearm
  const nrot = 4;
  const g0 = place({ rot: nrot, k: HK })(FIST.grip);
  const nw = [hg[0] - g0[0], hg[1] - g0[1]];
  const ndeg = (Math.atan2(nw[1] - NEAR.y0, nw[0]) * 180) / Math.PI;
  const nxf = place({ x: nw[0], y: nw[1], rot: nrot, k: HK });
  forearm(a, nxf(FIST.base[0]), nxf(FIST.base[1]), ndeg, NEAR.w, INK, "left", ["armN1", "armN2"]);
  drawPath(a, FIST.outline, INK, "left hand", {}, { xf: nxf, tol: 0.5 });
  drawPath(a, FIST.thumb, INK, "left thumb", {}, { xf: nxf, tol: 0.5 });
  for (const d of FIST.fingers) drawPath(a, d, INK, "left hand", {}, { xf: nxf, tol: 0.5 });
  // the fist folds into the left hinge (F16)
  pinWhere(a, "arc", "left hand", (sp) => sp.g.r * Math.abs(sp.g.a1 - sp.g.a0), "fist");
  const under = nxf(FIST.grip);
  const bot = toward(ring, under, HANDS_ORB_R + 1.5);
  const mid = add([(under[0] + bot[0]) / 2, (under[1] + bot[1]) / 2], dirOf(-50), 2);
  a.arc3(under, mid, bot, INK2, "harness handle", { pin: "handleA" });

  // the orb, the one accent, rides on what the hand already holds: it is the harness's ring, where the
  // handle clips on (no third hand, no other device); in F16 it rises into the glasses' bridge
  orbR2(a, ...ring, HANDS_ORB_R, { single: true, coreR: 4.6, park: 24 });
  a.parkAlong(-60, GND, 660, GND, 24, SOFT, "tiled into the ground");
}

// ================================================================ F16 and F17: the wearable, then the summit through it
// Front elevation of real eyewear at its actual construction: frame fronts
// with their thickness (the rim, and the lens edge inside it), a keyhole
// bridge, the end pieces where the temples hinge back. The orb is the camera
// in the bridge.
// The glasses are drawn at 1.14x their first proportions about (300, 382) and set 70 higher, so the
// hero's horizon height (the ridge's level, y 340) runs through the lenses' lower third and the summit
// sits in the right lens's upper third: the wearable frames the same horizon the phone did.
const GS = 1.14, GDY = -70;
const G = ([x, y]) => [300 + (x - 300) * GS, 382 + (y - 382) * GS + GDY];
const GL = {
  // the right lens (viewer's right), clockwise: inner top, outer top, outer bottom, inner bottom
  lens: [[326, 320], [528, 312], [520, 446], [334, 452]].map(G),
  radii: [22, 34, 58, 44].map((r) => r * GS),
  rim: 13 * GS,
};
function lensShapes() {
  const R = GL.lens, L = mirrorX(R).reverse();
  return { R, L, Ri: insetPoly(R, GL.rim), Li: insetPoly(L, GL.rim) };
}
const radL = () => [...GL.radii].reverse();
function glasses(a) {
  const { R, L, Ri, Li } = lensShapes();
  const rIn = (rs) => rs.map((r) => Math.max(6, r - GL.rim));
  a.closed(L, radL(), INK2, "left rim");
  a.closed(R, GL.radii, INK2, "right rim");
  a.closed(Li, rIn(radL()), INK, "left lens edge");
  a.closed(Ri, rIn(GL.radii), INK, "right lens edge");
  // the bridge: its top, and the keyhole arch over the nose
  a.arc3(G([272, 334]), G([300, 326]), G([328, 334]), INK2, "bridge");
  a.arc3(G([276, 368]), G([300, 348]), G([324, 368]), INK, "bridge (keyhole)");
  // the end pieces, out from the rims' top corners to the hinges where the temples fold back
  drawPath(a, "M 523 323 L 545 323 C 550 323 552 326 552 330.5 C 552 335 550 338 545 338 L 522 338", INK2, "end piece and hinge", {}, { xf: G });
  drawPath(a, "M 77 323 L 55 323 C 50 323 48 326 48 330.5 C 48 335 50 338 55 338 L 78 338", INK2, "end piece and hinge", {}, { xf: G });
  // the temples, from the hinges, receding back past the face: short and foreshortened, outward and a little down
  // (the cane becomes the right one, the far forearm the left)
  a.seg(G([552, 331]), G([568, 348]), INK, "temple", { pin: "cane" });
  a.seg(G([48, 331]), G([32, 348]), INK, "temple", { pin: "armF1" });
  // What the hands held carries on into the frame, part by part (F15's pins): the dog's torso squares into
  // the right rim (its topline the top bar, the ribcage the outer bottom corner, the forechest the outer top
  // corner, the rump the inner top corner); the far forearm into the left rim's top bar and the left temple;
  // the near forearm into the left rim's bottom bar and the lens edge inside it; the fist into the left
  // hinge; the harness handle into the bridge; the cane into the right temple.
  const top = (sp) => -(sp.g.y1 + sp.g.y2), bottom = (sp) => sp.g.y1 + sp.g.y2;
  pinWhere(a, "line", "right rim", top, "dBack");
  pinWhere(a, "arc", "right rim", (sp) => sp.g.cx + sp.g.cy, "dBelly");
  pinWhere(a, "arc", "right rim", (sp) => sp.g.cx - sp.g.cy, "dChest");
  pinWhere(a, "arc", "right rim", (sp) => -sp.g.cx - sp.g.cy, "dRump");
  pinWhere(a, "line", "left rim", top, "armF2");
  pinWhere(a, "line", "left rim", bottom, "armN1");
  pinWhere(a, "line", "left lens edge", bottom, "armN2");
  pinWhere(a, "arc", "end piece", (sp) => -sp.g.cx, "fist");
  pinWhere(a, "arc", "bridge", (sp) => (sp.tag === "bridge" || sp.tag === "bridge (curve)" ? 1 : 0), "handleA");
}
/** pins the drawn piece of `kind` whose tag starts with `prefix` and scores highest */
function pinWhere(a, kind, prefix, score, pin) {
  let best = null, bs = -Infinity;
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  for (const sp of a.S[kind]) {
    if (!prefixes.some((pf) => sp.tag.startsWith(pf)) || (sp.pin && !sp.pin.startsWith("~"))) continue;
    const v = score(sp);
    if (v > bs) { bs = v; best = sp; }
  }
  if (!best) throw new Error(`pinWhere: no ${kind} "${prefix}"`);
  best.pin = pin;
}
/** where the pieces the glasses do not need wait: folded into the frame's straight runs */
function parkGlasses(a) {
  const { R, L, Ri, Li } = lensShapes();
  for (const [poly, lk] of [[R, INK2], [L, INK2], [Ri, INK], [Li, INK]]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], m = 0.3;
      const P = [p[0] + (q[0] - p[0]) * m, p[1] + (q[1] - p[1]) * m], Q = [q[0] + (p[0] - q[0]) * m, q[1] + (p[1] - q[1]) * m];
      a.parkAlong(...P, ...Q, 6, lk, "folded into the frame", ["rect", "line", "arc"], 14);
    }
  }
}
// the line behind the glasses: ink where a lens shows it, soft outside, broken by the rims
function behind(a, ctrl, radii, o = {}) {
  const { R, L, Ri, Li } = lensShapes();
  const segs = chain(ctrl, radii);
  const xsAt = (poly, y) => {
    const xs = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      if ((p[1] - y) * (q[1] - y) <= 0 && p[1] !== q[1]) xs.push(p[0] + ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]));
    }
    return [Math.min(...xs), Math.max(...xs)];
  };
  // where the line crosses each lens's left and right sides (the sides are near vertical, so iterate on the height)
  const cross = (poly, side) => {
    let x = side === 0 ? Math.min(...poly.map((p) => p[0])) : Math.max(...poly.map((p) => p[0]));
    for (let it = 0; it < 6; it++) { const y = yOnChain(segs, x); x = xsAt(poly, y)[side]; }
    return x;
  };
  const g = 4;
  const oL = [cross(L, 0), cross(L, 1)], iL = [cross(Li, 0), cross(Li, 1)], oR = [cross(R, 0), cross(R, 1)], iR = [cross(Ri, 0), cross(Ri, 1)];
  const t = o.tag ?? "horizon";
  // Across the pane's full width: through each lens in ink, behind the bridge and outside the frames soft,
  // broken only where the rims cover it. The ground the dog walked on rises into the soft runs outside the
  // frames (hzL, hzR: level in both drawings, so the summit moves only what the lenses and the bridge show).
  const OUTX = 1000;
  a.line(-OUTX, GHZ, oL[0] - g, GHZ, SOFT, `${t}, outside the frames`, { pin: "hzL" });
  a.line(oR[1] + g, GHZ, OUTX, GHZ, SOFT, `${t}, outside the frames`, { pin: "hzR" });
  if (o.flat) {
    for (const [x0, x1] of [[iL[0] + g, iL[1] - g], [iR[0] + g, iR[1] - g]]) {
      a.line(x0, GHZ, x1, GHZ, INK, `${t}, seen through the lens`);
      a.parkAlong(x0, GHZ, x1, GHZ, 16, INK, "tiled into the horizon", ["line"], 14);
    }
  } else {
    a.drawChain(clipChain(segs, iL[0] + g, iL[1] - g), INK, `${t}, seen through the lens`);
    a.drawChain(clipChain(segs, iR[0] + g, iR[1] - g), INK, `${o.tag2 ?? t}, seen through the lens`);
  }
  a.drawChain(clipChain(segs, oL[1] + g, oR[0] - g), SOFT, `${t}, behind the bridge`);
  return segs;
}
// The ridge (figures.mjs RIDGE_PATH): the hero's horizon risen, cut into
// short straight runs; the flat horizon of F16 is cut at the same stations,
// so the level line lifts into the ridge run by run, all together.
const GHZ = RIDGE_Y0;
/** the camera in the bridge: where the orb sits on the glasses */
const BRIDGE = G([300, 342]);
const RIDGE = { ctrl: ridgeStations(), radii: 0 };
const FLAT = RIDGE.ctrl.map(([x]) => [x, GHZ]);

export function defineR2(def) {
  def({
    id: "R2o-orb", reel: "r2", section: "people", beat: "the mark relaxes into the listening orb", anchor: "(the pivot lets go)", at: "pivot-stage (end)",
    phone: { cx: 300, cy: 400, s: 1, run: "section" },
    note: "After the pivot the mark relaxes back into the orb, in place: its bands thin and re-space onto the orb's rings (100/84/68% of 150, Orb.tsx widths x 3), its disk into the core, ink into accent: the hero's orb at the hero's place and size, now listening. Every other piece waits under the core. On a phone the people's band rises as this orb.",
    move: { stagger: 0, bend: 0 },
    build: (a) => {
      orbR2(a, 300, 400, 150, { park: 120 });
      a.line(150, 400, 150, 400, { ...ACC, o: 0 }, "reeled into the orb", { pin: "hzL", hidden: true });
      a.line(450, 400, 450, 400, { ...ACC, o: 0 }, "reeled into the orb", { pin: "hzR", hidden: true });
      for (const pin of ["cane", "armN1", "armN2", "armF1", "armF2"]) a.line(300, 400, 300, 400, { ...ACC, o: 0 }, "waiting in the core", { pin, hidden: true });
      a.arc(300, 400, 0, -90, -90, { ...ACC, o: 0 }, "waiting in the core", { pin: "handleA", hidden: true });
    },
  });
  def({
    id: "F14-people", reel: "r2", section: "people", anchor: "Built with the people who use it.", at: "people-h2",
    hold: "fathom started as an experiment. Now blind people shape it.", holdAt: "people-p1",
    phone: { cx: 300, cy: 452, s: 0.82 },
    note: "The mark relaxes into the orb, listening (rings back to 100/84/68%, accent again), and the people who shape it face it at eye level: two heads in profile, each one continuous line drawn from a real head (forehead, brow, the nose's bridge and tip, two lips, the chin, under the jaw, the throat), the hair's mass and its hairline, the ear, the lid. Near and large on the left, Delaware, short hair to a sideburn; farther and smaller on the right, Minneapolis, a softer profile, hair drawn back over the ear into a bun. No glyph people and no props that stand for blindness. Each says what breaks: a few short dashes from the mouth toward the orb. The hero's horizon is their eye line, seen only where the faces and the orb leave it. Neck, collar, a shoulder and the chest run out of the frame. The mark's bands contract into the rings; the profiles are traced out of its beads and laid segments in the order they are drawn.",
    move: { bend: 0, stagger: 0.6, trace: ["Delaware", "Minneapolis"], groups: ["orb", "horizon", "Delaware: face", "Delaware: hair", "Delaware", "Minneapolis: face", "Minneapolis: hair", "Minneapolis", "what breaks"] },
    build: (a) => people(a),
  });
  def({
    id: "F14b-listening", reel: "r2", section: "people", beat: "feedback comes in", anchor: "It was tested in Delaware and Minneapolis… from across the US and Europe.", at: "people-p2",
    hold: "The goal: … in the hands of every blind person.", holdAt: "people-p3",
    phone: { cx: 300, cy: 452, s: 0.82, run: "item" },
    note: "In the --why-gap-para gap before the second paragraph, only the dashes move: each voice travels in to the orb's edge (the orb listening, the app's own inward motion). Small marks, short straight trips, nothing else moves; then it holds through the paragraph about feedback from across the US and Europe and the goal.",
    move: { stagger: 0.2, bend: 0 },
    build: (a) => people(a, { advance: true }),
  });
  def({
    id: "F15-hands", reel: "r2", section: "hands", anchor: "A cane in one hand. A harness in the other.", at: "hands-p1",
    hold: "Nobody needs another device to hold.", holdAt: "hands-p1 (bottom edge)",
    phone: { cx: 300, cy: 440, s: 0.9 },
    note: "Side elevation, walking right, cropped to what the sentence names. The dog is the subject: a Labrador drawn from the breed’s proportions as one contour (a level back, the croup, the otter tail, the rump rounding over the buttock into the hind leg as an S: the back of the thigh, the point of the hock, the rear pastern, the paw; the stifle’s one convex curve up into the flank, left open; the underline in one gentle tuck; the elbow under the brisket, the foreleg breaking forward at the carpus, the paw with its toes; the forechest and throat, a broad skull, the ear, the crest of the neck), the far legs soft in the gaps the near ones leave, in its harness (one strap loop round the barrel behind the elbow, the chest strap from its top across the point of the shoulder). The handler is out of the picture at the left: two forearms come in from the pane’s edge out of their cuffs. The near one (ink) runs nearly level to a closed fist on the rigid handle, whose rod runs down to the ring high on the loop; the far one (soft) rises to a closed fist round the long cane’s grip, the grip’s top above the knuckles and the shaft on its axis, behind the dog’s neck and out ahead of its chest to the roller tip. The cane and the handle part from the fists and never cross. The orb, the one accent, is the harness’s ring, and rises into the glasses’ bridge next.",
    move: { bend: 0, stagger: 0.6, trace: ["dog", "harness", "left", "right"], groups: ["the ground", "dog: back", "dog: neck", "dog: head", "dog: chest", "dog: belly", "dog: foreleg", "dog: hind leg", "dog: ear", "dog: nose", "dog: eye", "dog: mouth", "dog: tail", "dog: far", "harness", "left hand", "left thumb", "left forearm", "left sleeve", "left cuff", "right hand", "right thumb", "right forearm", "right sleeve", "right cuff", "long cane", "roller tip", "orb"] },
    // the near person reforms into the hands and the arms as a whole, the far one into the dog: each stroke
    // goes to the stroke at the same place in the new shape
    warp: [
      { from: ["Delaware"], to: ["left", "right", "long cane", "harness handle"], src: [20, 250, 250, 660], dst: [-20, 240, 460, 640] },
      { from: ["Minneapolis"], to: ["dog:", "harness"], src: [380, 290, 560, 660], dst: [36, 380, 392, 640] },
    ],
    affinity: [["Delaware: face", "left hand"], ["Delaware: ear", "left thumb"], ["Delaware: hairline", "left thumb"], ["Delaware: eye", "left hand"], ["Delaware: hair", "right hand"], ["Delaware: hair", "right thumb"], ["Delaware: collar", "left forearm"], ["Delaware: shoulder", "left forearm"], ["Delaware: shoulder", "left sleeve"], ["Delaware: collar", "right sleeve"], ["Delaware: chest", "harness handle"], ["Minneapolis: face", "dog: head"], ["Minneapolis: hair in a bun", "dog: ear"], ["Minneapolis: hair", "dog: neck"], ["Minneapolis: hair", "dog: head"], ["Minneapolis: ear", "dog: ear"], ["Minneapolis: eye", "dog: mouth"], ["Minneapolis: collar", "dog: chest"], ["Minneapolis: shoulder", "dog: back"], ["Minneapolis: chest", "dog: foreleg"], ["the base line", "the ground"], ["what breaks", "long cane"], ["what breaks", "harness"]],
    build: (a) => hands(a),
  });
  def({
    id: "F16-wearable", reel: "r2", section: "hands", anchor: "fathom’s future is hands-free: a wearable that keeps what it sees private and stays quiet in a room.", at: "hands-p2",
    hold: "We’re testing that now, … as the hardware gets better.", holdAt: "hands-p3",
    phone: { cx: 300, cy: 314, s: 0.96 },
    note: "The wearable that frees them, in a clean front elevation of real eyewear: frame fronts with their thickness (the outer rim in the emphasis weight, the lens edge inside it), lenses drawn as the soft trapezoid real frames use, a keyhole bridge with its brow bar, the end pieces out from the rims' top corners to the hinges. The ground rises into the horizon and the dog's legs fold into it; the dog's body rounds into the right rim and its lens, the hands into the left, the arms and the cane lie down into the horizon, the harness into the bridge. The orb rises from the harness's ring into the bridge: the camera, the one accent, the same size. The horizon runs behind: soft outside, ink through the lenses, broken by the rims. Holds through the 'We’re testing that now' paragraph.",
    move: { bend: 0, stagger: 0.7, trace: true, groups: ["horizon", "long cane", "roller", "dog: hind leg", "dog: foreleg", "dog: far", "dog: tail", "right rim", "right lens", "left rim", "left lens", "bridge", "end piece", "orb"] },
    // the dog (its torso, head and tail: the legs fold away) reforms into the right lens as a whole, the
    // hands and the arms into the left: each stroke goes to the stroke at the same place in the new shape
    warp: [
      { from: ["dog:", "harness"], to: ["right rim", "right lens edge", "end piece"], src: [36, 380, 392, 560], dst: [330, 232, 586, 392] },
      { from: ["left", "right", "long cane"], to: ["left rim", "left lens edge", "end piece", "temple"], src: [-20, 240, 460, 640], dst: [14, 232, 290, 392] },
    ],
    affinity: [["left hand", "left rim"], ["left thumb", "left lens edge"], ["right hand", "left rim"], ["right thumb", "left lens edge"], ["left forearm", "horizon"], ["right forearm", "horizon"], ["dog: back", "right rim"], ["dog: neck", "right rim"], ["dog: head", "right rim"], ["dog: chest", "right lens edge"], ["dog: belly", "right lens edge"], ["dog: hind leg", "tiled into the horizon"], ["dog: foreleg", "tiled into the horizon"], ["dog: far", "tiled into the horizon"], ["dog: ear", "end piece"], ["dog: tail", "left rim"], ["harness", "bridge"], ["the ground", "horizon"], ["long cane", "horizon"], ["roller", "horizon"]],
    build: (a) => {
      glasses(a);
      orbR2(a, ...BRIDGE, 10, { single: true, coreR: 4.6 });
      // the horizon behind them is the ridge laid flat: the same segments, waiting to rise
      behind(a, FLAT, 0, { tag: "horizon", flat: true });
      parkGlasses(a);
      // the dog's legs fold into the ground as it rises into this horizon: room for them along it, through both lenses
      a.parkAlong(80, GHZ, 228, GHZ, 18, INK, "tiled into the horizon");
      a.parkAlong(372, GHZ, 520, GHZ, 18, INK, "tiled into the horizon");
    },
  });
  def({
    id: "F17-summit", reel: "r2", section: "hands", anchor: "That’s the next summit.", at: "hands-summit",
    phone: { cx: 300, cy: 314, s: 0.96 },
    note: "Only the ground moves, all of it at once, so it rises as one line. The horizon that has run under every section (the hero's street, the floor of every machine, the people's eye line) lifts into one ridge with a long, short, long rhythm: level at both ends, a slow rise to a rounded foothill through the left lens, a saddle behind the bridge, the climb easing at a shoulder, one crisp summit set off center in the right lens with air above it, a steeper fall with a small spur, and back to level. Through the lenses it is ink, outside them soft, and it breaks where the rims cover it: the glasses show the summit the way the hero's phone showed the dark street. No mountain icon, no zigzag, no flag, no sun: one line. The orb stays the camera. Ends the page.",
    move: { bend: 0, stagger: 0, groups: ["the ridge", "the summit"] },
    build: (a) => {
      glasses(a);
      orbR2(a, ...BRIDGE, 10, { single: true, coreR: 4.6 });
      behind(a, RIDGE.ctrl, RIDGE.radii, { tag: "the ridge", tag2: "the summit" });
      parkGlasses(a);
    },
  });
}
