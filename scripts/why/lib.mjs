// Shared drawing DSL, geometry and matching for the refined storyboard.
// Pieces are the engine's three kinds (components/why/morph/pieces.ts):
//   rect {x,y,w,h,r,rot}, line {x1,y1,x2,y2}, arc {cx,cy,r,a0,a1}
// Looks: stroke role (ink|soft|accent), fill (none|ink|accent|navy|glass),
// weight (1 = --why-stroke, 2 = emphasis), sw (exact width in stage units,
// = engine weight 0 + band sw), o.

export const deg = (r) => (r * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

export const look = (stroke = "ink", extra = {}) => ({ stroke, fill: "none", weight: 1, o: 1, ...extra });
export const INK = look("ink"), SOFT = look("soft"), ACC = look("accent");
export const INK2 = look("ink", { weight: 2 }), SOFT2 = look("soft", { weight: 2 }), ACC2 = look("accent", { weight: 2 });
export const FILL_INK = look("ink", { fill: "ink" }), FILL_ACC = look("accent", { fill: "accent" }), FILL_SOFT = look("soft", { fill: "soft" });

// ------------------------------------------------------------ geometry
const ang = (c, p) => deg(Math.atan2(p[1] - c[1], p[0] - c[0]));
export function circum(p1, p2, p3) {
  const [ax, ay] = p1, [bx, by] = p2, [cx, cy] = p3;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  return [ux, uy, Math.hypot(ax - ux, ay - uy)];
}
/** clockwise (screen) span from p1 to p2 around c that contains direction pm */
function spanThrough(c, p1, p2, pm) {
  let s = ang(c, p1), e = ang(c, p2), m = ang(c, pm);
  const norm = (a, base) => { while (a < base) a += 360; while (a >= base + 360) a -= 360; return a; };
  e = norm(e, s); m = norm(m, s);
  if (m <= e) return [s, e];
  // the other way: from p2 clockwise to p1
  let s2 = ang(c, p2), e2 = norm(ang(c, p1), s2);
  return [s2, e2];
}
/** external tangents between circle A and circle B: two lines [[x1,y1],[x2,y2]] */
export function extTangents(a, ra, b, rb) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx), off = Math.acos((ra - rb) / d);
  return [base + off, base - off].map((t) => [[a[0] + ra * Math.cos(t), a[1] + ra * Math.sin(t)], [b[0] + rb * Math.cos(t), b[1] + rb * Math.sin(t)]]);
}
/** Liang-Barsky clip of a segment to an axis-aligned box */
export function clipSeg(x1, y1, x2, y2, bx0, by0, bx1, by1) {
  let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy], q = [x1 - bx0, bx1 - x1, y1 - by0, by1 - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return null; continue; }
    const r = q[i] / p[i];
    if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
  }
  return [x1 + dx * t0, y1 + dy * t0, x1 + dx * t1, y1 + dy * t1];
}
/** point at distance d from p toward q */
export const toward = (p, q, d) => { const L = dist(...p, ...q); return [p[0] + ((q[0] - p[0]) * d) / L, p[1] + ((q[1] - p[1]) * d) / L]; };
/** line through two points evaluated at y */
export const xAtY = (p, q, y) => p[0] + ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]);
export const yAtX = (p, q, x) => p[1] + ((q[1] - p[1]) * (x - p[0])) / (q[0] - p[0]);

// a parked piece is drawn thinner than the stroke that hides it, so its antialiased edge never shows
export const thin = (lk) => (lk.sw !== undefined ? { ...lk, fill: "none", sw: Math.max(0.8, lk.sw * 0.5) } : { ...lk, fill: "none", weight: 0.5 });

