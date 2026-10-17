// Curves for the drawings: author a contour as an SVG path (M L H V C S Q T Z,
// absolute or relative), and it is cut into the pool's own pieces: circular
// arcs (each fitted through three points of a cubic and checked against it)
// and straight lines where the curve is straight. Every drawing stays made of
// the engine's three kinds, so it still travels, turns and bends into the next.
import { circum, dist } from "./lib.mjs";

const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi;
/** parse a path into segments: {type:'L', p, q} | {type:'C', p0, p1, p2, p3} */
export function parsePath(d) {
  const toks = d.match(/[MLHVCSQTZmlhvcsqtz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi);
  const segs = [];
  let i = 0, cmd = null, cur = [0, 0], start = [0, 0], lastC = null, lastQ = null;
  const num = () => Number(toks[i++]);
  while (i < toks.length) {
    if (/[a-z]/i.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const P = (x, y) => (rel ? [cur[0] + x, cur[1] + y] : [x, y]);
    if (C === "Z") { if (dist(...cur, ...start) > 0.01) segs.push({ type: "L", p: cur, q: start }); cur = start; lastC = lastQ = null; continue; }
    if (C === "M") { cur = P(num(), num()); start = cur; cmd = rel ? "l" : "L"; lastC = lastQ = null; continue; }
    if (C === "L") { const q = P(num(), num()); segs.push({ type: "L", p: cur, q }); cur = q; lastC = lastQ = null; continue; }
    if (C === "H") { const x = num(); const q = [rel ? cur[0] + x : x, cur[1]]; segs.push({ type: "L", p: cur, q }); cur = q; lastC = lastQ = null; continue; }
    if (C === "V") { const y = num(); const q = [cur[0], rel ? cur[1] + y : y]; segs.push({ type: "L", p: cur, q }); cur = q; lastC = lastQ = null; continue; }
    if (C === "C") { const p1 = P(num(), num()), p2 = P(num(), num()), p3 = P(num(), num()); segs.push({ type: "C", p0: cur, p1, p2, p3 }); lastC = p2; lastQ = null; cur = p3; continue; }
    if (C === "S") { const p1 = lastC ? [2 * cur[0] - lastC[0], 2 * cur[1] - lastC[1]] : cur; const p2 = P(num(), num()), p3 = P(num(), num()); segs.push({ type: "C", p0: cur, p1, p2, p3 }); lastC = p2; lastQ = null; cur = p3; continue; }
    if (C === "Q" || C === "T") {
      const q1 = C === "Q" ? P(num(), num()) : lastQ ? [2 * cur[0] - lastQ[0], 2 * cur[1] - lastQ[1]] : cur;
      const p3 = P(num(), num());
      segs.push({ type: "C", p0: cur, p1: [cur[0] + (2 / 3) * (q1[0] - cur[0]), cur[1] + (2 / 3) * (q1[1] - cur[1])], p2: [p3[0] + (2 / 3) * (q1[0] - p3[0]), p3[1] + (2 / 3) * (q1[1] - p3[1])], p3 });
      lastQ = q1; lastC = null; cur = p3; continue;
    }
    throw new Error(`path: unsupported command ${cmd}`);
  }
  return segs;
}
const bz = (s, t) => {
  const v = 1 - t;
  return [0, 1].map((k) => v * v * v * s.p0[k] + 3 * v * v * t * s.p1[k] + 3 * v * t * t * s.p2[k] + t * t * t * s.p3[k]);
};
function split(s, t) {
  const L = (a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const a = L(s.p0, s.p1), b = L(s.p1, s.p2), c = L(s.p2, s.p3), d = L(a, b), e = L(b, c), f = L(d, e);
  return [{ type: "C", p0: s.p0, p1: a, p2: d, p3: f }, { type: "C", p0: f, p1: e, p2: c, p3: s.p3 }];
}
const lineDev = (p, q, x) => { const L = dist(...p, ...q) || 1e-9; return Math.abs((q[0] - p[0]) * (p[1] - x[1]) - (p[0] - x[0]) * (q[1] - p[1])) / L; };
/** the largest radius drawn as an arc */
export const MAX_R = 140;
/** a cubic as arcs (and lines where it is straight), within tol stage units */
export function fitCubic(s, tol = 0.7, out = [], depth = 0) {
  const m = bz(s, 0.5), samples = [0.1, 0.25, 0.4, 0.6, 0.75, 0.9].map((t) => bz(s, t));
  // straight?
  if (samples.every((x) => lineDev(s.p0, s.p3, x) <= tol) && lineDev(s.p0, s.p3, m) <= tol) { out.push({ type: "L", p: s.p0, q: s.p3 }); return out; }
  const [cx, cy, r] = circum(s.p0, m, s.p3);
  // a very flat arc is drawn as short straight runs instead: between formations a huge arc swings wide as it shrinks into a small one
  const ok = Number.isFinite(r) && r <= MAX_R && samples.every((x) => Math.abs(dist(cx, cy, ...x) - r) <= tol);
  if (ok || depth > 7) { out.push(r <= MAX_R ? { type: "A", p: s.p0, m, q: s.p3 } : { type: "L", p: s.p0, q: s.p3 }); return out; }
  const [a, b] = split(s, 0.5);
  fitCubic(a, tol, out, depth + 1);
  fitCubic(b, tol, out, depth + 1);
  return out;
}
/** a path as pieces: [{type:'L', p, q} | {type:'A', p, m, q}] (arcs through three points) */
export function pathPieces(d, { tol = 0.7, xf = null } = {}) {
  let segs = parsePath(d);
  if (xf) segs = segs.map((s) => (s.type === "L" ? { type: "L", p: xf(s.p), q: xf(s.q) } : { type: "C", p0: xf(s.p0), p1: xf(s.p1), p2: xf(s.p2), p3: xf(s.p3) }));
  const out = [];
  for (const s of segs) {
    if (s.type === "L") { if (dist(...s.p, ...s.q) > 0.05) out.push(s); }
    else fitCubic(s, tol, out);
  }
  // merge runs of collinear lines into one
  const merged = [];
  for (const s of out) {
    const last = merged[merged.length - 1];
    if (s.type === "L" && last?.type === "L" && dist(...last.q, ...s.p) < 0.05 && lineDev(last.p, s.q, last.q) < 0.05) { merged[merged.length - 1] = { type: "L", p: last.p, q: s.q }; continue; }
    merged.push(s);
  }
  return merged;
}
/** an affine placement: translate to (x, y), scale k, rotate deg, mirror (flip x) */
export const place = ({ x = 0, y = 0, k = 1, rot = 0, flip = false } = {}) => {
  const c = Math.cos((rot * Math.PI) / 180), s = Math.sin((rot * Math.PI) / 180);
  return ([px, py]) => { const X = (flip ? -px : px) * k, Y = py * k; return [x + X * c - Y * s, y + X * s + Y * c]; };
};

/** draw a path with the drawing api: arcs through three points, lines; the pin (if any) goes on the first piece */
export function drawPath(a, d, lk, tag, opts = {}, cfg = {}) {
  // one path is one contour: a traced move draws it as one pen line, piece after piece
  opts = { ...opts, cid: opts.cid ?? a.contour() };
  const rest = { ...opts }; delete rest.pin;
  // cfg.within [x0, x1]: drop the pieces wholly past either side (a figure cropped by the frame)
  const inside = (s) => !cfg.within || !(Math.max(s.p[0], s.q[0]) < cfg.within[0] || Math.min(s.p[0], s.q[0]) > cfg.within[1]);
  const ps = pathPieces(d, cfg).filter(inside);
  ps.forEach((s, i) => {
    const o = i === 0 ? opts : rest;
    if (s.type === "L") a.line(s.p[0], s.p[1], s.q[0], s.q[1], lk, tag, o);
    else a.arc3(s.p, s.m, s.q, lk, i === 0 ? tag : `${tag} (curve)`, o);
  });
  return ps;
}
