// Builds formations.json for the refined "Faithful artifacts" storyboard.
// One pool of pieces draws every formation. Consecutive formations are
// matched with a Hungarian assignment on travel (plus shape and heading),
// with hard pins for the identities that carry the story and parking
// candidates for pieces a drawing does not need (gathered in the lens,
// tiled into a line, stacked on an outline, beads and plugs in a band).
// Parked positions are then refined to sit between where a piece comes
// from and where it goes next, so no piece takes a long trip to park.
//
// Phones: a formation either shows its desktop drawing scaled into the
// pocket's 600 x 450 view (phone cx, cy, s), or has its own composition for
// the landscape view (forms: `mobile`). Those are matched in a second chain,
// so the moves on a phone are as considered as the desktop's, and written as
// the engine's phone.pieces overrides (view coordinates, every piece).
import fs from "node:fs";
import path from "node:path";
import { makeApi, cost, orient, hungarian, geomCenter, dist } from "./lib.mjs";
import { FORMATIONS, NAME, DIRECTION } from "./forms.mjs";

const DIR = path.dirname(new URL(import.meta.url).pathname);
// Work files (formations.json, sheets) go to .out (gitignored); convert.mjs turns them into the page's data.
const OUT = path.join(DIR, ".out");
const KINDS = ["rect", "line", "arc"];
const INF = 1e6;
const VIEW = { ox: 300, oy: 400 }; // the phone view [0, 175, 600, 450]'s center
// A parked piece lies inside a stroke of its own color at least as wide (or under the core's fill),
// unseen (o 0), so nothing waits exposed when its host moves on. The engine fades a piece only as it
// lies down in its host, at the very end of its trip (and fades one in only as it leaves its host): a
// piece that leaves a drawing visibly travels into a stroke, never fading out in mid-air (pieces.ts).
const PARK_SEEN = false;
const parkLook = (lk) => (PARK_SEEN ? { ...lk } : { ...lk, o: 0 });

// ---------------------------------------------------------------- realize
const realized = FORMATIONS.map((f) => {
  const a = makeApi();
  f.build(a);
  let M = null;
  if (f.mobile) { const m = makeApi(); f.mobile(m); M = { S: m.S, P: m.P }; }
  return { ...f, S: a.S, P: a.P, M };
});

// pins: one kind each
const pinKind = {};
for (const f of realized) for (const src of [f.S, f.M?.S].filter(Boolean)) for (const k of KINDS) for (const s of src[k]) {
  if (!s.pin || s.pin.startsWith("~")) continue;
  if (pinKind[s.pin] && pinKind[s.pin] !== k) throw new Error(`${f.id}: pin ${s.pin} used as ${pinKind[s.pin]} and ${k}`);
  pinKind[s.pin] = k;
}
const PINS = { rect: [], line: [], arc: [] };
for (const [p, k] of Object.entries(pinKind)) PINS[k].push(p);
const CLIPN = { rect: 0, line: 0, arc: 0 }, NEED = { rect: 0, line: 0, arc: 0 };
const clipPins = new Set();
for (const f of realized) for (const src of [f.S, f.M?.S].filter(Boolean)) for (const k of KINDS) {
  CLIPN[k] = Math.max(CLIPN[k], src[k].filter((s) => s.clip && !s.pin).length);
  NEED[k] = Math.max(NEED[k], src[k].length);
  for (const s of src[k]) if (s.clip && s.pin) clipPins.add(s.pin);
}
// a clip id can stand in for a drawn piece only inside its formation's window: so there must be enough
// plain ids for every unpinned drawn piece outside the window, besides the pins and the clip ids
const insideWin0 = (win, kind, g) => {
  if (!win) return true;
  const [x, y] = geomCenter(kind, g);
  return x >= win.x - 1 && x <= win.x + win.w + 1 && y >= win.y - 1 && y <= win.y + win.h + 1;
};
for (const f of realized) for (const [src, win] of [[f.S, f.window], [f.M?.S, f.mobileWindow]]) {
  if (!src) continue;
  for (const k of KINDS) {
    const outside = src[k].filter((s) => !s.clip && !(s.pin && !s.pin.startsWith("~")) && !insideWin0(win, k, s.g)).length;
    NEED[k] = Math.max(NEED[k], PINS[k].length + CLIPN[k] + outside);
  }
}
const prefix = { rect: "r", line: "l", arc: "a" };
const ids = {}, clipIds = new Set(clipPins);
for (const k of KINDS) {
  ids[k] = [...PINS[k]];
  for (let i = 0; i < CLIPN[k]; i++) { const id = `f${prefix[k]}${String(i + 1).padStart(2, "0")}`; ids[k].push(id); clipIds.add(id); }
  let i = 1;
  while (ids[k].length < NEED[k]) { ids[k].push(`${prefix[k]}${String(i).padStart(3, "0")}`); i++; }
}
for (const f of realized) for (const [src, label] of [[f, "desktop"], [f.M, "phone"]]) {
  if (!src) continue;
  for (const k of KINDS) {
    const short = ids[k].length - src.S[k].length;
    if (short > src.P[k].length) throw new Error(`${f.id} (${label}): ${k} needs ${short} parking spots, has ${src.P[k].length}`);
  }
}
const allIds = KINDS.flatMap((k) => ids[k]);
const kindOf = Object.fromEntries(KINDS.flatMap((k) => ids[k].map((id) => [id, k])));