// ------------------------------------------------------------ DSL
export function makeApi() {
  const S = { rect: [], line: [], arc: [] };
  const P = { rect: [], line: [], arc: [] }; // parking candidates
  let seq = 0; // drawing order across kinds: a move can trace a contour in the order it was drawn
  let contours = 0; // one id per contour (a path, a polyline, a chain): its pieces trace as one pen line
  // start: the point the pen starts the piece at (a line's first point, an arc's start), so a traced contour grows from it
  const startOf = (kind, g) => (kind === "line" ? [g.x1, g.y1] : kind === "arc" ? [g.cx + g.r * Math.cos(rad(g.a0)), g.cy + g.r * Math.sin(rad(g.a0))] : [g.x + g.w / 2, g.y + g.h / 2]);
  const push = (kind, g, lk, tag, opts = {}) => {
    const o = { ...opts };
    const cid = o.cid ?? `c${contours++}`;
    const start = o.start ?? startOf(kind, g);
    delete o.cid;
    delete o.start;
    S[kind].push({ kind, g, look: { ...lk }, tag, seq: seq++, cid, start, ...o });
  };
  const api = {
    S, P,
    /** a fresh contour id: pass it as opts.cid to every piece of one pen line */
    contour() { return `c${contours++}`; },
    rect(x, y, w, h, r = 0, lk = INK, tag = "", opts) { push("rect", { x, y, w, h, r: Math.min(r, w / 2, h / 2), rot: opts?.rot ?? 0 }, lk, tag, opts); return api; },
    rectC(cx, cy, w, h, r, lk, tag, opts) { return api.rect(cx - w / 2, cy - h / 2, w, h, r, lk, tag, opts); },
    circ(cx, cy, rr, lk = INK, tag = "", opts) { push("rect", { x: cx - rr, y: cy - rr, w: 2 * rr, h: 2 * rr, r: rr, rot: 0 }, lk, tag, opts); return api; },
    disk(cx, cy, rr, role = "ink", tag = "", opts) { return api.circ(cx, cy, rr, look(role, { fill: role }), tag, opts); },
    line(x1, y1, x2, y2, lk = INK, tag = "", opts) { push("line", { x1, y1, x2, y2 }, lk, tag, opts); return api; },
    seg(p, q, lk, tag, opts) { return api.line(p[0], p[1], q[0], q[1], lk, tag, opts); },
    poly(pts, lk = INK, tag = "", opts = {}) {
      const o = { ...opts, cid: opts.cid ?? api.contour() };
      const rest = { ...o }; delete rest.pin;
      for (let i = 0; i < pts.length - 1; i++) api.line(...pts[i], ...pts[i + 1], lk, tag, i === 0 ? o : rest);
      return api;
    },
    arc(cx, cy, r, a0, a1, lk = INK, tag = "", opts) { push("arc", { cx, cy, r, a0, a1 }, lk, tag, opts); return api; },
    ring(cx, cy, r, lk, tag, opts, from = -90) { return api.arc(cx, cy, r, from, from + 360, lk, tag, opts); },
    arc3(p1, pm, p2, lk = INK, tag = "", opts) {
      const [cx, cy, r] = circum(p1, pm, p2);
      const [a0, a1] = spanThrough([cx, cy], p1, p2, pm);
      return api.arc(cx, cy, r, a0, a1, lk, tag, { ...(opts ?? {}), start: p1 });
    },
    /** polyline with tangent circular fillets: pts [[x,y],...], radii per interior vertex */
    fillet(pts, radii, lk = INK, tag = "", opts = {}) {
      const n = pts.length; const tp = [];
      for (let i = 1; i < n - 1; i++) {
        const r = Array.isArray(radii) ? radii[i - 1] : radii;
        const A = pts[i - 1], B = pts[i], C = pts[i + 1];
        const u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]];
        const lu = Math.hypot(...u), lv = Math.hypot(...v);
        const cos = (u[0] * v[0] + u[1] * v[1]) / (lu * lv), th = Math.acos(Math.max(-1, Math.min(1, cos)));
        if (!r || th > Math.PI - 1e-3) { tp.push({ p: B, q: B, arc: null }); continue; }
        const d = r / Math.tan(th / 2);
        const p = [B[0] + (u[0] / lu) * d, B[1] + (u[1] / lu) * d], q = [B[0] + (v[0] / lv) * d, B[1] + (v[1] / lv) * d];
        const bis = [u[0] / lu + v[0] / lv, u[1] / lu + v[1] / lv], lb = Math.hypot(...bis);
        const h = r / Math.sin(th / 2);
        const c = [B[0] + (bis[0] / lb) * h, B[1] + (bis[1] / lb) * h];
        // midpoint of the arc: from c toward B at distance r
        const m = toward(c, B, r);
        tp.push({ p, q, arc: { c, r, m } });
      }
      let start = pts[0];
      let first = true;
      opts = { ...opts, cid: opts.cid ?? api.contour() };
      const rest = { ...opts }; delete rest.pin;
      for (let i = 1; i < n; i++) {
        const end = i < n - 1 ? tp[i - 1].p : pts[n - 1];
        if (dist(...start, ...end) > 0.5) { api.line(start[0], start[1], end[0], end[1], lk, tag, first ? opts : rest); first = false; }
        if (i < n - 1) {
          const t = tp[i - 1];
          if (t.arc) api.arc3(t.p, t.arc.m, t.q, lk, tag + " (curve)", rest);
          start = t.q;
        }
      }
      return api;
    },
    /** closed polygon with tangent circular fillets at every vertex (radii per vertex) */
    closed(pts, radii, lk = INK, tag = "", opts = {}) {
      const n = pts.length; const tp = [];
      opts = { ...opts, cid: opts.cid ?? api.contour() };
      const rest = { ...opts }; delete rest.pin;
      for (let i = 0; i < n; i++) {
        const r = Array.isArray(radii) ? radii[i] : radii;
        const A = pts[(i - 1 + n) % n], B = pts[i], C = pts[(i + 1) % n];
        const u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]];
        const lu = Math.hypot(...u), lv = Math.hypot(...v);
        const cos = (u[0] * v[0] + u[1] * v[1]) / (lu * lv), th = Math.acos(Math.max(-1, Math.min(1, cos)));
        if (!r) { tp.push({ p: B, q: B, arc: null }); continue; }
        const d = r / Math.tan(th / 2);
        const p = [B[0] + (u[0] / lu) * d, B[1] + (u[1] / lu) * d], q = [B[0] + (v[0] / lv) * d, B[1] + (v[1] / lv) * d];
        const bis = [u[0] / lu + v[0] / lv, u[1] / lu + v[1] / lv], lb = Math.hypot(...bis);
        const c = [B[0] + (bis[0] / lb) * (r / Math.sin(th / 2)), B[1] + (bis[1] / lb) * (r / Math.sin(th / 2))];
        tp.push({ p, q, arc: { c, r, m: toward(c, B, r) } });
      }
      let first = true;
      for (let i = 0; i < n; i++) {
        const t = tp[i], nx = tp[(i + 1) % n];
        if (t.arc) {
          api.arc3(t.p, t.arc.m, t.q, lk, tag + " (curve)", first ? opts : rest);
          first = false;
        }
        if (dist(...t.q, ...nx.p) > 0.5) api.line(t.q[0], t.q[1], nx.p[0], nx.p[1], lk, tag, rest);
      }
      return api;
    },
    /** draw chain segments (from chain()/clipChain()) as pieces */
    drawChain(segs, lk = INK, tag = "", opts = {}) {
      opts = { ...opts, cid: opts.cid ?? api.contour() };
      const rest = { ...opts }; delete rest.pin;
      segs.forEach((s, i) => {
        const o = i === 0 ? opts : rest;
        if (s.type === "line") api.line(s.p[0], s.p[1], s.q[0], s.q[1], lk, tag, o);
        else api.arc(s.c[0], s.c[1], s.r, Math.min(s.a0, s.a1), Math.max(s.a0, s.a1), lk, tag + " (curve)", { ...o, start: [s.c[0] + s.r * Math.cos(rad(s.a0)), s.c[1] + s.r * Math.sin(rad(s.a0))] });
      });
      return api;
    },
    /** four L brackets around a box: 8 lines */
    brackets(x0, y0, x1, y1, k, lk = ACC, tag = "focus bracket", opts = {}) {
      // with opts.pins, each of the eight strokes keeps its identity (corner by corner) wherever the brackets go
      const o = (i) => (opts.pins ? { ...opts, pin: `${opts.pins}${i}` } : opts);
      api.line(x0, y0 + k, x0, y0, lk, tag, o(0)).line(x0, y0, x0 + k, y0, lk, tag, o(1));
      api.line(x1 - k, y0, x1, y0, lk, tag, o(2)).line(x1, y0, x1, y0 + k, lk, tag, o(3));
      api.line(x1, y1 - k, x1, y1, lk, tag, o(4)).line(x1, y1, x1 - k, y1, lk, tag, o(5));
      api.line(x0 + k, y1, x0, y1, lk, tag, o(6)).line(x0, y1, x0, y1 - k, lk, tag, o(7));
      return api;
    },
    /**
     * the fathom assistant orb (Orb.tsx): rings at R, .84R, .68R; core .1692R. big: exact scaled widths.
     * two: the middle ring laid on the outer one, for an orb drawn under 24px across its radius (a phone's
     * band), so the rings it shows stay 3px or more apart and never merge into one blur.
     */
    orb(cx, cy, R, opts = {}) {
      const lk = opts.look ?? ACC;
      const big = opts.big ?? R >= 90;
      const widths = [1.33, 1.56, 1.8].map((w) => (w * R) / 50);
      const radii = opts.single ? [R, R, R] : opts.two ? [R, R, 0.68 * R] : [R, 0.84 * R, 0.68 * R];
      const from = opts.from ?? -90;
      radii.forEach((r, i) => api.arc(cx, cy, r, from, from + 360, big ? { ...lk, sw: widths[i] } : lk, `orb ring ${i + 1}`, { pin: `ring${i + 1}` }));
      const coreR = opts.coreR ?? Math.max(4.5, 0.1692 * R);
      api.disk(opts.coreAt?.[0] ?? cx, opts.coreAt?.[1] ?? cy, coreR, lk.stroke, "orb core", { pin: "core" });
      return { radii, widths, coreR };
    },
    // ---------------------------------------------------------- parking candidates
    /** n parking spots along a drawn line of the same look: points for rects and arcs, collinear tiles for lines */
    parkAlong(x1, y1, x2, y2, n, lk, tag = "tiled into the line", kinds = ["rect", "line", "arc"], L = 24) {
      const len = dist(x1, y1, x2, y2);
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1), c = [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
        const pl = thin(lk);
        if (kinds.includes("rect")) P.rect.push({ kind: "rect", g: { x: c[0], y: c[1], w: 0, h: 0, r: 0, rot: 0 }, look: pl, tag });
        if (kinds.includes("arc")) P.arc.push({ kind: "arc", g: { cx: c[0], cy: c[1], r: 0, a0: -90, a1: -90 }, look: pl, tag });
        if (kinds.includes("line") && len > L) {
          const cc = (len - L) * t + L / 2, a = toward([x1, y1], [x2, y2], cc - L / 2), b = toward([x1, y1], [x2, y2], cc + L / 2);
          P.line.push({ kind: "line", g: { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, look: thin(lk), tag });
        }
      }
      return api;
    },
    /** n candidate points gathered in a lens (hidden under a filled core) */
    parkLens(cx, cy, n, role = "accent", tag = "gathered in the lens", kinds = ["rect", "line", "arc"]) {
      for (const kind of kinds) for (let i = 0; i < n; i++) {
        const lk = look(role);
        if (kind === "rect") P.rect.push({ kind, g: { x: cx, y: cy, w: 0, h: 0, r: 0, rot: 0 }, look: lk, tag });
        if (kind === "line") P.line.push({ kind, g: { x1: cx, y1: cy, x2: cx, y2: cy }, look: lk, tag });
        if (kind === "arc") P.arc.push({ kind, g: { cx, cy, r: 0, a0: -90, a1: -90 }, look: lk, tag });
      }
      return api;
    },
    /** collinear tiles on a drawn line (same look: invisible), n candidates of length L spread along it */
    parkTiles(x1, y1, x2, y2, n, L, lk, tag = "tiled into the line") {
      const len = dist(x1, y1, x2, y2);
      for (let i = 0; i < n; i++) {
        const c = (len - L) * (n === 1 ? 0.5 : i / (n - 1)) + L / 2;
        const a = toward([x1, y1], [x2, y2], c - L / 2), b = toward([x1, y1], [x2, y2], c + L / 2);
        P.line.push({ kind: "line", g: { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, look: thin(lk), tag });
      }
      return api;
    },
    /** arc segments lying on a drawn ring (same look and width) */
    parkOnRing(cx, cy, r, n, span, lk, tag = "laid on the ring", start = -90) {
      for (let i = 0; i < n; i++) { const m = start + (i * 360) / n; P.arc.push({ kind: "arc", g: { cx, cy, r, a0: m - span / 2, a1: m + span / 2 }, look: thin(lk), tag }); }
      return api;
    },
    /** rect circles stacked exactly on a drawn circle (same look) */
    parkStackCircle(cx, cy, r, n, lk, tag = "stacked on the ring") {
      for (let i = 0; i < n; i++) P.rect.push({ kind: "rect", g: { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, r, rot: 0 }, look: thin(lk), tag });
      return api;
    },
    /** rects stacked exactly on a drawn rect */
    parkStackRect(x, y, w, h, r, n, lk, tag = "stacked on the outline") {
      for (let i = 0; i < n; i++) P.rect.push({ kind: "rect", g: { x, y, w, h, r, rot: 0 }, look: thin(lk), tag });
      return api;
    },
    /** beads: tiny rect circles hidden inside a band (thin stroke, same color) */
    parkBeads(cx, cy, r, n, lk, tag = "bead in the band", start = -90) {
      for (let i = 0; i < n; i++) { const t = rad(start + (i * 360) / n); P.rect.push({ kind: "rect", g: { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t), w: 0, h: 0, r: 0, rot: 0 }, look: { ...lk }, tag }); }
      return api;
    },
    /** short radial plugs inside a band */
    parkPlugs(cx, cy, r, n, len, lk, tag = "plug in the band", start = -90) {
      for (let i = 0; i < n; i++) { const t = rad(start + (i * 360) / n); P.line.push({ kind: "line", g: { x1: cx + (r - len / 2) * Math.cos(t), y1: cy + (r - len / 2) * Math.sin(t), x2: cx + (r + len / 2) * Math.cos(t), y2: cy + (r + len / 2) * Math.sin(t) }, look: { ...lk }, tag }); }
      return api;
    },
    /** zero-size points anywhere (hidden in a stroke of the same color) */
    parkPoints(pts, kind, lk, tag) {
      for (const [x, y] of pts) {
        if (kind === "rect") P.rect.push({ kind, g: { x, y, w: 0, h: 0, r: 0, rot: 0 }, look: { ...lk }, tag });
        if (kind === "line") P.line.push({ kind, g: { x1: x, y1: y, x2: x, y2: y }, look: { ...lk }, tag });
        if (kind === "arc") P.arc.push({ kind, g: { cx: x, cy: y, r: 0, a0: -90, a1: -90 }, look: { ...lk }, tag });
      }
      return api;
    },
  };
  return api;
}

