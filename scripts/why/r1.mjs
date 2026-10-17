// Reel 1: the hero, the machines, the ceiling, the pace, the climax (orb, mark).
// Stage 600 x 800; the optical center (300, 400) is where the hero's big orb,
// the returning orb and the mark all sit. Phones get their own landscape
// compositions for the hero and the pace (the phone in your pocket, turned
// sideways the way people hold it to take a picture), drawn by the same
// scene builders as the desktop.
import { look, INK, SOFT, ACC, INK2, extTangents, clipSeg } from "./lib.mjs";

const OUT = 1000;

// ---------------------------------------------------------------- the phone, upright (desktop) and turned (pocket)
const PH = { x: 156, y: 80, w: 288, h: 640, r: 48 };
const SC = { x: 168, y: 92, w: 264, h: 616, r: 37 };
const MPH = { x: 40, y: 284, w: 520, h: 232, r: 40 };
const MSC = { x: 51, y: 295, w: 498, h: 210, r: 30 };
function phoneUpright(a) {
  a.rect(PH.x, PH.y, PH.w, PH.h, PH.r, INK, "phone body", { pin: "body" });
  a.rect(SC.x, SC.y, SC.w, SC.h, SC.r, SOFT, "phone screen", { pin: "screen" });
  a.rect(270, 104, 60, 22, 11, SOFT, "dynamic island", { pin: "island" });
  a.line(152, 176, 152, 200, INK, "action button", { pin: "btnA" });
  a.line(152, 230, 152, 274, INK, "volume up", { pin: "btnU" });
  a.line(152, 290, 152, 334, INK, "volume down", { pin: "btnD" });
  a.line(448, 244, 448, 320, INK, "side button", { pin: "btnP" });
}
/** the same phone turned a quarter turn (top to the left), the way it is held to take a picture */
function phoneTurned(a) {
  a.rect(MPH.x, MPH.y, MPH.w, MPH.h, MPH.r, INK, "phone body, turned", { pin: "body" });
  a.rect(MSC.x, MSC.y, MSC.w, MSC.h, MSC.r, SOFT, "phone screen, turned", { pin: "screen" });
  a.rect(62, 370, 20, 60, 10, SOFT, "dynamic island", { pin: "island" });
  // turned, the side buttons lie flush on the frame's long edges: on a phone's band they would read as loose dashes
  a.line(118, MPH.y + MPH.h, 137, MPH.y + MPH.h, INK, "action button, flush on the frame", { pin: "btnA" });
  a.line(162, MPH.y + MPH.h, 198, MPH.y + MPH.h, INK, "volume up, flush on the frame", { pin: "btnU" });
  a.line(211, MPH.y + MPH.h, 246, MPH.y + MPH.h, INK, "volume down, flush on the frame", { pin: "btnD" });
  a.line(173, MPH.y, 235, MPH.y, INK, "side button, flush on the frame", { pin: "btnP" });
}

// ---------------------------------------------------------------- the night street: one scene, framed upright or turned
const DF = {
  phone: phoneUpright, vp: [300, 340], box: [168, 92, 432, 708], outside: [PH.x - 10, PH.x + PH.w + 10], edge: [PH.x, PH.x + PH.w],
  // three buildings in elevation, their lit windows on each building's own grid
  sky: [[168, 290], [190, 290], [190, 254], [230, 254], [230, 306], [254, 306], [254, 340]],
  windows: [[198, 266, 7, 9], [214, 266, 7, 9], [214, 284, 7, 9], [175, 302, 6, 8], [238, 318, 6, 8]],
  road: [[196, 708], [404, 708]], dashes: [[349, 354], [364, 373], [390, 405], [432, 458], [500, 540]], curb: [[168, 625], [432, 625]],
  // a street light on the right-hand sidewalk: the post, the arm out over the road, the luminaire and its lit lens
  // its foot stands on the sidewalk, clear of the curb line (the post never lands in the road or crosses a bracket)
  lamp: { x: 396, base: 510, top: 300, bend: [393, 288], arm: [384, 283], head: [358, 279, 28, 8], lit: [362, 287.5, 16, 3] },
  sign: { post: [328, 352, 330], blade: [318, 322, 22, 8], ring: [329, 338, 30] },
  view: [184, 138, 416, 548, 22],
  // the loupe clears the lamp's head and the tallest building's roof by more than a stroke's gap
  loupe: { c: [304, 186], R: 53.4, blade: [263.5, 169.4, 81, 29.4, 4.6], bar: [277.3, 184.2, 330.7], post: [304, 198.9, 238], focus: [311, 312, 347, 360, 9] },
  orb: [300, 604, 40],
};
const MF = {
  phone: phoneTurned, vp: [300, 392], box: [51, 295, 549, 505], outside: [MPH.x - 10, MPH.x + MPH.w + 10], edge: [MPH.x, MPH.x + MPH.w],
  sky: [[92, 362], [120, 362], [120, 330], [164, 330], [164, 368], [188, 368], [188, 392]],
  windows: [[129, 340, 6, 8], [145, 340, 6, 8], [145, 355, 6, 8], [100, 372, 5, 7], [171, 378, 5, 7]],
  road: [[150, 505], [450, 505]], dashes: [[396, 399], [403, 408], [413, 421], [429, 440]], curb: [[40, 505], [560, 505]],
  lamp: { x: 428, base: 440, top: 356, bend: [425, 346], arm: [415, 343], head: [391, 340, 25, 6], lit: [395, 346, 15, 2.5] },
  sign: { post: [322, 401, 386], blade: [313, 379, 18, 7], ring: [322, 391, 20] },
  view: [100, 310, 500, 492, 18],
  loupe: { c: [252, 338], R: 40, blade: [222, 327, 60, 22, 4], bar: [232, 338, 272], post: [252, 349, 376], focus: [309, 370, 335, 408, 7] },
  orb: [300, 470, 26],
};
const box4 = (F) => F.box;
function outsideHorizon(a, F, y = F.vp[1], o = {}) {
  // the near stub is the hero's leader on the stage (WhyDirector moves it to the sentence the art shows):
  // in the opening frame it is the horizon itself, the lede sitting on it; once it points at another
  // sentence (o.pointer) it stops that far short of the phone, a pointer with a round end, never a
  // broken piece of the horizon
  if (o.left === false) a.line(F.edge[0], y, F.edge[0], y, INK, "horizon, folded into the phone's edge", { pin: "hzL", hidden: true });
  else if (o.pointer) a.line(-OUT + 300, y, F.edge[0] - o.pointer, y, SOFT, "horizon, pointing at the sentence", { pin: "hzL" });
  else a.line(-OUT + 300, y, F.outside[0], y, SOFT, "horizon (outside the phone)", { pin: "hzL" });
  if (o.right === false) a.line(F.edge[1], y, F.edge[1], y, INK, "horizon, folded into the phone's edge", { pin: "hzR", hidden: true });
  else a.line(F.outside[1], y, OUT, y, SOFT, "horizon (outside the phone)", { pin: "hzR" });
}
function street(a, F) {
  const [vx, vy] = F.vp;
  a.poly(F.sky, INK, "skyline");
  F.windows.forEach(([x, y, w, h]) => a.rect(x, y, w, h, 1, look("ink", { fill: "ink" }), "lit window"));
  const skyEnd = F.sky[F.sky.length - 1][0];
  a.line(skyEnd, vy, F.box[2], vy, INK, "horizon (seen)", { pin: "hzIn" });
  a.line(vx, vy, ...F.road[0], INK, "road edge", { pin: "roadL" });
  a.line(vx, vy, ...F.road[1], INK, "road edge", { pin: "roadR" });
  F.dashes.forEach(([y0, y1]) => a.line(vx, y0, vx, y1, SOFT, "lane dash"));
  for (const c of F.curb) { const s = clipSeg(vx, vy, c[0], c[1], ...box4(F)); a.line(...s, SOFT, "curb"); }
  // a street light on the sidewalk: its post, the arm out over the road, the luminaire and its lit lens
  const L = F.lamp;
  a.line(L.x, L.base, L.x, L.top, INK, "street lamp post");
  a.arc3([L.x, L.top], L.bend, L.arm, INK, "street lamp arm");
  a.rect(...L.head, L.head[3] / 2, INK, "street lamp luminaire");
  a.rect(...L.lit, L.lit[3] / 2, look("ink", { fill: "ink" }), "street lamp, lit");
  a.line(F.sign.post[0], F.sign.post[1], F.sign.post[0], F.sign.post[2], INK, "far sign post", { pin: "signPost" });
  a.rect(...F.sign.blade, 1.5, INK, "far sign blade", { pin: "signBlade" });
}
/**
 * The dark the phone sees into (the desktop's upright phone only): outside the bezel the same street
 * runs on in soft, a roofline stepping along the horizon on either side and the sidewalk's edges running
 * out past the phone's sides to the pane's bottom, so the bezel reads as the edge where the dark becomes
 * legible: soft and bare outside, ink and detailed inside. Cropped at the pane's edges.
 */