const insideWin = (win, kind, g) => {
  if (!win) return true;
  const [x, y] = geomCenter(kind, g);
  return x >= win.x - 1 && x <= win.x + win.w + 1 && y >= win.y - 1 && y <= win.y + win.h + 1;
};

// ---------------------------------------------------------------- placing a desktop state into the phone view (engine placeState)
const placeG = (kind, g, ph) => {
  const k = ph.s, dx = -(ph.cx - VIEW.ox) * k, dy = -(ph.cy - VIEW.oy) * k;
  const X = (x) => VIEW.ox + (x - VIEW.ox) * k + dx, Y = (y) => VIEW.oy + (y - VIEW.oy) * k + dy;
  if (kind === "rect") return { x: X(g.x), y: Y(g.y), w: g.w * k, h: g.h * k, r: g.r * k, rot: g.rot ?? 0 };
  if (kind === "line") return { x1: X(g.x1), y1: Y(g.y1), x2: X(g.x2), y2: Y(g.y2) };
  return { cx: X(g.cx), cy: Y(g.cy), r: g.r * k, a0: g.a0, a1: g.a1 };
};
const placeSt = (kind, st, ph) => ({ ...st, g: placeG(kind, st.g, ph), look: st.look.sw !== undefined ? { ...st.look, sw: st.look.sw * ph.s } : st.look });
const placeWin = (w, ph) => { const g = placeG("rect", { ...w, r: w.r ?? 0 }, ph); return { x: g.x, y: g.y, w: g.w, h: g.h, r: g.r }; };

// ---------------------------------------------------------------- assignment
/** match pool ids to a drawing's slots and parking; prev/next are the neighbors' states (either may be null) */
/** affinity: [fromTagPrefix, toTagPrefix] pairs that pull a drawing's groups onto the next drawing's groups as wholes */
const affinityCost = (aff, fromTag, toTag) => {
  if (!aff || !fromTag) return 0;
  for (const [a, b] of aff) if (fromTag.startsWith(a) && toTag.startsWith(b)) return -260;
  return 0;
};
/**
 * warp: [{ from, to, src, dst }]: a group of the drawing before (tags starting with one of `from`) reforms
 * into a group of this one (tags starting with one of `to`) as a whole: its pieces are matched by their
 * place within the group's box (`src`, [x0, y0, x1, y1]) mapped onto the new group's (`dst`), not by
 * absolute distance, so each stroke goes to the stroke at the same place in the new shape and the group
 * moves as one (the dog's torso squaring into the lens, never its strokes crossing each other).
 */