// ------------------------------------------------------------ matching
export function geomCenter(kind, g) {
  if (kind === "rect") return [g.x + g.w / 2, g.y + g.h / 2];
  if (kind === "line") return [(g.x1 + g.x2) / 2, (g.y1 + g.y2) / 2];
  return [g.cx, g.cy];
}
/** where the visible stroke is (for travel cost of arcs) */
function visCenter(kind, g) {
  if (kind !== "arc") return geomCenter(kind, g);
  const span = g.a1 - g.a0;
  if (Math.abs(span) >= 359 || g.r < 1) return [g.cx, g.cy];
  const m = rad((g.a0 + g.a1) / 2);
  return [g.cx + g.r * Math.cos(m), g.cy + g.r * Math.sin(m)];
}
const lineAng = (g) => deg(Math.atan2(g.y2 - g.y1, g.x2 - g.x1));
const turn180 = (a, b) => { let d = (((b - a) % 180) + 180) % 180; return Math.min(d, 180 - d); };
export function cost(kind, p, s) {
  const [ax, ay] = visCenter(kind, p.g), [bx, by] = visCenter(kind, s.g);
  let c = dist(ax, ay, bx, by);
  if (kind === "rect") c += 0.25 * (Math.abs(p.g.w - s.g.w) + Math.abs(p.g.h - s.g.h));
  if (kind === "line") {
    const lp = dist(p.g.x1, p.g.y1, p.g.x2, p.g.y2), ls = dist(s.g.x1, s.g.y1, s.g.x2, s.g.y2);
    c += 0.25 * Math.abs(lp - ls);
    if (lp > 2 && ls > 2) c += 0.5 * turn180(lineAng(p.g), lineAng(s.g)) * Math.min(1, Math.max(lp, ls) / 60);
  }
  if (kind === "arc") c += 0.3 * Math.abs(p.g.r - s.g.r) + 0.2 * dist(p.g.cx, p.g.cy, s.g.cx, s.g.cy);
  if (p.look.stroke !== s.look.stroke) c += 6;
  return c;
}
export function orient(kind, prev, g) {
  if (kind === "line") {
    const lp = dist(prev.x1, prev.y1, prev.x2, prev.y2), ls = dist(g.x1, g.y1, g.x2, g.y2);
    if (lp < 0.5 || ls < 0.5) {
      const a = dist(prev.x1, prev.y1, g.x1, g.y1) + dist(prev.x2, prev.y2, g.x2, g.y2);
      const b = dist(prev.x1, prev.y1, g.x2, g.y2) + dist(prev.x2, prev.y2, g.x1, g.y1);
      return b < a ? { x1: g.x2, y1: g.y2, x2: g.x1, y2: g.y1 } : { ...g };
    }
    // keep the heading within 90 degrees (the engine turns lines about their middle)
    const d = (((lineAng(g) - lineAng(prev)) % 360) + 540) % 360 - 180;
    return Math.abs(d) > 90 ? { x1: g.x2, y1: g.y2, x2: g.x1, y2: g.y1 } : { ...g };
  }
  if (kind === "arc") {
    const span = g.a1 - g.a0;
    if (Math.abs(span) >= 359.9) {
      // a full ring: start it where the previous arc's gap was, so it closes without spinning
      const pm = (prev.a0 + prev.a1) / 2;
      return { ...g, a0: pm - 180, a1: pm + 180 };
    }
    const m = (g.a0 + g.a1) / 2, pm = (prev.a0 + prev.a1) / 2;
    const k = Math.round((pm - m) / 360);
    return { ...g, a0: g.a0 + 360 * k, a1: g.a1 + 360 * k };
  }
  return { ...g };
}
export function hungarian(C) {
  const n = C.length, u = Array(n + 1).fill(0), v = Array(n + 1).fill(0), p = Array(n + 1).fill(0), way = Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i; let j0 = 0;
    const minv = Array(n + 1).fill(Infinity), used = Array(n + 1).fill(false);
    do {
      used[j0] = true; const i0 = p[j0]; let delta = Infinity, j1 = 0;
      for (let j = 1; j <= n; j++) if (!used[j]) {
        const cur = C[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const ans = Array(n);
  for (let j = 1; j <= n; j++) ans[p[j] - 1] = j - 1;
  return ans;
}

/** a convex polygon offset inward by d (vertices of the parallel polygon) */
export function insetPoly(pts, d) {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n]; area += x1 * y2 - x2 * y1; }
  const sgn = area > 0 ? 1 : -1; // screen coords: area > 0 means clockwise on screen
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
    const nx = (-dy / L) * sgn, ny = (dx / L) * sgn; // inward normal
    return [[p[0] + nx * d, p[1] + ny * d], [q[0] + nx * d, q[1] + ny * d]];
  });
  return lines.map((l, i) => {
    const m = lines[(i - 1 + n) % n];
    return lineX(m[0], m[1], l[0], l[1]);
  });
}
export function lineX(p1, p2, p3, p4) {
  const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
  const a = p1[0] * p2[1] - p1[1] * p2[0], b = p3[0] * p4[1] - p3[1] * p4[0];
  return [(a * (p3[0] - p4[0]) - (p1[0] - p2[0]) * b) / d, (a * (p3[1] - p4[1]) - (p1[1] - p2[1]) * b) / d];
}
export const mirrorX = (pts, cx = 300) => pts.map(([x, y]) => [2 * cx - x, y]);