function outsideCity(a, F) {
  if (F !== DF) return;
  const y = F.vp[1], L = F.outside[0], R = F.outside[1];
  a.poly([[L, y - 30], [118, y - 30], [118, y - 62], [80, y - 62], [80, y - 24], [46, y - 24], [46, y - 48], [-24, y - 48]], SOFT, "the dark: a roofline");
  a.poly([[R, y - 18], [492, y - 18], [492, y - 44], [548, y - 44], [548, y - 26], [624, y - 26]], SOFT, "the dark: a roofline");
  // Nothing hangs below the phone: the bezel is the edge where the dark becomes legible. The two pieces
  // that were the sidewalk's edges outside it wait in the horizon instead, where it meets the bezel.
  a.line(L - 24, y, L - 4, y, { ...SOFT, o: 0 }, "tiled into the horizon", { hidden: true });
  a.line(R + 4, y, R + 24, y, { ...SOFT, o: 0 }, "tiled into the horizon", { hidden: true });
}
/** the loupe of F02 waits as a point under the orb's core: the lens's view rises out of the lens */
const loupeInLens = (a, F) => a.rect(F.orb[0], F.orb[1], 0, 0, 0, look("accent"), "loupe, waiting in the lens", { pin: "wall" });
/** where the pieces a phone scene does not need wait: under the orb's core, along the lines it draws */
function parkScene(a, F, o = {}) {
  const [ox, oy] = F.orb;
  a.parkLens(ox, oy, o.lens ?? 60, "accent");
  const y = F.vp[1];
  if (o.left !== false) a.parkAlong(-60, y, F.outside[0] - 4, y, 10, SOFT, "tiled into the horizon");
  if (o.right !== false) a.parkAlong(F.outside[1] + 4, y, 660, y, 10, SOFT, "tiled into the horizon");
  if (o.road !== false) { a.parkAlong(F.vp[0], F.vp[1], ...F.road[0], 8, INK, "tiled into the road edge"); a.parkAlong(F.vp[0], F.vp[1], ...F.road[1], 8, INK, "tiled into the road edge"); }
  if (o.edges) parkEdges(a, F);
}
/** parking along the phone's own straight runs: the body's long sides (ink) and the screen's (soft) */
function parkEdges(a, F) {
  const B = F === DF ? PH : MPH, S = F === DF ? SC : MSC;
  if (B.h > B.w) {
    for (const x of [B.x, B.x + B.w]) a.parkAlong(x, B.y + B.r + 6, x, B.y + B.h - B.r - 6, 14, INK, "tiled into the phone's side");
    for (const x of [S.x, S.x + S.w]) a.parkAlong(x, S.y + S.r + 6, x, S.y + S.h - S.r - 6, 10, SOFT, "tiled into the screen's side");
  } else {
    for (const y of [B.y, B.y + B.h]) a.parkAlong(B.x + B.r + 6, y, B.x + B.w - B.r - 6, y, 14, INK, "tiled into the phone's side");
    for (const y of [S.y, S.y + S.h]) a.parkAlong(S.x + S.r + 6, y, S.x + S.w - S.r - 6, y, 10, SOFT, "tiled into the screen's side");
  }
}

// ---------------------------------------------------------------- the orb sits in the drawing, never under it
/** the orb's clearance: no stroke of a drawing comes within its outer ring plus this gap */
const ORB_GAP = 6;
/**
 * Breaks every straight stroke drawn since `from` (an index into a.S.line) where it would pass through
 * the orb (center c, outer ring R): a draftsman breaks the line at the lens. A stroke that crosses the
 * orb keeps its two outer parts (the second a new stroke); one that ends inside it stops at the gap.
 */
function clearOrb(a, from, c, R) {
  const rr = R + ORB_GAP;
  const out = [];
  for (const sp of a.S.line.slice(from)) {
    if (sp.pin === "ring1" || /orb/.test(sp.tag)) { out.push(sp); continue; }
    const { x1, y1, x2, y2 } = sp.g, dx = x2 - x1, dy = y2 - y1, fx = x1 - c[0], fy = y1 - c[1];
    const A = dx * dx + dy * dy, B = 2 * (fx * dx + fy * dy), C = fx * fx + fy * fy - rr * rr, D = B * B - 4 * A * C;
    if (A < 1e-9 || D <= 0) { out.push(sp); continue; }
    const t0 = (-B - Math.sqrt(D)) / (2 * A), t1 = (-B + Math.sqrt(D)) / (2 * A);
    if (t1 <= 0 || t0 >= 1) { out.push(sp); continue; }
    const at = (t) => [x1 + dx * t, y1 + dy * t];
    const parts = [];
    if (t0 > 0.02) parts.push([[x1, y1], at(t0)]);
    if (t1 < 0.98) parts.push([at(t1), [x2, y2]]);
    parts.forEach(([p, q], i) => out.push({ ...sp, g: { x1: p[0], y1: p[1], x2: q[0], y2: q[1] }, ...(i ? { pin: undefined, seq: sp.seq + 0.5 } : {}) }));
  }
  a.S.line.splice(from, a.S.line.length - from, ...out);
}

// ---------------------------------------------------------------- the room (F03) and the hallway (F12): one construction
const DW = { x: 210, y: 288, w: 180, h: 124 }, MW = { x: 236, y: 352, w: 128, h: 70 };
function roomShell(a, F, W) {
  const [vx, vy] = F.vp, X1 = W.x + W.w, Y1 = W.y + W.h;
  for (const [cx, cy] of [[W.x, W.y], [X1, W.y], [W.x, Y1], [X1, Y1]]) a.line(...clipSeg(cx, cy, cx + (cx - vx) * 8, cy + (cy - vy) * 8, ...box4(F)), SOFT, "corner ray");
  return { X1, Y1 };
}
function room(a, F, W, R) {
  const from = a.S.line.length;
  const [vx, vy] = F.vp, { X1, Y1 } = roomShell(a, F, W);
  a.rect(W.x, W.y, W.w, W.h, 1, SOFT, "back wall", { pin: "wall" });
  // the couch the room is being mapped around, against the back wall
  const c = R.couch;
  a.rect(c.back[0], c.back[1], c.back[2], c.back[3], c.back[3] / 3, INK, "couch back");
  a.rect(c.seat[0], c.seat[1], c.seat[2], c.seat[3], 4, INK, "couch seat");
  a.rect(c.armL[0], c.armL[1], c.armL[2], c.armL[3], c.armL[2] / 2.4, INK, "couch arm");
  a.rect(c.armR[0], c.armR[1], c.armR[2], c.armR[3], c.armR[2] / 2.4, INK, "couch arm");
  a.rect(...R.door, 1, INK, "door");
  a.line(R.floorRight[0], Y1, X1, Y1, SOFT, "back wall floor line", { pin: "hzIn" });
  // the floor and ceiling as the mesh the phone builds
  const fl = (bx, by) => clipSeg(bx, by, bx + (bx - vx) * 8, by + (by - vy) * 8, ...box4(F));
  a.line(...fl(R.lanes[0], Y1), SOFT, "floor line", { pin: "roadL" });
  a.line(...fl(R.lanes[1], Y1), SOFT, "floor line", { pin: "roadR" });
  a.line(...fl(vx, Y1), SOFT, "floor center line");
  a.line(...fl(R.lanes[0], W.y), SOFT, "ceiling line");
  a.line(...fl(R.lanes[1], W.y), SOFT, "ceiling line");
  const rayX = (y, side) => vx + (side * (W.w / 2) * (y - vy)) / (Y1 - vy);
  R.floorMesh.forEach((y) => a.line(Math.max(F.box[0], rayX(y, -1)), y, Math.min(F.box[2], rayX(y, 1)), y, SOFT, "floor mesh"));
  R.ceilMesh.forEach((y) => a.line(F.box[0], y, F.box[2], y, SOFT, "ceiling mesh"));
  // depth points where the mesh is measured: the wall's corners, the couch's, the floor's crossings
  const lx = (y, bx) => bx + ((bx - vx) * (y - Y1)) / (Y1 - vy);
  const pts = [[W.x, W.y], [X1, W.y], [W.x, Y1], [X1, Y1], ...R.couchPts];
  for (const y of R.floorMesh) pts.push([lx(y, R.lanes[0]), y], [vx, y], [lx(y, R.lanes[1]), y]);
  pts.forEach(([px, py]) => a.disk(px, py, R.dot, "ink", "depth point"));
  clearOrb(a, from, F.orb, F.orb[2]);
}
const DR = {
  couch: { back: [228, 366, 84, 28], seat: [222, 392, 96, 26], armL: [212, 378, 16, 42], armR: [312, 378, 16, 42] },
  couchPts: [[212, 378], [328, 378], [212, 420], [328, 420]],
  door: [342, 346, 34, 66], lanes: [255, 345], floorRight: [328], floorMesh: [452, 512], ceilMesh: [236, 164], dot: 3.4,
};
const MR = {
  couch: { back: [252, 384, 58, 20], seat: [248, 403, 66, 18], armL: [241, 394, 11, 30], armR: [310, 394, 11, 30] },
  couchPts: [[241, 394], [321, 394], [241, 424], [321, 424]],
  door: [334, 380, 22, 42], lanes: [268, 332], floorRight: [321], floorMesh: [450, 486], ceilMesh: [322], dot: 3,
};
/** the hallway: the room re-targeted. The same construction and vanishing point; the couch is gone, the back wall is a doorway onto the street */
function hallway(a, F, W, H) {
  const from = a.S.line.length;
  const [vx, vy] = F.vp, { Y1 } = roomShell(a, F, W);
  a.rect(W.x, W.y, W.w, W.h, 1, SOFT, "end wall", { pin: "wall" });
  a.rect(...H.doorway, 1, INK, "doorway onto the street");
  a.line(H.doorway[0], vy, H.doorway[0] + H.doorway[2], vy, INK, "the street through the doorway", { pin: "hzIn" });
  // doors on the side walls, in perspective: verticals, tops converging on the vanishing point
  const kTop = (vy - W.y) / (vx - W.x), kBot = (Y1 - vy) / (vx - W.x);
  const fy = (x) => vy + kBot * Math.abs(vx - x), cy = (x) => vy - kTop * Math.abs(vx - x);
  const top = (x) => fy(x) - 0.74 * (fy(x) - cy(x));
  for (const [xn, xf, side] of H.doors) {
    a.line(xn, fy(xn), xn, top(xn), INK, `${side} door`).line(xf, fy(xf), xf, top(xf), INK, `${side} door`).line(xn, top(xn), xf, top(xf), INK, `${side} door`);
  }
  a.rect(...H.menu, 1, INK, "menu by the door");
  // the tactile guide strip down the middle: its two edges and the raised bars inside, all to the vanishing point
  for (const [bx, tag, lk, pin] of H.strip) {
    const s = clipSeg(bx, Y1 + 2, bx + (bx - vx) * 8, Y1 + 2 + (Y1 - vy) * 8, ...box4(F));
    a.line(...s, lk, tag, pin ? { pin } : undefined);
  }
  // square ceiling panels in one-point perspective: nearer ones wider, and deeper on the page
  H.lights.forEach(([y, w, h]) => a.rect(vx - w / 2, y, w, h, Math.min(2, h / 2), SOFT, "ceiling light"));
  if (F.orb) clearOrb(a, from, F.orb, F.orb[2]);
}
const DH = {
  doorway: [276, 330, 48, 82], doors: [[178, 206, "left"], [422, 394, "right"]], menu: [372, 316, 12, 18],
  strip: [[288, "tactile guide strip", INK, "roadL"], [312, "tactile guide strip", INK, "roadR"], [296, "tactile bar", SOFT], [304, "tactile bar", SOFT]],
  // 60 cm panels, projected from the vanishing point (300, 340) with the end wall's top 52 units above it
  lights: [[279, 40, 4], [253, 55, 8], [200, 86, 19]],
};
const MH = {
  doorway: [286, 372, 28, 50], doors: [[176, 204, "left"], [424, 396, "right"]], menu: [370, 380, 10, 14],
  strip: [[292, "tactile guide strip", INK, "roadL"], [308, "tactile guide strip", INK, "roadR"], [297, "tactile bar", SOFT], [303, "tactile bar", SOFT]],
  lights: [[339, 34, 4], [312, 50, 9]],
};
const RET = {
  desk: { view: [184, 138, 416, 548, 22], menu: [362, 306, 394, 344, 8], tiles: [270, 448, 330, 560, 10], hall: [206, 258, 394, 446, 14], street: [270, 324, 330, 360, 8] },
  phone: { view: [100, 310, 500, 492, 18], menu: [362, 372, 380, 400, 6], tiles: [276, 432, 324, 500, 8], hall: [214, 330, 386, 440, 10], street: [280, 380, 320, 404, 6] },
};