function warpOf(warp, fromTag, toTag) {
  if (!warp || !fromTag) return null;
  return warp.find((w) => w.from.some((p) => fromTag.startsWith(p)) && w.to.some((p) => toTag.startsWith(p))) ?? null;
}
function warped(kind, st, w) {
  const [a0, b0, a1, b1] = w.src, [c0, d0, c1, d1] = w.dst;
  const X = (x) => c0 + ((x - a0) * (c1 - c0)) / (a1 - a0), Y = (y) => d0 + ((y - b0) * (d1 - d0)) / (b1 - b0);
  const g = st.g;
  if (kind === "line") return { ...st, g: { x1: X(g.x1), y1: Y(g.y1), x2: X(g.x2), y2: Y(g.y2) } };
  if (kind === "arc") return { ...st, g: { ...g, cx: X(g.cx), cy: Y(g.cy), r: g.r * Math.sqrt(Math.abs(((c1 - c0) * (d1 - d0)) / ((a1 - a0) * (b1 - b0)))) } };
  const cx = X(g.x + g.w / 2), cy = Y(g.y + g.h / 2), kx = (c1 - c0) / (a1 - a0), ky = (d1 - d0) / (b1 - b0);
  return { ...st, g: { ...g, x: cx - (g.w * kx) / 2, y: cy - (g.h * ky) / 2, w: g.w * kx, h: g.h * ky } };
}
function assign(S, P, win, prev, next, first, label, aff, warp) {
  const state = {};
  for (const kind of KINDS) {
    const I = ids[kind], Sk = S[kind], Ck = P[kind];
    const cols = [...Sk.map((s) => ({ ...s, parked: false })), ...Ck.map((c) => ({ ...c, parked: true }))];
    const n = Math.max(I.length, cols.length);
    const pinnedHere = new Set(Sk.filter((s) => s.pin && !s.pin.startsWith("~")).map((s) => s.pin));
    const M = [];
    for (let i = 0; i < n; i++) {
      const id = I[i], row = [];
      for (let j = 0; j < n; j++) {
        const s = cols[j];
        if (!s) { row.push(id ? INF : 0); continue; }
        if (!id) { row.push(s.parked ? 0 : INF); continue; }
        if (s.clip && !clipIds.has(id)) { row.push(INF); continue; }
        if (clipIds.has(id) && !s.clip && !insideWin(win, kind, s.g)) { row.push(INF); continue; }
        if (s.pin && !s.pin.startsWith("~")) { row.push(s.pin === id ? 0 : INF); continue; }
        if (pinnedHere.has(id)) { row.push(INF); continue; }
        if (first && !next) { row.push(s.parked ? 1000 + j : j); continue; }
        let c = 0;
        if (prev) {
          const w = warpOf(warp, prev[id].tag, s.tag);
          c += cost(kind, w && !prev[id].parked ? warped(kind, prev[id], w) : prev[id], s) + affinityCost(aff, prev[id].tag, s.tag);
        }
        if (next) c += cost(kind, s, next[id]) * (prev ? 0.5 : 1);
        if (s.pin && s.pin.startsWith("~") && prev) c = prev[id].tag.startsWith(s.pin.slice(1)) ? -500 : c + 400;
        if (s.parked) c += 4;
        row.push(c);
      }
      M.push(row);
    }
    const ans = hungarian(M);
    I.forEach((id, i) => {
      const s = cols[ans[i]];
      if (!s || M[i][ans[i]] >= INF) throw new Error(`${label}: no slot for ${id}`);
      // hidden: a drawn piece that lies in a stroke of its own color (a horizon folded into the phone's edge)
      state[id] = { kind, g: { ...s.g }, look: s.parked ? parkLook(s.look) : s.look, tag: s.tag, parked: s.parked, hidden: !!s.hidden, seq: s.seq ?? 0, cid: s.cid, start: s.start };
    });
    const filled = new Set(I.map((id, i) => ans[i]));
    Sk.forEach((s, j) => { if (!filled.has(j)) throw new Error(`${label}: drawing slot ${s.tag} unfilled`); });
  }
  return state;
}
/** move each parked piece to the candidate nearest both its last and its next place */
function refineParking(states, Ps, wins, isFree) {
  for (let pass = 0; pass < 3; pass++) {
    states.forEach((st, i) => {
      if (!isFree(i)) return;
      for (const kind of KINDS) {
        const parked = ids[kind].filter((id) => st[id].parked);
        if (!parked.length) continue;
        const C = Ps[i][kind], n = Math.max(parked.length, C.length), M = [];
        for (let r = 0; r < n; r++) {
          const id = parked[r], row = [];
          for (let c = 0; c < n; c++) {
            const cand = C[c];
            if (!cand) { row.push(id ? INF : 0); continue; }
            if (!id) { row.push(0); continue; }
            if (clipIds.has(id) && !insideWin(wins[i], kind, cand.g)) { row.push(INF); continue; }
            let v = 0;
            if (i > 0) v += cost(kind, states[i - 1][id], cand);
            if (i < states.length - 1) v += cost(kind, cand, states[i + 1][id]);
            row.push(v);
          }
          M.push(row);
        }
        const ans = hungarian(M);
        parked.forEach((id, r) => { const cand = C[ans[r]]; st[id] = { kind, g: { ...cand.g }, look: parkLook(cand.look), tag: cand.tag, parked: true }; });
      }
    });
  }
}