/** a smooth chain through a control polyline: tangent circular fillets of the given radii at the interior vertices.
 *  returns segments {type:'line', p, q} | {type:'arc', c, r, a0, a1} (degrees, screen clockwise from a0 to a1 or back) in order */
export function chain(pts, radii) {
  const n = pts.length, segs = [];
  let start = pts[0];
  for (let i = 1; i < n; i++) {
    if (i === n - 1) { segs.push({ type: "line", p: start, q: pts[i] }); break; }
    const r = Array.isArray(radii) ? radii[i - 1] : radii;
    const A = pts[i - 1], B = pts[i], C = pts[i + 1];
    const u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]];
    const lu = Math.hypot(...u), lv = Math.hypot(...v);
    const th = Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (lu * lv))));
    if (!r || th > Math.PI - 1e-4) { segs.push({ type: "line", p: start, q: B }); start = B; continue; }
    const d = r / Math.tan(th / 2);
    const p = [B[0] + (u[0] / lu) * d, B[1] + (u[1] / lu) * d], q = [B[0] + (v[0] / lv) * d, B[1] + (v[1] / lv) * d];
    const bis = [u[0] / lu + v[0] / lv, u[1] / lu + v[1] / lv], lb = Math.hypot(...bis), h = r / Math.sin(th / 2);
    const c = [B[0] + (bis[0] / lb) * h, B[1] + (bis[1] / lb) * h];
    segs.push({ type: "line", p: start, q: p });
    let a0 = deg(Math.atan2(p[1] - c[1], p[0] - c[0])), a1 = deg(Math.atan2(q[1] - c[1], q[0] - c[0]));
    let sp = a1 - a0; while (sp > 180) sp -= 360; while (sp < -180) sp += 360;
    segs.push({ type: "arc", c, r, a0, a1: a0 + sp });
    start = q;
  }
  return segs.filter((s) => s.type === "arc" || dist(...s.p, ...s.q) > 0.3);
}
const arcPt = (s, a) => [s.c[0] + s.r * Math.cos(rad(a)), s.c[1] + s.r * Math.sin(rad(a))];
/** the part of a chain (monotonic in x) between x0 and x1 */
export function clipChain(segs, x0, x1) {
  const out = [];
  for (const s of segs) {
    if (s.type === "line") {
      const [p, q] = s.p[0] <= s.q[0] ? [s.p, s.q] : [s.q, s.p];
      const a = Math.max(p[0], x0), b = Math.min(q[0], x1);
      if (b - a < 0.3) continue;
      const y = (x) => p[1] + ((q[1] - p[1]) * (x - p[0])) / (q[0] - p[0] || 1e-9);
      out.push({ type: "line", p: [a, y(a)], q: [b, y(b)] });
    } else {
      // sample the arc's angle range, keep the angles whose x lies in range (arcs here span < 180 degrees)
      const N = 400; let lo = null, hi = null;
      for (let i = 0; i <= N; i++) { const t = s.a0 + ((s.a1 - s.a0) * i) / N, x = arcPt(s, t)[0]; if (x >= x0 && x <= x1) { if (lo === null) lo = t; hi = t; } }
      if (lo !== null && Math.abs(hi - lo) > 0.2) out.push({ type: "arc", c: s.c, r: s.r, a0: lo, a1: hi });
    }
  }
  return out;
}
export function yOnChain(segs, x) {
  for (const s of segs) {
    if (s.type === "line") { const [p, q] = s.p[0] <= s.q[0] ? [s.p, s.q] : [s.q, s.p]; if (x >= p[0] && x <= q[0]) return p[1] + ((q[1] - p[1]) * (x - p[0])) / (q[0] - p[0] || 1e-9); }
    else { const N = 200; let best = null, bd = 1e9; for (let i = 0; i <= N; i++) { const t = s.a0 + ((s.a1 - s.a0) * i) / N, P = arcPt(s, t); if (Math.abs(P[0] - x) < bd) { bd = Math.abs(P[0] - x); best = P[1]; } } if (bd < 1) return best; }
  }
  return null;
}