// ---------------------------------------------------------------- the re-targets (F12a..d): what the viewfinder is pointed at
// Each pair's job, drawn as the camera frames it: a considered reduction of
// the real subject filling a reticle about 250 x 290 (stage scale 1.35 on the
// local box BOX), the orb just under it, the viewfinder and the orb moving as
// one rigid unit. On the stage the subject sits level with its pair's row
// while the four pairs are pinned (why.css --why-frame-top 32svh, calibrated
// at 1440 x 900: each job's line at grid y ROWS), so the active pair is shown
// by alignment alone. On a phone the band zooms into the viewfinder (the
// turned phone grown past the band's edges), so the job draws at about two
// and a half times the hallway's scale. Local units centered on the subject.
const BOX = [-92, -96, 92, 96];
const RK = { desk: 1.35, phone: 1.45 };
// the reticle's center, level with each pair's job while the list pins on the stage, and with the
// statement that closes the pairs ("Point that tech…") once the list lets go and it comes to be read
const ROWS = { menu: 269, curb: 343, hall: 419, street: 494, statement: 302 };
const SUBJECT = {
  menu: (a, P, k) => {
    // a bifold menu held open to the camera: the card and its fold; on each panel a course's heading over a
    // rule, its dishes ranged left and their prices ranged right in a column of their own, then a second course
    a.rect(...P(-80, -90), 160 * k, 180 * k, 4 * k, INK, "the menu, open");
    a.seg(P(0, -90), P(0, 90), SOFT, "its fold");
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? -68 : 12, x1 = side < 0 ? -12 : 68, px = x1 - 10;
      a.seg(P(x0, -70), P(x0 + 34, -70), INK2, "a course's heading");
      a.seg(P(x0, -58), P(x1, -58), SOFT, "the rule under it");
      [[-40, 30], [-23, 22], [-6, 34], [11, 26]].forEach(([y, w]) => { a.seg(P(x0, y), P(x0 + w, y), SOFT, "a dish"); a.seg(P(px, y), P(x1, y), INK, "its price"); });
      a.seg(P(x0, 36), P(x0 + 26, 36), INK2, "a course's heading");
      [[54, 28], [71, 20]].forEach(([y, w]) => { a.seg(P(x0, y), P(x0 + w, y), SOFT, "a dish"); a.seg(P(px, y), P(x1, y), INK, "its price"); });
    }
  },
  curb: (a, P, k) => {
    // A curb ramp, seen the way a person standing in the road at the crossing sees it: a near-level
    // three-quarter view, the curb running across the picture and receding a little to the right. The
    // curb's edge is the heavy line the camera finds, a little under the middle; under it the riser's face
    // and the gutter's edge, each a parallel line. At the center the edge drops down both flares to road
    // level: the ramp, a trapezoid notch, its sides climbing back to the sidewalk and the detectable
    // warning field across its foot, domes in rows, foreshortened toward the back. The crosswalk's bars lie
    // on the road below, parallel to the curb, the nearer one running out through the bottom of the
    // picture. At the left the picture cuts the curb, so its profile reads first: the sidewalk's top, the
    // riser dropping to the road.
    const tilt = -0.035; // the curb recedes to the right: its lines climb 3.5 units in 100
    const Y = (x, y) => y + tilt * x;
    const L = (x1, y1, x2, y2, lk, tag) => a.seg(P(x1, Y(x1, y1)), P(x2, Y(x2, y2)), lk, tag);
    const EDGE = 15, RISE = 14, GUT = 10, CUT = -72, N0 = 54, N1 = 34, BACK = -22, WALK = -62, IN = 4;
    const FOOT = EDGE + RISE;
    // the cut profile: the sidewalk's top running back from the cut, the riser dropping to the road
    L(-92, EDGE - 7, CUT, EDGE, SOFT, "the sidewalk, cut");
    L(CUT, EDGE, CUT, FOOT, INK2, "the curb's riser, cut");
    // the curb's edge, heavy: across, down the near flare, flush across the ramp's foot, up the far flare, on
    L(CUT, EDGE, -N0, EDGE, INK2, "the curb's edge");
    L(-N0, EDGE, -N1, FOOT, INK2, "the curb's edge, down its flare");
    L(-N1, FOOT, N1, FOOT, INK2, "the ramp's foot, flush with the road");
    L(N1, FOOT, N0, EDGE, INK2, "the curb's edge, up its flare");
    L(N0, EDGE, 92, EDGE, INK2, "the curb's edge");
    // the riser's foot (the road meets it) and the gutter's edge, parallel under the edge
    L(CUT, FOOT, -N1, FOOT, SOFT, "the riser's foot");
    L(N1, FOOT, 92, FOOT, SOFT, "the riser's foot");
    L(-92, FOOT + GUT, 92, FOOT + GUT, SOFT, "the gutter's edge");
    // the ramp: its sides climbing back from the foot to the sidewalk (a little narrower as they go: they
    // recede), its top edge, and each flare's back edge from the notch's top corner to the ramp's top
    L(-N1, FOOT, -N1 + IN, BACK, INK, "the ramp's side");
    L(N1, FOOT, N1 - IN, BACK, INK, "the ramp's side");
    L(-N1 + IN, BACK, N1 - IN, BACK, SOFT, "the ramp's top edge");
    L(-N0, EDGE, -N1 + IN, BACK, SOFT, "a flare's back edge");
    L(N0, EDGE, N1 - IN, BACK, SOFT, "a flare's back edge");
    L(-92, WALK, 92, WALK, SOFT, "the sidewalk's far edge");
    // the detectable warning field across the ramp's foot: four rows of six domes, foreshortened toward the back
    [[FOOT - 5, 2.7], [FOOT - 12, 2.4], [FOOT - 18, 2.1], [FOOT - 23, 1.9]].forEach(([y, r]) => {
      const t = (FOOT - y) / (FOOT - BACK), half = N1 - IN * t - 7;
      for (let i = 0; i < 6; i++) {
        const x = -half + (2 * half * i) / 5;
        const [px, py] = P(x, Y(x, y));
        a.disk(px, py, r * k, "ink", "a truncated dome");
      }
    });
    // the crosswalk's bars on the road, parallel to the curb, the nearer one leaving through the bottom
    const bar = (x0, x1, y0, y1) => { const [p, q] = [P(x0, Y(0, y0)), P(x1, Y(0, y1))]; a.rect(p[0], p[1], q[0] - p[0], q[1] - p[1], 1.5 * k, SOFT, "a crosswalk bar"); };
    bar(-44, 44, 52, 62);
    bar(-50, 50, 78, 112);
  },
  hall: (a, P, k) => {
    // the hallway mapped: F12's own construction (hallway()) at half its scale, centered in the reticle: the
    // same vanishing point, end wall and doorway, both doors in perspective, the menu by the door, the
    // ceiling panels; the guide strip runs from the reticle's bottom edge to the end wall
    const m = ([x, y]) => P((x - DF.vp[0]) / 2, (y - DF.vp[1]) / 2), s = k / 2;
    const [bx0, by0] = P(BOX[0], BOX[1]), [bx1, by1] = P(BOX[2], BOX[3]);
    const r4 = ([x, y, w, h]) => [...m([x, y]), w * s, h * s];
    const F2 = { vp: m(DF.vp), box: [bx0, by0, bx1, by1] };
    const W2 = { x: m([DW.x, DW.y])[0], y: m([DW.x, DW.y])[1], w: DW.w * s, h: DW.h * s };
    const H2 = {
      doorway: r4(DH.doorway),
      doors: DH.doors.map(([xn, xf, side]) => [m([xn, 0])[0], m([xf, 0])[0], side]),
      menu: r4(DH.menu),
      strip: DH.strip.map(([bx, tag, lk, pin]) => [m([bx, 0])[0], tag, lk, pin]),
      lights: DH.lights.map(([y, w, h]) => [m([0, y])[1], w * s, h * s]),
    };
    hallway(a, F2, W2, H2);
  },
  street: (a, P, k) => {
    // a street described (the hero's, read), filling the reticle as the hero's phone filled with it: the
    // horizon in the upper third, the road running down to it with its center line, the curb and the
    // sidewalk beyond it, a street light standing on the near sidewalk (its post the frame's full height,
    // the arm out over the road, the luminaire and its lit lens) and the street sign on its post past the
    // curb, its plate up near the horizon
    const V = [-6, -46];
    a.seg(P(-92, -46), P(92, -46), SOFT, "the street's horizon");
    a.seg(P(...V), P(-92, 86), INK, "the road edge");
    a.seg(P(...V), P(54, 96), INK, "the road edge");
    a.seg(P(0, -44), P(92, 46), SOFT, "the curb");
    const cl = (y) => [-6 + ((y + 46) / 142) * -12, y];
    for (const [y0, y1] of [[-36, -31], [-22, -12], [2, 20], [38, 66], [84, 96]]) a.seg(P(...cl(y0)), P(...cl(y1)), SOFT, "a lane dash");
    // the street light, its foot on the sidewalk just off the road's edge
    a.seg(P(-84, 74), P(-84, -78), INK, "the street light's post");
    a.arc3(P(-84, -78), P(-81, -85), P(-72, -87), INK, "the street light's arm");
    a.rect(...P(-74, -91), 28 * k, 7 * k, 3.5 * k, INK, "the street light's luminaire");
    a.rect(...P(-70, -86), 18 * k, 2.5 * k, 1.25 * k, look("ink", { fill: "ink" }), "the street light, lit");
    // the street sign past the curb, its plate up near the horizon
    a.seg(P(74, 34), P(74, -60), INK, "the street sign's post");
    a.rect(...P(56, -78), 34 * k, 16 * k, 2 * k, INK, "the street sign");
  },
};
/**
 * On a phone the band looks through the viewfinder: the turned phone's outline closes in around the
 * reticle and becomes the camera's screen (the body an outer frame, the screen an inner one), its island
 * and buttons folding into the frame, so the job draws at about two and a half times the hallway's scale
 * with nothing growing toward the reader.
 */