// ---------------------------------------------------------------- desktop chain
const deskStates = [];
realized.forEach((f, i) => deskStates.push(assign(f.S, f.P, f.window, i ? deskStates[i - 1] : null, null, i === 0, `${f.id}`, f.affinity, f.warp)));
refineParking(deskStates, realized.map((f) => f.P), realized.map((f) => f.window), () => true);

// line headings within 90 degrees of the last; arcs the short way; full rings seated at the next gap
function orientChain(states, isFree) {
  for (let i = 1; i < states.length; i++) {
    if (!isFree(i)) continue;
    for (const id of allIds) {
      const k = kindOf[id];
      if (k === "line" && i + 1 < states.length && !isFree(i + 1)) {
        // fixed neighbor after: pick the heading that turns least, both ways
        const g = states[i][id].g, flip = { x1: g.x2, y1: g.y2, x2: g.x1, y2: g.y1 };
        const turn = (a, b) => { const A = Math.atan2(a.y2 - a.y1, a.x2 - a.x1), B = Math.atan2(b.y2 - b.y1, b.x2 - b.x1); let d = Math.abs(((B - A) * 180) / Math.PI) % 360; return d > 180 ? 360 - d : d; };
        const p = states[i - 1][id].g, nx = states[i + 1][id].g;
        // continuity with the formation before weighs double: a line must never spin through a hold or a scroll
        states[i][id].g = 2 * turn(p, g) + turn(g, nx) <= 2 * turn(p, flip) + turn(flip, nx) ? g : flip;
      } else states[i][id].g = orient(k, states[i - 1][id].g, states[i][id].g);
    }
  }
  const isFull = (g) => Math.abs(g.a1 - g.a0) >= 359.9;
  for (let i = states.length - 2; i >= 0; i--) for (const id of ids.arc) {
    if (!isFree(i)) continue;
    const g = states[i][id].g, nx = states[i + 1][id].g;
    if (isFull(g) && !isFull(nx) && (i === 0 || isFull(states[i - 1][id].g) || states[i - 1][id].g.r < 0.5)) { const m = (nx.a0 + nx.a1) / 2; g.a0 = m - 180; g.a1 = m + 180; }
  }
  for (let i = 1; i < states.length; i++) for (const id of ids.arc) {
    if (!isFree(i)) continue;
    const p = states[i - 1][id].g, g = states[i][id].g;
    if (!isFull(g)) { const k = Math.round(((p.a0 + p.a1) / 2 - (g.a0 + g.a1) / 2) / 360); g.a0 += 360 * k; g.a1 += 360 * k; }
  }
}
orientChain(deskStates, () => true);

// ---------------------------------------------------------------- phone chain
const placedDesk = (i) => Object.fromEntries(allIds.map((id) => [id, placeSt(kindOf[id], deskStates[i][id], realized[i].phone)]));
const phoneStates = [];
realized.forEach((f, i) => {
  if (!f.M) { phoneStates.push(placedDesk(i)); return; }
  const next = i + 1 < realized.length && !realized[i + 1].M ? placedDesk(i + 1) : null;
  phoneStates.push(assign(f.M.S, f.M.P, f.mobileWindow ?? (f.window ? placeWin(f.window, f.phone) : null), i ? phoneStates[i - 1] : null, next, i === 0, `${f.id} (phone)`, f.affinity));
});
refineParking(phoneStates, realized.map((f) => f.M?.P ?? null), realized.map((f) => f.mobileWindow ?? null), (i) => !!realized[i].M);
orientChain(phoneStates, (i) => !!realized[i].M);

// ---------------------------------------------------------------- staging order per move
function sizeOf(kind, g) {
  if (kind === "rect") return Math.max(g.w, g.h);
  if (kind === "line") return dist(g.x1, g.y1, g.x2, g.y2);
  return g.r * Math.min(2 * Math.PI, (Math.abs(g.a1 - g.a0) * Math.PI) / 180);
}
const pinnedAll = new Set(KINDS.flatMap((k) => PINS[k]));
function moveOrder(i) {
  const f = realized[i];
  if (f.move?.order === "pool" || f.move?.order === "travel") return f.move.order;
  const moving = allIds.filter((id) => JSON.stringify(deskStates[i - 1][id].g) !== JSON.stringify(deskStates[i][id].g) || JSON.stringify(deskStates[i - 1][id].look) !== JSON.stringify(deskStates[i][id].look));
  const firstTags = f.move?.first ?? [];
  const groups = f.move?.groups ?? null; // ordered tag prefixes: each group moves together, one after another
  const score = (id) => {
    const k = kindOf[id], a = deskStates[i - 1][id], b = deskStates[i][id];
    let s = Math.max(sizeOf(k, a.g), sizeOf(k, b.g));
    if (pinnedAll.has(id)) s += 1000;
    if (firstTags.some((t) => b.tag.startsWith(t) || a.tag.startsWith(t))) s += 2000;
    if (b.parked && a.parked) s -= 500;
    if (groups) {
      const tag = b.parked ? a.tag : b.tag;
      let gi = groups.findIndex((g) => tag.startsWith(g));
      if (gi < 0) gi = groups.length;
      // trace: within a group, pieces arrive in the order their contour is drawn (a parked piece leaves in the order it was drawn)
      const traced = f.move?.trace === true || (Array.isArray(f.move?.trace) && f.move.trace.some((t) => tag.startsWith(t)));
      if (traced) s = 50000 - (b.parked ? a.seq ?? 0 : b.seq ?? 0);
      s = (groups.length - gi) * 100000 + s;
    }
    return s;
  };
  return moving.sort((x, y) => score(y) - score(x));
}

// ---------------------------------------------------------------- traced contours
// A move with move.trace draws each matching contour (one path, polyline or chain: one cid) as one pen
// line: each piece's share of its contour's length, in drawing order, and the end its pen starts at
// (formation.ts TraceSpec). "in": the contours the formation draws, all at once; "out": the ones the
// formation before drew (matched by the nearest earlier formation's trace), as one pen run backwards.
const matchTrace = (spec, tag) => spec === true || (Array.isArray(spec) && spec.some((t) => tag.startsWith(t)));
const lenOf = (kind, g) => (kind === "line" ? dist(g.x1, g.y1, g.x2, g.y2) : kind === "arc" ? (g.r * Math.abs(g.a1 - g.a0) * Math.PI) / 180 : 2 * (g.w + g.h));
function penEndOf(kind, g, start) {
  if (!start) return 0;
  if (kind === "line") return dist(g.x1, g.y1, ...start) <= dist(g.x2, g.y2, ...start) ? 0 : 1;
  if (kind === "arc") {
    const at = (a) => [g.cx + g.r * Math.cos((a * Math.PI) / 180), g.cy + g.r * Math.sin((a * Math.PI) / 180)];
    return dist(...at(g.a0), ...start) <= dist(...at(g.a1), ...start) ? 0 : 1;
  }
  return 0;
}
/**
 * shares of the contours a formation drew, as one pen: every matching contour in drawing order, end to end,
 * so erasing them backwards takes one contour at a time (never a field of half-erased strokes)
 */