function phoneAsViewfinder(a, box) {
  const [x0, y0, x1, y1] = box;
  a.rect(x0 - 21, y0 - 21, x1 - x0 + 42, y1 - y0 + 42, 28, INK, "phone body, closed in as the viewfinder's frame", { pin: "body" });
  a.rect(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20, 20, SOFT, "phone screen, the viewfinder", { pin: "screen" });
  const top = y0 - 21, bottom = y1 + 21, cx = (x0 + x1) / 2;
  a.rect(cx, y0 - 10, 0, 0, 0, SOFT, "dynamic island, folded into the screen's edge", { pin: "island", hidden: true });
  for (const [pin, x, y] of [["btnA", cx - 60, bottom], ["btnU", cx - 30, bottom], ["btnD", cx, bottom], ["btnP", cx + 40, top]]) a.line(x, y, x, y, INK, "a button, folded into the frame", { pin, hidden: true });
  const my = (y0 + y1) / 2;
  a.line(x0 - 21, my, x0 - 21, my, INK, "horizon, folded into the frame", { pin: "hzL", hidden: true });
  a.line(x1 + 21, my, x1 + 21, my, INK, "horizon, folded into the frame", { pin: "hzR", hidden: true });
}
/** where the reticle frames each subject (its center, and the box the subject is clipped to) */
export function reticleAt(F, key) {
  const desk = F === DF;
  const k = desk ? RK.desk : RK.phone;
  const half = ((BOX[3] - BOX[1]) / 2) * k;
  return { cx: 300, cy: desk ? Math.max(SC.y + half + 10, ROWS[key]) : 377, k };
}
function reticleWindow(F, key) {
  const { cx, cy, k } = reticleAt(F, key);
  const pad = 2;
  return { x: cx + BOX[0] * k - pad, y: cy + BOX[1] * k - pad, w: (BOX[2] - BOX[0]) * k + 2 * pad, h: (BOX[3] - BOX[1]) * k + 2 * pad, r: 0 };
}
function retargetScene(a, F, key) {
  const desk = F === DF;
  const k = desk ? RK.desk : RK.phone;
  const half = ((BOX[3] - BOX[1]) / 2) * k;
  const cx = 300;
  const cy = desk ? Math.max(SC.y + half + 10, ROWS[key]) : 377;
  const P = (x, y) => [cx + x * k, cy + y * k];
  if (desk) {
    F.phone(a);
    outsideHorizon(a, F, F.vp[1], { left: false, right: false });
  } else phoneAsViewfinder(a, [...P(BOX[0], BOX[1]), ...P(BOX[2], BOX[3])]);
  // the subject is seen only through the reticle: every stroke of it is clipped to it (the window), so
  // nothing of it crosses the phone's bezel while the viewfinder re-targets. Each subject draws with its
  // own set of pieces, alternating (menu and hallway A, curb and street B), so two subjects one after the
  // other never share a stroke: the viewfinder pans from one to the next, the one leaving and the one
  // arriving both in the frame at once (formations/essay.ts pan()).
  const mark = { rect: a.S.rect.length, line: a.S.line.length, arc: a.S.arc.length };
  SUBJECT[key === "statement" ? "street" : key](a, P, k);
  const set = key === "menu" || key === "hall" ? "sA" : "sB";
  for (const kind of ["rect", "line", "arc"]) a.S[kind].slice(mark[kind]).forEach((sp, i) => {
    sp.clip = true;
    sp.pin = `${set}${kind[0]}${String(i + 1).padStart(2, "0")}`;
  });
  // the strokes a subject does not need wait, unseen, at the reticle's center: the point it focuses on
  a.parkLens(cx, cy, 90, "ink", "gathered at the focus");
  a.brackets(...P(BOX[0], BOX[1]), ...P(BOX[2], BOX[3]), 22 * k, INK2, "reticle bracket", { pins: "brk" });
  // the lens just under the viewfinder: the one accent, moving with it
  const R = desk ? 24 : 18, oy = cy + half + (desk ? 14 : 33) + R;
  a.orb(cx, oy, R, desk ? {} : { two: true });
  a.parkLens(cx, oy, 60, "accent");
  if (desk) parkEdges(a, F);
}

// the hero's clip window: the phone's screen (the orb's own box at F04), so a clipped piece only ever draws inside the phone
const SCREEN_WIN = { desk: { x: SC.x, y: SC.y, w: SC.w, h: SC.h, r: SC.r }, phone: { x: MSC.x, y: MSC.y, w: MSC.w, h: MSC.h, r: MSC.r } };

// ---------------------------------------------------------------- the big orb (F04, and its return before the mark)
const C0 = [300, 400];
const ORB = { radii: [150, 126, 102], sw: [1.33, 1.56, 1.8].map((w) => (w * 150) / 50), core: 0.1692 * 150 };
function bigOrb(a, lk = ACC, tag = "orb") {
  // the rings are the phone's own outlines, rounded: body, screen, back wall (or end wall)
  a.circ(...C0, ORB.radii[0], { ...lk, sw: ORB.sw[0] }, `${tag} ring 1`, { pin: "body" });
  a.circ(...C0, ORB.radii[1], { ...lk, sw: ORB.sw[1] }, `${tag} ring 2`, { pin: "screen" });
  a.circ(...C0, ORB.radii[2], { ...lk, sw: ORB.sw[2] }, `${tag} ring 3`, { pin: "wall" });
  a.disk(...C0, ORB.core, lk.stroke, `${tag} core`, { pin: "core" });
  // the small orb's own rings condense into the core (hidden inside the filled disk)
  [17, 12, 7].forEach((r, i) => a.arc(...C0, r, -90, 270, lk, `${tag} small rings, condensed in the core`, { pin: `ring${i + 1}`, hidden: true }));
}
function parkOnOrb(a, radii, sws, lk, cnt = 40) {
  radii.forEach((r, i) => {
    const t = { ...lk, sw: Math.min(2.4, sws[i] - 0.8) };
    a.parkBeads(...C0, r, cnt, t, `bead in ring ${i + 1}`, -90 + i * 11);
    a.parkPlugs(...C0, r, cnt, 0.4, t, `plug in ring ${i + 1}`, -90 + i * 7);
    a.parkOnRing(...C0, r, Math.ceil(cnt / 2), 18, { ...lk, sw: sws[i] }, `laid on ring ${i + 1}`, -90 + i * 13);
  });
  a.parkLens(...C0, 60, lk.stroke);
}

// ---------------------------------------------------------------- the feed (F05) and its 1:1 scroll
const FEED = {
  desk: { win: { x: SC.x, y: 140, w: SC.w, h: 500, r: 0 }, cols: [[186, 228]], pitch: 160, top: 148, img: 110, rows: 6, title: [130, 198], caption: [148, 118] },
  phone: { win: { x: 92, y: 300, w: 452, h: 160, r: 0 }, cols: [[100, 212], [324, 212]], pitch: 140, top: 306, img: 84, rows: 4, title: [100, 176], caption: [116, 100] },
};
function feedCards(a, fd, shift) {
  let n = 0;
  for (let i = 0; i < fd.rows; i++) for (const [x, w] of fd.cols) {
    const t = fd.top + i * fd.pitch - shift;
    // each card keeps its identity through the scroll, so the 1:1 scroll is a pure translation
    a.rect(x, t, w, fd.img, 12, SOFT, "feed card image", { clip: true, pin: `card${n}-img` });
    a.line(x, t + fd.title[0], x + fd.title[1], t + fd.title[0], INK, "feed card title", { clip: true, pin: `card${n}-title` });
    a.line(x, t + fd.caption[0], x + fd.caption[1], t + fd.caption[0], SOFT, "feed card caption", { clip: true, pin: `card${n}-cap` });
    n++;
    // the extra cards a taller feed needs wait stacked on this one, their lines tiled into its lines
    a.parkStackRect(x, t, w, fd.img, 12, 8, SOFT, "stacked on a card");
    a.parkAlong(x + 4, t + fd.title[0], x + fd.title[1] - 4, t + fd.title[0], 6, INK, "tiled into a card title", ["line"], 20);
    a.parkAlong(x + 4, t + fd.caption[0], x + fd.caption[1] - 4, t + fd.caption[0], 6, SOFT, "tiled into a card caption", ["line"], 20);
  }
}
function feedDesk(a, shift) {
  phoneUpright(a);
  // nothing in a feed continues the night's horizon: both of its stubs fold into the phone's edges, and the
  // phone stands alone in the dark (the floor of the first machine grows back out of them)
  outsideHorizon(a, DF, DF.vp[1], { left: false, right: false });
  feedCards(a, FEED.desk, shift);
  a.line(SC.x, 648, SC.x + SC.w, 648, SOFT, "tab bar");
  [204, 252, 348, 396].forEach((x) => a.rect(x - 11, 665, 22, 22, 7, SOFT, "tab"));
  a.orb(300, 676, 12, { single: true, coreR: 4.4 });
  a.parkLens(300, 676, 60, "accent");
  a.parkAlong(SC.x + 6, 648, SC.x + SC.w - 6, 648, 14, SOFT, "tiled into the tab bar");
  parkEdges(a, DF);
}
function feedPhone(a, shift) {
  phoneTurned(a);
  outsideHorizon(a, MF);
  feedCards(a, FEED.phone, shift);
  a.line(MSC.x + 40, 466, MSC.x + MSC.w - 12, 466, SOFT, "tab bar");
  [180, 240, 360, 420].forEach((x) => a.rect(x - 9, 476, 18, 18, 6, SOFT, "tab"));
  a.orb(300, 485, 10, { single: true, coreR: 4.4 });
  a.parkLens(300, 485, 60, "accent");
  // strokes the feed does not need wait in the column gutter between its cards, unseen
  a.parkLens(318, 380, 60, "soft", "gathered in the gutter");
  a.parkAlong(MSC.x + 46, 466, MSC.x + MSC.w - 18, 466, 14, SOFT, "tiled into the tab bar");
  a.parkAlong(-60, MF.vp[1], MF.outside[0] - 4, MF.vp[1], 10, SOFT, "tiled into the horizon");
  a.parkAlong(MF.outside[1] + 4, MF.vp[1], 660, MF.vp[1], 10, SOFT, "tiled into the horizon");
}