function penShares(states, spec) {
  const list = allIds.filter((id) => {
    const st = states[id];
    return !(st.parked || st.hidden || !st.cid || st.look.o === 0 || !matchTrace(spec, st.tag));
  });
  list.sort((a, b) => states[a].seq - states[b].seq);
  const lens = list.map((id) => lenOf(kindOf[id], states[id].g));
  const L = lens.reduce((x, y) => x + y, 0) || 1;
  const out = {};
  let cum = 0;
  list.forEach((id, i) => {
    out[id] = [cum / L, lens[i] / L, penEndOf(kindOf[id], states[id].g, states[id].start)];
    cum += lens[i];
  });
  return out;
}
function contourShares(states, spec) {
  const groups = new Map();
  for (const id of allIds) {
    const st = states[id];
    if (st.parked || st.hidden || !st.cid || st.look.o === 0 || !matchTrace(spec, st.tag)) continue;
    if (!groups.has(st.cid)) groups.set(st.cid, []);
    groups.get(st.cid).push(id);
  }
  const out = {};
  for (const list of groups.values()) {
    list.sort((a, b) => states[a].seq - states[b].seq);
    const lens = list.map((id) => lenOf(kindOf[id], states[id].g));
    const L = lens.reduce((x, y) => x + y, 0) || 1;
    let cum = 0;
    list.forEach((id, i) => {
      out[id] = [cum / L, lens[i] / L, penEndOf(kindOf[id], states[id].g, states[id].start)];
      cum += lens[i];
    });
  }
  return out;
}
const r4 = (x) => Math.round(x * 1e4) / 1e4;
function traceOf(i) {
  const spec = realized[i].move?.trace;
  if (!spec || i === 0) return null;
  let prevSpec = null;
  for (let j = i - 1; j >= 0 && !prevSpec; j--) prevSpec = realized[j].move?.trace ?? null;
  const parts = [];
  const put = (shares, phase) => {
    for (const [id, [a, b, e]] of Object.entries(shares)) parts.push(`${allIds.indexOf(id)} ${phase} ${r4(a)} ${r4(b)} ${e}`);
  };
  // drawn: one pen through every contour in the order it was drawn, each from its own first point, so only
  // one contour is ever partly drawn (never a field of half-drawn strokes); erased: the same pen backwards
  put(penShares(deskStates[i], spec), "i");
  if (prevSpec) put(penShares(deskStates[i - 1], prevSpec), "o");
  return parts.join(";");
}