// ================================================================ the machines: one floor, the line of progress
const FL = 640;
function floor(a, lk = SOFT) {
  a.line(300 - OUT, FL, 300, FL, lk, "floor (the line of progress)", { pin: "hzL" });
  a.line(300, FL, OUT, FL, lk, "floor (the line of progress)", { pin: "hzR" });
}
function parkFloor(a, n = 30) { a.parkAlong(-60, FL, 660, FL, n, SOFT, "tiled into the floor"); }
/** a lens looking down: the orb's rings as half rings under a camera, its core at their center */
function lensDown(a, cx, cy, R) {
  // small lens: one half ring and the core (three rings would blob at phone size); the other two rings wait inside the core
  a.arc(cx, cy, R, 0, 180, ACC, "orb ring 1 (lens looking down)", { pin: "ring1" });
  a.disk(cx, cy + 1, 4.4, "accent", "orb core (lens)", { pin: "core" });
  [2, 1].forEach((r, i) => a.arc(cx, cy + 1, r, 0, 180, ACC, "orb ring, condensed in the core", { pin: `ring${i + 2}`, hidden: true }));
}
function bookStack(a) {
  a.rect(30, 598, 78, 14, 2, SOFT, "book");
  a.rect(42, 612, 72, 14, 2, SOFT, "book");
  a.rect(34, 626, 80, 14, 2, SOFT, "book");
}
function keyRow(a, y, x0, x1, n, lk = SOFT, tag = "key") {
  const pitch = (x1 - x0) / n;
  for (let i = 0; i < n; i++) a.line(x0 + i * pitch + 4, y, x0 + (i + 1) * pitch - 4, y, lk, tag);
}
const IP = { x: 178, y: 170, w: 244, h: 468, r: 40 };
function iphone(a) {
  a.rect(IP.x, IP.y, IP.w, IP.h, IP.r, INK, "first smartphone body", { pin: "body" });
  a.rect(196, 236, 208, 312, 2, SOFT, "first smartphone screen", { pin: "screen" });
  a.rect(276, 200, 48, 7, 3.5, INK, "earpiece", { pin: "island" });
  a.line(360, 166, 394, 166, INK, "sleep button", { pin: "btnP" });
  a.line(174, 214, 174, 230, INK, "ring switch", { pin: "btnA" }).line(174, 252, 174, 280, INK, "volume up", { pin: "btnU" }).line(174, 292, 174, 320, INK, "volume down", { pin: "btnD" });
  for (const y of [252, 304, 356]) for (const x of [210, 258, 306, 354]) a.rect(x, y, 36, 36, 9, SOFT, "app icon");
  a.line(196, 486, 404, 486, SOFT, "dock shelf");
  for (const x of [210, 258, 306, 354]) a.rect(x, 498, 36, 36, 9, SOFT, "dock icon");
  a.orb(300, 594, 20, { single: true, coreR: 5 });
}
function parkIphone(a) {
  a.parkLens(300, 594, 60, "accent");
  a.parkStackRect(IP.x, IP.y, IP.w, IP.h, IP.r, 8, INK, "stacked on the body");
  // the machine before's steep strokes (a keyboard's sides, a monitor's neck) stand up into the body's long sides
  for (const x of [IP.x, IP.x + IP.w]) a.parkAlong(x, 440, x, 590, 2, INK, "tiled into the body's side", ["line"], 40);
  a.parkAlong(196, 486, 404, 486, 10, SOFT, "tiled into the dock shelf");
  for (const y of [252, 304, 356]) for (const x of [210, 258, 306, 354]) a.parkStackRect(x, y, 36, 36, 9, 1, SOFT, "stacked on an icon");
}

// ================================================================ the climax: the orb returns, then the mark
const MK = 150 / 55;
const MARK = { disk: 10 * MK, bands: [[53 * MK, 4 * MK], [39 * MK, 6 * MK], [23 * MK, 8 * MK]], size: 120 * MK };
function markPieces(a, o = 1) {
  const lk = (sw) => look("ink", { sw, o });
  a.circ(...C0, MARK.bands[0][0], lk(MARK.bands[0][1]), "mark outer band", { pin: "body" });
  a.circ(...C0, MARK.bands[1][0], lk(MARK.bands[1][1]), "mark middle band", { pin: "screen" });
  a.circ(...C0, MARK.bands[2][0], lk(MARK.bands[2][1]), "mark inner band", { pin: "wall" });
  a.circ(...C0, MARK.disk, look("ink", { fill: "ink", o }), "mark center disk", { pin: "core" });
  // the small orb's rings, condensed to the disk's center, unseen: never beside the disk as it moves
  [0, 1, 2].forEach((i) => a.arc(...C0, 0, -90, -90, look("ink", { o: 0 }), "condensed in the disk", { pin: `ring${i + 1}`, hidden: true }));
  const radii = MARK.bands.map((b) => b[0]), sws = MARK.bands.map((b) => b[1]);
  radii.forEach((r, i) => {
    const t = look("ink", { sw: Math.min(3, sws[i] - 1.2), o });
    a.parkBeads(...C0, r, 50, t, `bead in band ${i + 1}`, -90 + i * 9);
    a.parkPlugs(...C0, r, 50, Math.max(0.4, sws[i] - 4), t, `plug in band ${i + 1}`, -90 + i * 5);
    a.parkOnRing(...C0, r, 30, 10, look("ink", { sw: sws[i], o }), `laid on band ${i + 1}`, -90 + i * 13);
  });
  a.parkLens(...C0, 60, "ink");
}