// ---------------------------------------------------------------- output
const r1 = (x) => Math.round(x * 10) / 10;
function params(kind, st) {
  const g = st.g, o = {};
  if (kind === "rect") Object.assign(o, { x: r1(g.x), y: r1(g.y), w: r1(g.w), h: r1(g.h), r: r1(Math.min(g.r, g.w / 2, g.h / 2)) }, g.rot ? { rot: r1(g.rot) } : {});
  else if (kind === "line") Object.assign(o, { x1: r1(g.x1), y1: r1(g.y1), x2: r1(g.x2), y2: r1(g.y2) });
  else Object.assign(o, { cx: r1(g.cx), cy: r1(g.cy), r: r1(g.r), a0: r1(g.a0), a1: r1(g.a1) });
  o.stroke = st.look.stroke;
  if (st.look.fill && st.look.fill !== "none") o.fill = st.look.fill;
  if (st.look.weight !== 1 && st.look.sw === undefined) o.weight = st.look.weight;
  if (st.look.o !== undefined && st.look.o !== 1) o.o = st.look.o;
  if (st.look.sw !== undefined) o.sw = r1(st.look.sw);
  o.part = st.tag;
  if (st.parked || st.hidden) o.parked = true;
  return o;
}
const formations = realized.map((f, i) => {
  const pieces = {};
  for (const id of allIds) pieces[id] = params(kindOf[id], deskStates[i][id]);
  const out = { id: f.id, reel: f.reel, section: f.section, anchor: f.anchor, at: f.at };
  if (f.hold) Object.assign(out, { hold: f.hold, holdAt: f.holdAt });
  if (f.beat) out.beat = f.beat;
  const ph = f.M ? { cx: 300, cy: 400, s: 1 } : f.phone;
  out.phone = { cx: ph.cx, cy: ph.cy, s: ph.s, shift: [r1(-(ph.cx - VIEW.ox) * ph.s), r1(-(ph.cy - VIEW.oy) * ph.s)], scale: ph.s, run: f.phone?.run ?? "section" };
  if (f.M) {
    out.phone.own = "recomposed for the landscape pocket: pieces in view coordinates (the view is 0,175 to 600,625)";
    out.phone.pieces = Object.fromEntries(allIds.map((id) => [id, params(kindOf[id], phoneStates[i][id])]));
    if (f.mobileWindow) out.phone.window = f.mobileWindow;
  }
  out.note = f.note;
  if (f.mobileNote) out.phoneNote = f.mobileNote;
  if (f.window) out.window = f.window;
  else if (realized.slice(0, i).some((g) => g.window)) out.window = { x: -2000, y: -2000, w: 4600, h: 4800, r: 0 };
  if (f.M && !f.mobileWindow && realized.slice(0, i).some((g) => g.mobileWindow)) out.phone.window = { x: -2000, y: -2000, w: 4600, h: 4800, r: 0 };
  if (f.mark) out.mark = f.mark;
  if (i > 0) out.move = { ease: "standard", stagger: 0.5, bend: 0.06, ...(f.move ?? {}), order: moveOrder(i) };
  if (out.move) { delete out.move.first; delete out.move.groups; delete out.move.trace; }
  if (f.still) out.still = f.still;
  const tr = traceOf(i);
  if (tr) out.trace = tr;
  out.pieces = pieces;
  return out;
});
// fold each via into the formation after it, as the winner's schema does
const final = [];
for (let i = 0; i < formations.length; i++) {
  const f = formations[i];
  if (realized[i].via) { const m = formations[i + 1]; final.push({ ...m, via: { id: f.id, anchor: f.anchor, at: f.at, hold: f.hold, holdAt: f.holdAt, note: f.note, phone: f.phone, move: f.move, pieces: f.pieces } }); i++; }
  else final.push(f);
}
const pool = allIds.map((id) => {
  const parts = [];
  for (const s of deskStates) { const t = s[id].tag.replace(/ \(.*\)$/, ""); if (parts[parts.length - 1] !== t) parts.push(t); }
  const p = { id, kind: kindOf[id], role: parts.join(" > ") };
  if (clipIds.has(id)) p.clip = true;
  return p;
});
const doc = {
  name: NAME,
  stage: { w: 600, h: 800, phoneView: [0, 175, 600, 450], mobileWindow: "the pocket shows the 600x450 view [0,175,600,450]. A formation without phone.pieces shows its desktop drawing scaled by phone.s about the view center and moved by phone.shift (engine PhoneVariant {shift, scale}; equivalently, the stage region centered on phone.cx, cy at scale s). A formation with phone.pieces is recomposed for the landscape pocket: every piece in view coordinates (engine PhoneVariant.pieces)." },
  conventions: {
    arcs: "angles in degrees, 0 = 3 o'clock, clockwise on screen; span >= 360 is a full ring",
    sw: "exact stroke width in stage units (engine: weight 0, band sw) for the orb rings, the mark bands and solid disks",
    stroke: "engine look.role: ink | soft | accent. No ghost anywhere (contrast). fill: engine look.fill",
    weight: "1 = --why-stroke, 2 = --fathom-border-emphasis",
    part: "what the piece depicts in this formation (documentation only); 'gathered in the lens', 'tiled into', 'stacked on', 'bead', 'plug' mark parked pieces, which sit exactly inside a stroke of the same look or under a filled disk and are invisible at rest (a zero-length line or arc draws a round-cap dot, so every parked point sits inside a stroke at least as wide)",
    phone: "the pocket: run = pocket runway (item | section | climax); see stage.mobileWindow",
    at: "the [data-why-at] anchor in app/why/page.tsx; hold/holdAt: the formation holds perfectly still until this lands (the move to the next one runs in the gap after it)",
    move: "the engine's move into this formation (formation.ts): ease, stagger, bend, and order = piece ids, structure first, small pieces wait in place and travel last. The phone variant uses the same move.",
    window: "the engine's clip window for clip pieces (pool clip: true)",
    mark: "the exact fathom mark (morph/brand.ts), never approximated: center, size in stage units across the 120 master's box, o, role",
    accent: "only the orb (and the orb standing in as every lens) is accent. What it acts on is ink.",
  },
  direction: DIRECTION,
  pool,
  formations: final,
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "formations.json"), JSON.stringify(doc, null, 1));
console.log("pool", pool.length, KINDS.map((k) => `${k} ${ids[k].length} (clip ${CLIPN[k]})`).join(", "), "formations", final.length, "phone-recomposed", realized.filter((f) => f.M).map((f) => f.id).join(" "));