export function defineR1(def) {
  // ============================================================ hero
  def({
    id: "F01-dark", reel: "r1", section: "hero", anchor: "The phone in your pocket can see in the dark.", at: "hero-dark",
    phone: { cx: 300, cy: 400, s: 1, run: "section" },
    window: SCREEN_WIN.desk, mobileWindow: SCREEN_WIN.phone,
    note: "Complete at scroll 0, no draw-on. A phone held up against the night. Outside it the street runs on in soft and bare (a roofline stepping along the horizon, the sidewalk's edges running out past the phone to the pane's foot); inside its screen the same street is legible, drawn in ink: a skyline of three buildings in elevation as one stepped line, a few lit windows on each building's own grid, the road to the vanishing point with its lane dashes and curbs, a street light on the right-hand sidewalk (its post, the arm out over the road, the luminaire with its lit lens), and half a block away a tiny street sign. Soft corner brackets mark the camera's view. The orb, the phone's seeing element, sits low on the screen where the app puts it, the one accent. The horizon crosses the bezel, so the screen reads as a window onto the dark, not a picture.",
    mobileNote: "Phone: the same phone turned a quarter turn, the way people hold it to take a picture, whole in the landscape pocket; the street recomposed wide inside it (skyline left of the island, the lamp to the right, the far sign at the vanishing point, the orb at the bottom center). The horizon still runs out past both ends of the phone.",
    build: (a) => { DF.phone(a); outsideHorizon(a, DF); outsideCity(a, DF); street(a, DF); a.brackets(...DF.view, SOFT, "view bracket", { pins: "brk" }); a.orb(...DF.orb); loupeInLens(a, DF); parkScene(a, DF); },
    mobile: (a) => { MF.phone(a); outsideHorizon(a, MF); street(a, MF); a.brackets(...MF.view, SOFT, "view bracket", { pins: "brk" }); a.orb(...MF.orb, { two: true }); loupeInLens(a, MF); parkScene(a, MF); },
  });
  // the small orb on a phone's band: two rings, 3px or more apart
  const lensOrb = (a, F) => a.orb(...F.orb, F === MF ? { two: true } : {});
  const signScene = (a, F) => {
    F.phone(a); outsideHorizon(a, F, F.vp[1], F === DF ? { pointer: 24 } : {}); outsideCity(a, F); street(a, F);
    const L = F.loupe;
    a.circ(...L.c, L.R, INK, "loupe", { pin: "wall" });
    a.rect(...L.blade, INK, "the sign at reading size");
    a.line(L.bar[0], L.bar[1], L.bar[2], L.bar[1], INK2, "its street name, as one bar");
    a.line(L.c[0], L.post[1], L.c[0], L.post[2], INK, "its post at reading size");
    // the cone: from the focus brackets' two top corners to the loupe's tangents, each on its own side
    const [fx0, fy0, fx1] = L.focus;
    for (const [px, side] of [[fx0, -1], [fx1, 1]]) {
      const d = Math.hypot(px - L.c[0], fy0 - L.c[1]), th = Math.atan2(fy0 - L.c[1], px - L.c[0]), off = Math.acos(L.R / d);
      const cands = [th + off, th - off].map((t) => [L.c[0] + L.R * Math.cos(t), L.c[1] + L.R * Math.sin(t)]);
      const q = cands.sort((u, v) => side * (v[0] - u[0]))[0];
      a.seg([px, fy0], q, SOFT, "callout line");
    }
    a.brackets(...L.focus, INK, "focus bracket", { pins: "brk" });
    lensOrb(a, F);
    parkScene(a, F);
  };
  def({
    id: "F02-sign", reel: "r1", section: "hero", anchor: "It can read a street sign from half a block away.", at: "hero-sign",
    phone: { cx: 300, cy: 400, s: 1, run: "item" },
    window: SCREEN_WIN.desk, mobileWindow: SCREEN_WIN.phone,
    note: "Nothing in the street moves. The view brackets close in on the far sign, which stays tiny in its place, and the lens's view opens above it: a loupe (it rises out of the orb) holding the sign at reading size, its blade, its name as one heavy bar, its post, joined to the bracketed sign by two callout lines. Accent: the orb only; the focus brackets are ink.",
    move: { first: ["focus bracket", "loupe"] },
    build: (a) => signScene(a, DF),
    mobile: (a) => signScene(a, MF),
  });
  const roomScene = (a, F, W, R) => { F.phone(a); outsideHorizon(a, F, F.vp[1], { right: false, ...(F === DF ? { pointer: 24 } : {}) }); room(a, F, W, R); lensOrb(a, F); parkScene(a, F, { road: false, right: false, edges: true }); a.parkAlong(W.x, W.y, W.x + W.w, W.y, 10, SOFT, "tiled into the back wall"); };
  def({
    id: "F03-room", reel: "r1", section: "hero", anchor: "It can map a room in 3D while you walk through it.", at: "hero-room",
    phone: { cx: 300, cy: 400, s: 1, run: "item" },
    window: SCREEN_WIN.desk, mobileWindow: SCREEN_WIN.phone,
    note: "The street folds into a room on the same vanishing point: the road edges become the floor's lines, the horizon the back wall's floor line, the loupe squares into the back wall. The room is drawn the way the phone measures it: corner rays, the floor and ceiling as a mesh, ink depth points at its crossings and corners, a door, and the couch the room is mapped around (the AR couch the pace section answers). Accent: the orb only.",
    move: { stagger: 0.6, groups: ["phone", "horizon", "back wall", "floor line", "corner ray", "floor", "ceiling", "door", "couch", "depth point", "orb"] },
    affinity: [["road edge", "floor line"], ["curb", "floor mesh"], ["lane dash", "floor center"], ["skyline", "ceiling"], ["horizon (seen)", "back wall floor"], ["lit window", "depth point"], ["view bracket", "corner ray"], ["focus bracket", "depth point"], ["far sign", "door"], ["the sign at reading size", "couch"], ["its", "couch"], ["callout", "corner ray"], ["street lamp", "door"], ["loupe", "back wall"]],
    build: (a) => roomScene(a, DF, DW, DR),
    mobile: (a) => roomScene(a, MF, MW, MR),
  });
  def({
    id: "F04-orb", reel: "r1", section: "hero", anchor: "It can run AI with no connection at all.", at: "hero-ai",
    phone: { cx: 300, cy: 400, s: 1, run: "item" },
    window: { x: 150, y: 140, w: 300, h: 500, r: 0 },
    move: { stagger: 0.6, groups: ["orb", "phone", "back wall", "horizon", "corner ray", "floor", "ceiling", "couch", "door", "depth point"] },
    note: "Nothing grows toward the reader: every outline contracts. The phone body rounds into the outer ring, the screen into the second, the back wall into the third, and the small orb condenses into the core while it rises to the stage center (300, 400). The room's lines lie down in the rings as plugs, beads and laid segments; the horizon outside folds in too. Nothing is left outside the orb: it needs nothing else. R 150, rings 100/84/68%, widths and core exactly Orb.tsx x 3. This rect, center and scale is where the mark lands at the pivot (desktop and pocket alike: the pocket shows it at s 1, 300 units across, about 46vw on a 393 phone).",
    build: (a) => {
      bigOrb(a); parkOnOrb(a, ORB.radii, ORB.sw, ACC);
      // the horizon stops short of the orb, a pointer like the others (the stage's leader, at "no connection
      // at all": it never touches the orb); the far side is reeled into its outer ring
      a.line(-OUT + 300, 400, 150 - 24, 400, SOFT, "horizon, pointing at the orb", { pin: "hzL" });
      a.line(450, 400, 450, 400, look("accent", { sw: ORB.sw[0] - 1.2 }), "horizon, reeled into the orb", { pin: "hzR", hidden: true });
    },
    // A phone's cue is the orb's core beside the sentence, so its orb needs no leader: both sides of the
    // horizon reel into the outer ring, and every later pocket opens out of this orb with nothing else in view.
    mobile: (a) => {
      bigOrb(a); parkOnOrb(a, ORB.radii, ORB.sw, ACC);
      a.line(150, 400, 150, 400, look("accent", { sw: ORB.sw[0] - 1.2 }), "horizon, reeled into the orb", { pin: "hzL", hidden: true });
      a.line(450, 400, 450, 400, look("accent", { sw: ORB.sw[0] - 1.2 }), "horizon, reeled into the orb", { pin: "hzR", hidden: true });
    },
  });
  def({
    id: "F05-feed", reel: "r1", section: "hero", anchor: "Most people use it to scroll.", at: "hero-scroll",
    phone: { cx: 300, cy: 400, s: 1, run: "item" },
    window: FEED.desk.win, mobileWindow: FEED.phone.win,
    note: "The same phone against the same dark horizon as the first frame, and this is what it is used for: a feed of identical cards (image, title, caption). The orb is shrunk to one small icon in the tab bar, between four other tabs: the capability, ignored. Cards are clip pieces inside the feed window (the screen between the island and the tab bar).",
    mobileNote: "Phone: the turned phone again, with the feed in two columns of identical cards and the tab bar along the bottom, the orb its middle tab.",
    move: { stagger: 0.6, groups: ["phone", "dynamic island", "action", "volume", "side", "horizon", "orb", "tab", "feed card image", "feed card"] },
    build: (a) => feedDesk(a, 0),
    mobile: (a) => feedPhone(a, 0),
  });
  def({
    id: "F05s-scroll", reel: "r1", section: "hero", beat: "the feed scrolls 1:1", anchor: "Ryan Higgins, founder of fathom", at: "hero-scroll", hold: "Ryan Higgins, founder of fathom",
    phone: { cx: 300, cy: 400, s: 1, run: "item" },
    window: FEED.desk.win, mobileWindow: FEED.phone.win,
    note: "Not a new drawing: the feed scrolled by exactly two card pitches (320 units; 280 on the phone), moved by the reader's own scroll (ease linear, stagger 0, bend 0, runway = the scroll distance in px, so cards move exactly with the page). Cards leave through the window's top edge and the ones waiting below enter through its bottom, so nothing pops; the end frame is identical to F05 (identical cards): the deflation's joke. It ends when the hero text un-pins, before 'Accessibility always arrives second.'",
    move: { ease: "linear", stagger: 0, bend: 0, order: "pool" },
    build: (a) => feedDesk(a, 2 * FEED.desk.pitch),
    mobile: (a) => feedPhone(a, 2 * FEED.phone.pitch),
  });

  // ============================================================ the machines
  def({
    id: "F06-cctv", reel: "r1", section: "arrives", anchor: "A CCTV magnifier too big to leave the room.", at: "era-1",
    phone: { cx: 296, cy: 378, s: 0.74 },
    note: "A 1980s desktop CCTV in front elevation, drawn as the object it was: a big monitor housing (the phone lies down into it, screen into screen) showing three lines of huge words, a column of knobs and a power light; a neck down to the camera head and the column behind the reading table that carries them both, whose lens is the orb looking down (half rings) at an open book on the X-Y reading table; the table's rails, a heavy base on two feet, and a power cord that sags to a wall outlet: tethered. Books wait on the floor. The floor is the line of progress every machine stands on; it is the hero's horizon, come down to the ground. The feed's cards close up into the base and the books.",
    move: { stagger: 0.6, groups: ["floor", "monitor", "power light", "knob", "neck", "camera head", "orb", "column", "X-Y", "base", "foot", "open book", "table rail", "magnified word", "book", "power cord", "wall outlet"] },
    // the feed folds into the monitor: its cards close up onto the screen's outline and lie down in it, their
    // lines become the screen's huge words; nothing of the feed crosses the stand
    affinity: [["phone body", "monitor housing"], ["phone screen", "monitor screen"], ["feed card image", "folded into the monitor's screen"], ["feed card title", "magnified word"], ["feed card caption", "magnified word"], ["feed card", "tiled into a word"], ["tab", "knob"], ["tab bar", "X-Y"], ["horizon", "floor"]],
    build: (a) => {
      floor(a);
      a.rect(140, 112, 320, 240, 16, INK, "monitor housing", { pin: "body" });
      a.rect(160, 132, 232, 200, 12, SOFT, "monitor screen", { pin: "screen" });
      [[184, 186, 270], [290, 186, 362], [184, 234, 318], [338, 234, 368], [184, 282, 252]].forEach(([x1, y, x2]) => a.line(x1, y, x2, y, INK2, "magnified word"));
      [176, 214, 252].forEach((y) => a.circ(426, y, 8, SOFT, "knob"));
      a.disk(426, 306, 3.2, "ink", "power light", { pin: "island" });
      a.rect(286, 352, 28, 30, 2, INK, "neck");
      a.rect(250, 382, 100, 30, 10, INK, "camera head");
      lensDown(a, 300, 412, 18);
      // the column that carries monitor and camera, rising from the back of the base behind the reading table
      a.line(289, 436, 289, 498, SOFT, "column").line(311, 436, 311, 498, SOFT, "column");
      a.line(289, 526, 289, 556, SOFT, "column").line(311, 526, 311, 556, SOFT, "column");
      a.arc3([206, 506], [252, 492], [298, 503], INK, "open book, left page");
      a.arc3([302, 503], [348, 492], [394, 506], INK, "open book, right page");
      a.rect(168, 508, 264, 14, 4, INK, "X-Y reading table");
      a.line(206, 522, 206, 560, SOFT, "table rail").line(394, 522, 394, 560, SOFT, "table rail");
      a.rect(120, 560, 360, 66, 12, INK, "base");
      a.rect(142, 626, 36, 14, 4, SOFT, "foot").rect(422, 626, 36, 14, 4, SOFT, "foot");
      a.arc3([480, 604], [516, 637], [549, 594], SOFT, "power cord");
      a.rect(538, 556, 22, 38, 4, SOFT, "wall outlet");
      bookStack(a);
      parkFloor(a);
      a.parkLens(300, 413, 60, "accent");
      a.parkStackRect(120, 560, 360, 66, 12, 8, INK, "stacked on the base");
      a.parkStackRect(160, 132, 232, 200, 12, 8, SOFT, "folded into the monitor's screen");
      a.parkAlong(184, 186, 270, 186, 4, INK2, "tiled into a word");
      a.parkAlong(290, 186, 362, 186, 4, INK2, "tiled into a word");
      a.parkAlong(184, 234, 318, 234, 4, INK2, "tiled into a word");
    },
  });
  def({
    id: "F07-portable", reel: "r1", section: "arrives", anchor: "A portable one, portable in name only.", at: "era-2",
    phone: { cx: 300, cy: 436, s: 0.98 },
    note: "The monitor squats into a heavy case and the stand folds away into it: the portable CCTV, in name only. A boxy case on two feet like a small television: the screen with its huge words takes the top, a column of knobs and a speaker grille beside it, a control strip with a row of push buttons underneath. On top, a comically small carry handle (the camera head, shrunk): the joke. The camera is now a hand-held mouse camera on a coiled cord, resting on a page on the floor, the orb as its lens window. The books hold.",
    move: { first: ["portable case", "portable screen"] },
    build: (a) => {
      floor(a);
      a.rect(148, 300, 304, 316, 22, INK, "portable case", { pin: "body" });
      a.rect(170, 324, 206, 168, 12, SOFT, "portable screen", { pin: "screen" });
      [[192, 370, 268], [286, 370, 344], [192, 424, 300]].forEach(([x1, y, x2]) => a.line(x1, y, x2, y, INK2, "magnified word"));
      [350, 382, 414].forEach((y) => a.circ(412, y, 8, SOFT, "knob"));
      [446, 458, 470, 482].forEach((y) => a.line(398, y, 428, y, SOFT, "speaker grille"));
      a.line(170, 514, 430, 514, SOFT, "control strip");
      [186, 222, 258].forEach((x) => a.rect(x, 534, 24, 14, 4, SOFT, "push button"));
      a.disk(410, 541, 3.2, "ink", "power light", { pin: "island" });
      a.rect(281, 286, 38, 14, 7, INK, "carry handle (tiny)");
      a.rect(170, 616, 30, 24, 4, SOFT, "foot").rect(400, 616, 30, 24, 4, SOFT, "foot");
      a.line(462, 636, 572, 636, INK, "a page on the floor");
      a.rect(476, 598, 80, 36, 16, INK, "mouse camera");
      a.orb(516, 616, 10, { single: true, coreR: 3.6 });
      a.arc3([452, 520], [480, 552], [486, 598], SOFT, "camera cord");
      bookStack(a);
      parkFloor(a);
      a.parkLens(516, 616, 60, "accent");
      a.parkStackRect(148, 300, 304, 316, 22, 8, INK, "stacked on the case");
      a.parkAlong(170, 514, 430, 514, 8, SOFT, "tiled into the control strip");
    },
  });
  def({
    id: "F08-dos", reel: "r1", section: "arrives", anchor: "ZoomText on a DOS laptop.", at: "era-3",
    phone: { cx: 300, cy: 436, s: 0.98 },
    note: "The case tilts back into an early-90s laptop lid and its lower half lays down into the deck, drawn from slightly above in plain perspective: the monochrome LCD with two words of huge DOS text and a block cursor, three rows of keys, a palm rest where the orb rides as the trackball between its two buttons, a thick front edge on two feet. The books thin into a stack of floppy disks.",
    build: (a) => {
      floor(a);
      a.rect(168, 232, 264, 236, 12, INK, "laptop lid", { pin: "body" });
      a.rect(190, 254, 220, 192, 4, SOFT, "monochrome LCD", { pin: "screen" });
      a.line(212, 306, 316, 306, INK2, "huge DOS word").line(334, 306, 380, 306, INK2, "huge DOS word");
      a.line(212, 356, 280, 356, INK2, "huge DOS word");
      a.rect(298, 344, 14, 22, 1, look("ink", { fill: "ink" }), "block cursor", { pin: "island" });
      a.line(168, 474, 432, 474, INK, "hinge edge");
      a.line(168, 474, 124, 600, INK, "deck side").line(432, 474, 476, 600, INK, "deck side");
      a.rect(124, 600, 352, 26, 6, INK, "front edge");
      a.rect(144, 626, 30, 14, 4, SOFT, "foot").rect(426, 626, 30, 14, 4, SOFT, "foot");
      keyRow(a, 494, 190, 410, 8);
      keyRow(a, 516, 182, 418, 8);
      a.line(178, 540, 224, 540, SOFT, "key").line(236, 540, 364, 540, SOFT, "space bar").line(376, 540, 422, 540, SOFT, "key");
      a.orb(300, 572, 12, { single: true, coreR: 4.2 });
      a.rect(256, 566, 26, 12, 5, SOFT, "trackball button").rect(318, 566, 26, 12, 5, SOFT, "trackball button");
      [616, 624, 632].forEach((y, i) => a.rect(40 + i * 3, y, 64, 8, 1, SOFT, "floppy disk"));
      parkFloor(a);
      a.parkLens(300, 572, 60, "accent");
      a.parkAlong(168, 474, 432, 474, 12, INK, "tiled into the hinge");
      a.parkStackRect(124, 600, 352, 26, 6, 8, INK, "stacked on the front edge");
    },
  });
  def({
    id: "F09-windows", reel: "r1", section: "arrives", anchor: "ZoomText on Windows.", at: "era-4",
    phone: { cx: 300, cy: 410, s: 0.86 },
    note: "The laptop's lid stands up into a mid-90s CRT monitor on the desk, in front elevation: the bezel with its deep chin and power button, the screen inset, a short swivel neck on its round foot; the deck lies down into the keyboard in front of it (the same plain perspective from slightly above: its back edge, its sides, three rows of keys, the front edge on two feet on the line of progress), and the trackball's buttons into the mouse beside it. On the screen, Windows: the floppies stand up into a column of desktop icons with their labels, a window (title bar and its three buttons, a menu, the client area, a scroll bar and its thumb), the taskbar along the screen's foot (start button, two tasks, the clock). The trackball rises into ZoomText's round magnifier over the body text, two lines of it huge inside; the text lines stop at the lens rather than run behind it.",
    move: { first: ["monitor bezel", "monitor screen"] },
    affinity: [["laptop lid", "monitor bezel"], ["monochrome LCD", "monitor screen"], ["hinge edge", "keyboard's back edge"], ["deck side", "keyboard side"], ["front edge", "keyboard's front edge"], ["foot", "keyboard foot"], ["key", "a key"], ["space bar", "the space bar"], ["floppy disk", "desktop icon"], ["trackball button", "mouse"], ["huge DOS word", "magnified text"]],
    build: (a) => {
      floor(a);
      // the monitor: bezel and chin, the screen inset, the power button; a short neck on a round swivel foot
      const B = { x: 128, y: 168, w: 344, h: 286, r: 18 }, S = { x: 148, y: 186, w: 304, h: 228, r: 10 };
      a.rect(B.x, B.y, B.w, B.h, B.r, INK, "monitor bezel", { pin: "body" });
      a.rect(S.x, S.y, S.w, S.h, S.r, SOFT, "monitor screen", { pin: "screen" });
      a.rect(418, 428, 26, 10, 5, INK, "monitor power button", { pin: "island" });
      a.line(274, 454, 266, 470, INK, "monitor neck").line(326, 454, 334, 470, INK, "monitor neck");
      a.rect(212, 470, 176, 16, 8, INK, "monitor foot");
      // the keyboard in front, seen from slightly above like the laptop's deck: its back edge meets the
      // monitor's foot (both stand on the desk), its sides, three rows of keys, the front edge on two feet
      a.line(178, 486, 422, 486, INK, "keyboard's back edge");
      a.line(178, 486, 138, 600, INK, "keyboard side").line(422, 486, 462, 600, INK, "keyboard side");
      a.rect(138, 600, 324, 22, 6, INK, "keyboard's front edge");
      a.rect(158, 622, 30, 18, 4, SOFT, "keyboard foot").rect(412, 622, 30, 18, 4, SOFT, "keyboard foot");
      keyRow(a, 510, 180, 420, 8, SOFT, "a key");
      keyRow(a, 538, 170, 430, 8, SOFT, "a key");
      a.line(162, 568, 212, 568, SOFT, "a key").line(224, 568, 376, 568, SOFT, "the space bar").line(388, 568, 438, 568, SOFT, "a key");
      // the mouse beside it, its cord plugged in at the keyboard's rear right corner and draping to its nose
      a.rect(484, 588, 38, 52, 18, INK, "mouse");
      a.line(503, 590, 503, 610, SOFT, "mouse button split");
      a.arc3([424, 487], [482, 508], [503, 588], SOFT, "mouse cord");
      // on the screen: desktop icons with their labels, down the left
      [204, 248, 292].forEach((y) => a.rect(164, y, 24, 20, 3, SOFT, "desktop icon").line(162, y + 30, 190, y + 30, SOFT, "desktop icon label"));
      // a window: frame, title bar and its three buttons, a menu, the client area, the scroll bar and thumb
      const W = { x: 204, y: 198, w: 234, h: 182 };
      a.rect(W.x, W.y, W.w, W.h, 3, INK, "window frame");
      a.line(W.x, 218, W.x + W.w, 218, INK, "title bar");
      [394, 408, 422].forEach((x) => a.rect(x, 203, 11, 10, 2, SOFT, "title button"));
      [[212, 232], [242, 266], [276, 296]].forEach(([x1, x2]) => a.line(x1, 230, x2, 230, SOFT, "menu item"));
      a.rect(212, 240, 206, 132, 2, SOFT, "client area");
      a.rect(422, 240, 10, 132, 2, SOFT, "scroll bar");
      a.rect(423.5, 256, 7, 30, 3, INK, "scroll thumb");
      // ZoomText's lens over the body text, two lines of it huge inside; the text stops at the lens
      const L = [314, 306, 44];
      a.orb(L[0], L[1], L[2], { single: true, big: false, coreR: 4.4 });
      a.line(286, 290, 344, 290, INK2, "magnified text").line(286, 322, 330, 322, INK2, "magnified text");
      for (const y of [252, 360]) a.line(222, y, y < 300 ? 408 : 384, y, SOFT, "body text");
      for (const y of [279, 306, 333]) {
        const dy = y - L[1], half = Math.sqrt(Math.max(0, (L[2] + 10) ** 2 - dy * dy));
        a.line(222, y, L[0] - half, y, SOFT, "body text");
        a.line(L[0] + half, y, 408, y, SOFT, "body text");
      }
      // the taskbar along the screen's foot: start button, two tasks, the clock
      a.line(S.x, 390, S.x + S.w, 390, SOFT, "taskbar");
      a.rect(156, 395, 40, 13, 2, INK, "start button");
      a.rect(204, 395, 62, 13, 2, SOFT, "task button").rect(272, 395, 62, 13, 2, SOFT, "task button");
      a.rect(404, 395, 40, 13, 2, SOFT, "clock");
      parkFloor(a);
      a.parkLens(L[0], L[1], 60, "accent");
      a.parkAlong(178, 486, 422, 486, 12, INK, "tiled into the keyboard's back edge");
      a.parkStackRect(B.x, B.y, B.w, B.h, B.r, 8, INK, "stacked on the bezel");
      a.parkStackRect(138, 600, 324, 22, 6, 6, INK, "stacked on the keyboard's front edge");
    },
  });
  def({
    id: "F10-smartphone", reel: "r1", section: "arrives", anchor: "Accessibility built in from day one.", at: "era-5",
    phone: { cx: 300, cy: 404, s: 0.86 },
    note: "The window tightens into the first smartphone, standing tall on the line of progress: a real leap after the small machines. Front elevation with the 2007 proportions (61 x 115), big bezels, the earpiece, the ring switch and volume buttons, the sleep button on top, twelve app icons and a dock of four (the desktop icons and task buttons become apps), and the orb as the home button: the triple-click that turns on VoiceOver.",
    build: (a) => { floor(a); iphone(a); parkFloor(a); parkIphone(a); },
  });
  def({
    id: "F11-ceiling", reel: "r1", section: "ceiling", anchor: "Then it stopped.", at: "beat-stop", hold: "Good enough became the ceiling. … settle for good enough.", holdAt: "ceil-end",
    phone: { cx: 300, cy: 388, s: 0.8 },
    note: "The halt and the ceiling are one image. The line of progress lifts off the floor and stops dead as a ceiling, drawn in architectural section (a heavy line, hatching above it), just above the phone's head: the sleep button touches it. The phone does not move. A short piece of floor stays under it. Then nothing moves at all through 'Good enough became the ceiling.' and its paragraph.",
    // one rigid layer: the line lifts straight up, each hatch tick rising from the floor directly beneath it
    move: { first: ["the ceiling", "floor"], stagger: 0, bend: 0 },
    affinity: [["tiled into the floor", "ceiling hatch"]],
    build: (a) => {
      a.line(300 - OUT, 160, 300, 160, INK2, "the ceiling", { pin: "hzL" });
      a.line(300, 160, OUT, 160, INK2, "the ceiling", { pin: "hzR" });
      for (let x = -4; x + 30 <= 602; x += 48) a.line(x, 158, x + 30, 128, SOFT, "ceiling hatch");
      iphone(a);
      a.line(150, FL, 450, FL, SOFT, "the floor it stood on");
      a.parkAlong(150, FL, 450, FL, 16, SOFT, "tiled into the floor");
      a.parkAlong(-60, 160, 660, 160, 20, INK2, "tiled into the ceiling");
      parkIphone(a);
    },
  });

  // ============================================================ pace: the hallway, F03's room re-targeted
  const paceScene = (a, F, W, H, ret) => {
    F.phone(a); outsideHorizon(a, F, F.vp[1], { left: false, right: false }); hallway(a, F, W, H);
    a.brackets(...ret, INK2, "reticle bracket", { pins: "brk" });
    lensOrb(a, F);
    parkScene(a, F, { road: false, left: false, right: false, edges: true });
    a.parkAlong(W.x, W.y, W.x + W.w, W.y, 10, SOFT, "tiled into the end wall");
    // the ceiling's hatch folds into the top of the screen it drops onto
    const S = F === DF ? SC : MSC;
    a.parkAlong(S.x + S.r + 8, S.y, S.x + S.w - S.r - 8, S.y, 14, SOFT, "tiled into the screen's top edge", ["line"], 20);
  };
  def({
    id: "F12-hallway", reel: "r1", section: "pace", anchor: "Catch up now. Keep pace from here.", at: "pace-h2",
    phone: { cx: 300, cy: 400, s: 1 },
    note: "The phone you already own, now pointed at the right problem. The ceiling lets go: it drops onto the phone and folds into its edges, and its hatching slides into the top of the screen. The hallway is F03's room re-targeted: the same vanishing point and the same back wall, the couch gone; the back wall is now a doorway with the street's horizon through it, doors on both walls (one with a menu beside it), a tactile guide strip down the floor, square ceiling panels overhead, in true perspective from the vanishing point. The reticle (ink, emphasis weight) is the camera's view; the orb sits where it sat in the hero, the one accent.",
    move: { stagger: 0.6, bend: 0, groups: ["horizon", "phone", "dynamic island", "action", "volume", "side", "end wall", "doorway", "the street", "corner ray", "tactile", "left door", "right door", "menu", "ceiling light", "reticle", "orb"] },
    affinity: [["the ceiling", "horizon"], ["ceiling hatch", "tiled into the screen's top"], ["first smartphone body", "phone body"], ["first smartphone screen", "phone screen"], ["app icon", "ceiling light"], ["app icon", "reticle"], ["dock icon", "menu"], ["dock shelf", "the street"], ["the floor it stood on", "tactile"]],
    build: (a) => paceScene(a, DF, DW, DH, RET.desk.view),
    mobile: (a) => paceScene(a, MF, MW, MH, RET.phone.view),
  });
  const RETARGET = (id, at, anchor, key, note) => def({
    id, reel: "r1", section: "pace", beat: "reticle retarget", anchor, at, phone: { cx: 300, cy: 400, s: 1, run: "item" },
    window: reticleWindow(DF, key), mobileWindow: reticleWindow(MF, key),
    note, move: { stagger: 0, bend: 0 },
    build: (a) => retargetScene(a, DF, key),
    mobile: (a) => retargetScene(a, MF, key),
  });
  RETARGET("F12a-menu", "pair-1-pointed", "Pointed at: Reading a menu", "menu", "The viewfinder re-targets: the hallway folds into a bifold menu held open to the camera (on each panel a course's heading over its rule, dishes ranged left, prices in a column of their own, a second course), filling the reticle, level with 'Reading a menu'. The lens sits just under the reticle; on a phone the band zooms into the viewfinder.");
  RETARGET("F12b-curb", "pair-2-pointed", "Pointed at: Finding a curb", "curb", "The menu lies down into a curb, drawn the way an architect shows a step: in one-point perspective from the road, looking along the curb, its near end cut by the picture so its L reads first (the sidewalk's top, the riser dropping to the gutter, the road). From that L the curb's edge (heavy) and the gutter run off toward the vanishing point with the riser's face between them. Further along, the curb ramp: the edge dips down its flare to the gutter, the ramp meets the road flush and climbs back up its far flare, and the detectable warning field lies across its foot, domes in rows; the crosswalk's two lines come across the road to it. No horizon line, no ellipse. Level with 'Finding a curb'.");
  RETARGET("F12c-hall", "pair-3-pointed", "Pointed at: Mapping a hallway", "hall", "The curb stands up into the hallway mapped: F12's own construction at half scale (the end wall and its doorway, both doors, the menu by the door, the ceiling panels), the guide strip running from the reticle's bottom edge to the end wall. Level with 'Mapping a hallway'.");
  RETARGET("F12d-street", "pair-4-pointed", "Pointed at: Describing a street", "street", "The hallway opens onto a street: the horizon in the reticle's upper third, the road to it with its center line, the curb and the sidewalk, a street light standing on the near sidewalk and the street sign past the curb (the hero's lamp and far sign, read), filling the frame. Level with 'Describing a street'.");
  RETARGET("F12e-statement", "pace-p2", "Point that tech at the right problems and accessibility catches up fast.", "statement", "Once the pairs let go, the viewfinder rises with them to the statement that closes them, the street still in it: level with 'Point that tech at the right problems'. Nothing in it changes; the whole camera moves as one.");

  // ============================================================ the climax
  def({
    id: "V13-orb-returns", via: true, reel: "r1", section: "pace", anchor: "Then it has to keep up. AI gets better every few months.", at: "pace-p3",
    hold: "Accessibility tools should too, at the same speed, not a decade behind.", holdAt: "pace-p3 (bottom edge)",
    phone: { cx: 300, cy: 400, s: 1, run: "section" },
    note: "The same move as F03 to F04, on purpose: the phone body rounds into ring 1, the screen into ring 2, the end wall into ring 3, and the orb rises into the core at the stage center. The hallway's rays lie down along the frame first, then fold into the rings: nothing rushes at the reader. The orb is back at exactly F04's rect (300, 400, R 150) and holds still while 'Then it has to keep up' is read. Runs in a widened gap between pace-p2 and pace-p3.",
    move: { stagger: 0.6, groups: ["orb", "phone", "end wall", "doorway", "horizon", "corner ray", "reticle", "tactile", "left door", "right door", "menu", "ceiling light", "the street"] },
    build: (a) => { bigOrb(a); parkOnOrb(a, ORB.radii, ORB.sw, ACC); },
  });
  def({
    id: "F13-mark", reel: "r1", section: "pivot", anchor: "That’s why I built fathom.", at: "pace-end",
    phone: { cx: 300, cy: 400, s: 1, run: "climax" },
    note: "On the pace-end runout, never while a sentence is read: the orb's rings re-space onto the mark's band centerlines (150 to 144.5, 126 to 106.4, 102 to 62.7; only contraction) and take the bands' widths (10.9, 16.4, 21.8), the core grows into the center disk (25.4 to 27.3), and the color turns from accent to the mark's own ink. Every other piece lies inside a band (beads, plugs, laid segments, thinner than the band). The union of the pieces is the mark's geometry, at F04's rect.",
    move: { first: ["mark"] },
    build: (a) => markPieces(a, 1),
  });
  def({
    id: "F13x-exact", reel: "r1", section: "pivot", beat: "brand path takes over", anchor: "That’s why I built fathom.", at: "pivot-stage",
    phone: { cx: 300, cy: 400, s: 1, run: "climax" },
    mark: { cx: 300, cy: 400, size: Math.round(MARK.size * 100) / 100, o: 1, role: "ink" },
    note: "A 6svh crossfade with nothing moving: the exact <Mark> path (120 master, uniform scale 327.27 units across, centered at 300,400) rises over the pieces first, then the pieces fade under it (one group opacity, never per piece, so coincident bands never composite into seams). From here the brand mark is never an approximation: the static still for reel 1's end draws this formation (mark only). The pivot pins with this mark held at F04's viewport rect; the iris clip opens from the mark's center (r 0) and navy floods under and through the rings while the mark stays exact (light theme: ink mark outside the iris circle, bone mark inside it).",
    move: { ease: "crossfade", stagger: 0, bend: 0 },
    build: (a) => markPieces(a, 0),
  });
  def({
    id: "R2-mark", reel: "r2", section: "people", beat: "reel 2 opens on the exact mark", anchor: "(after the pivot)", at: "pivot-stage (end)",
    phone: { cx: 300, cy: 400, s: 1, run: "climax" },
    mark: { cx: 300, cy: 400, size: Math.round(MARK.size * 100) / 100, o: 1, role: "ink" },
    note: "Reel 2's opening frame is reel 1's last: the exact mark at the same viewport rect, as the navy iris closes back over it. Pieces wait under it at o 0 in the mark's geometry.",
    build: (a) => markPieces(a, 0),
  });
  def({
    id: "R2-pieces", reel: "r2", section: "people", beat: "back to pieces", anchor: "(the pivot releases)", at: "people-h2 (offset -30svh)",
    phone: { cx: 300, cy: 400, s: 1, run: "climax" },
    note: "The reverse crossfade, 6svh, nothing moving: pieces rise under the mark, then the exact path fades. Scrolling back plays it the other way, so the reader always sees the exact mark at rest.",
    move: { ease: "crossfade", stagger: 0, bend: 0 },
    build: (a) => markPieces(a, 1),
  });
}
