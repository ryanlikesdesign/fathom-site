// Renders the refined storyboard from formations.json, interpolating the way
// the formation engine does (components/why/morph/pieces.ts + formation.ts):
// centers ride a quadratic bezier (bend), lines turn about their middle,
// arcs turn the short way, opacity crossfades in halves, starts staggered by
// the move's order, eased with --ease-standard. Strokes are the engine's:
// --why-stroke stays 2px at any scale (desktop pane ~410px for 600 units,
// phone band ~361px for the 600-unit view), bands (sw) scale with the art.
// A zero-length line, arc or rect draws a round-cap dot, as in the browser,
// so a parked point that is not hidden shows up here too.
//   node render.mjs                 -> sheet.png (+ sheet.html)
//   node render.mjs --one F15 [F16] -> singles/<id>.png (desktop + phone)
//   node render.mjs --move F15      -> singles/move-<id>.png (6 frames into it, desktop and phone)
//   add --light for the light theme
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), ".out");
const doc = JSON.parse(fs.readFileSync(path.join(DIR, "formations.json"), "utf8"));
const args = process.argv.slice(2);
const LIGHT = args.includes("--light");

const COL = LIGHT
  ? { ink: [20, 24, 30], soft: [74, 82, 94], accent: [36, 92, 160], ghost: [120, 128, 138], navy: [31, 59, 92], glass: [36, 92, 160] }
  : { ink: [236, 230, 218], soft: [166, 174, 186], accent: [124, 178, 232], ghost: [98, 108, 120], navy: [31, 59, 92], glass: [124, 178, 232] };
const BG = LIGHT ? "#f4f1ea" : "#0e1013";
const UNIT = { desk: 600 / 410, phone: 600 / 361 }; // stage units per css px
const DEG = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => { let t = x; for (let i = 0; i < 8; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; } return sy(clamp(t, 0, 1)); };
}
const EASE = { standard: bezier(0.33, 1, 0.68, 1), linear: (x) => x, crossfade: bezier(0, 0, 0.58, 1), settle: bezier(0, 0, 0.58, 1) };

const kindOf = Object.fromEntries(doc.pool.map((p) => [p.id, p.kind]));
const ids = doc.pool.map((p) => p.id);
const clipSet = new Set(doc.pool.filter((p) => p.clip).map((p) => p.id));

// a flat sequence of steps (each via unfolded before its formation)
const steps = [];
for (const f of doc.formations) { if (f.via) steps.push({ ...f.via, isVia: true, reel: f.reel, section: f.section, window: f.window }); steps.push(f); }

// ---------------------------------------------------------------- the phone view of a step (engine PhoneVariant)
const placeP = (k, p, ph) => {
  const s = ph.s, dx = ph.shift[0], dy = ph.shift[1];
  const X = (x) => 300 + (x - 300) * s + dx, Y = (y) => 400 + (y - 400) * s + dy;
  const o = { ...p };
  if (k === "rect") Object.assign(o, { x: X(p.x), y: Y(p.y), w: p.w * s, h: p.h * s, r: p.r * s });
  else if (k === "line") Object.assign(o, { x1: X(p.x1), y1: Y(p.y1), x2: X(p.x2), y2: Y(p.y2) });
  else Object.assign(o, { cx: X(p.cx), cy: Y(p.cy), r: p.r * s });
  if (p.sw !== undefined) o.sw = p.sw * s;
  return o;
};
const phoneStep = (st) => {
  const ph = st.phone;
  const pieces = ph.pieces ?? Object.fromEntries(ids.map((id) => [id, placeP(kindOf[id], st.pieces[id], ph)]));
  const win = ph.window ?? (st.window ? (() => { const g = placeP("rect", { ...st.window, r: st.window.r ?? 0 }, ph); return { x: g.x, y: g.y, w: g.w, h: g.h, r: g.r }; })() : undefined);
  const mark = st.mark ? { ...st.mark, cx: 300 + (st.mark.cx - 300) * ph.s + ph.shift[0], cy: 400 + (st.mark.cy - 400) * ph.s + ph.shift[1], size: st.mark.size * ph.s } : undefined;
  return { ...st, pieces, window: win, mark };
};
const phoneSteps = steps.map(phoneStep);

// ---------------------------------------------------------------- interpolation (pieces.ts)
const center = (k, g) => (k === "rect" ? [g.x + g.w / 2, g.y + g.h / 2] : k === "line" ? [(g.x1 + g.x2) / 2, (g.y1 + g.y2) / 2] : [g.cx, g.cy]);
const nearestTurn = (a, b) => b - 360 * Math.round((b - a) / 360);
const fadeAt = (a, b, u) => { const e = clamp(u, 0, 1); return b >= a ? lerp(a, b, Math.min(1, 2 * e)) : lerp(a, b, Math.max(0, 2 * e - 1)); };
function plan(k, A, B, bend) {
  const c0 = center(k, A), c1 = center(k, B), dx = c1[0] - c0[0], dy = c1[1] - c0[1];
  const m = { k, A, B, c0, c1, ctrl: [(c0[0] + c1[0]) / 2 - dy * bend, (c0[1] + c1[1]) / 2 + dx * bend], still: JSON.stringify(A) === JSON.stringify(B) };
  if (k === "line") {
    const l0 = Math.hypot(A.x2 - A.x1, A.y2 - A.y1), l1 = Math.hypot(B.x2 - B.x1, B.y2 - B.y1);
    let a0 = Math.atan2(A.y2 - A.y1, A.x2 - A.x1) / DEG, a1 = Math.atan2(B.y2 - B.y1, B.x2 - B.x1) / DEG;
    if (l0 === 0) a0 = a1; if (l1 === 0) a1 = a0;
    m.polar = { l0, l1, a0, a1: nearestTurn(a0, a1) };
  } else if (k === "arc") {
    if (B.r === 0) m.arcTo = { a0: A.a0, a1: A.a1 };
    else { const midA = A.r === 0 ? (B.a0 + B.a1) / 2 : (A.a0 + A.a1) / 2, midB = (B.a0 + B.a1) / 2, sh = nearestTurn(midA, midB) - midB; m.arcTo = { a0: B.a0 + sh, a1: B.a1 + sh }; }
  }
  return m;
}
const look = (p) => ({ o: p.o ?? 1, stroke: p.stroke, fill: p.fill, sw: p.sw, weight: p.weight ?? 1 });
function at(m, local, u) {
  const { A, B, k } = m;
  if (local <= 0 || m.still) return { ...A, _l: look(A) };
  if (local >= 1) return { ...B, _l: look(B) };
  const v = 1 - u, c = [v * v * m.c0[0] + 2 * u * v * m.ctrl[0] + u * u * m.c1[0], v * v * m.c0[1] + 2 * u * v * m.ctrl[1] + u * u * m.c1[1]];
  const la = look(A), lb = look(B);
  const out = { _l: { o: fadeAt(la.o, lb.o, u), mix: [A.stroke, B.stroke, u], fillMix: [A.fill, B.fill, u], weight: lerp(la.weight, lb.weight, u), swA: la.sw, swB: lb.sw, u } };
  if (k === "rect") { const w = Math.max(0, lerp(A.w, B.w, u)), h = Math.max(0, lerp(A.h, B.h, u)); return { ...out, x: c[0] - w / 2, y: c[1] - h / 2, w, h, r: lerp(A.r, B.r, u), rot: lerp(A.rot ?? 0, B.rot ?? 0, u) }; }
  if (k === "line") { const p = m.polar, half = Math.max(0, lerp(p.l0, p.l1, u)) / 2, a = lerp(p.a0, p.a1, u) * DEG; return { ...out, x1: c[0] - Math.cos(a) * half, y1: c[1] - Math.sin(a) * half, x2: c[0] + Math.cos(a) * half, y2: c[1] + Math.sin(a) * half }; }
  const a0f = A.r === 0 ? m.arcTo.a0 : A.a0, a1f = A.r === 0 ? m.arcTo.a1 : A.a1;
  return { ...out, cx: c[0], cy: c[1], r: Math.max(0, lerp(A.r, B.r, u)), a0: lerp(a0f, m.arcTo.a0, u), a1: lerp(a1f, m.arcTo.a1, u) };
}
const n2 = (x) => (Math.round(x * 100) / 100).toString();
const rgb = (c) => `rgb(${c.join(",")})`;
function svgPiece(k, g, unit) {
  const L = g._l;
  if (L.o <= 0.001) return "";
  // stroke width: weight strokes are px (unit = stage units per px), bands are stage units
  const wpx = (w) => (w <= 1 ? w * 2 : 2 + (w - 1));
  let sw;
  if (L.mix) { const a = L.swA ?? wpx(1) * unit, b = L.swB ?? wpx(1) * unit; sw = L.swA === undefined && L.swB === undefined ? wpx(L.weight) * unit : lerp(a, b, L.u); }
  else sw = L.sw !== undefined ? L.sw : wpx(L.weight) * unit;
  let col;
  if (L.mix) { const [a, b, u] = L.mix; col = COL[a].map((x, i) => Math.round(lerp(x, COL[b][i], u))); } else col = COL[L.stroke ?? g.stroke];
  let fill = "none";
  const fm = L.fillMix ?? [L.fill ?? g.fill, L.fill ?? g.fill, 0];
  const [fa, fb, fu] = [fm[0] && fm[0] !== "none" ? fm[0] : null, fm[1] && fm[1] !== "none" ? fm[1] : null, fm[2]];
  if (fa || fb) { const ca = fa ? COL[fa] : null, cb = fb ? COL[fb] : null; const c = ca && cb ? ca.map((x, i) => Math.round(lerp(x, cb[i], fu))) : (ca ?? cb); const al = ca && cb ? 1 : ca ? 1 - fu : fu; fill = `rgba(${c.join(",")},${al.toFixed(3)})`; }
  const st = `stroke="${rgb(col)}" stroke-width="${n2(sw)}" opacity="${L.o.toFixed(3)}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"`;
  if (k === "rect") {
    const w = Math.max(0, g.w), h = Math.max(0, g.h);
    if (w < 0.05 && h < 0.05) return `<path d="M${n2(g.x + w / 2)} ${n2(g.y + h / 2)} L${n2(g.x + w / 2)} ${n2(g.y + h / 2)}" ${st}/>`;
    const r = Math.max(0, Math.min(g.r, w / 2, h / 2));
    const tr = g.rot ? ` transform="rotate(${n2(g.rot)} ${n2(g.x + w / 2)} ${n2(g.y + h / 2)})"` : "";
    return `<rect x="${n2(g.x)}" y="${n2(g.y)}" width="${n2(w)}" height="${n2(h)}" rx="${n2(r)}"${tr} ${st}/>`;
  }
  if (k === "line") return `<path d="M${n2(g.x1)} ${n2(g.y1)} L${n2(g.x2)} ${n2(g.y2)}" ${st}/>`;
  const span = clamp(g.a1 - g.a0, -360, 360);
  const P = (a) => `${n2(g.cx + g.r * Math.cos(a * DEG))} ${n2(g.cy + g.r * Math.sin(a * DEG))}`;
  if (g.r < 0.05 || Math.abs(span) < 0.05) return `<path d="M${P(g.a0)} L${P(g.a0)}" ${st}/>`;
  const sweep = span >= 0 ? 1 : 0;
  return `<path d="M${P(g.a0)} A${n2(g.r)} ${n2(g.r)} 0 0 ${sweep} ${P(g.a0 + span / 2)} A${n2(g.r)} ${n2(g.r)} 0 0 ${sweep} ${P(g.a0 + span)}" ${st}/>`;
}
const MARK_D = "M70,60 A10,10 0 1 1 50,60 A10,10 0 1 1 70,60 Z M87,60 A27,27 0 1 1 33,60 A27,27 0 1 1 87,60 Z M79,60 A19,19 0 1 1 41,60 A19,19 0 1 1 79,60 Z M102,60 A42,42 0 1 1 18,60 A42,42 0 1 1 102,60 Z M96,60 A36,36 0 1 1 24,60 A36,36 0 1 1 96,60 Z M115,60 A55,55 0 1 1 5,60 A55,55 0 1 1 115,60 Z M111,60 A51,51 0 1 1 9,60 A51,51 0 1 1 111,60 Z";
const markSvg = (m) => (!m || !(m.o > 0.001) ? "" : `<g opacity="${m.o.toFixed(3)}" transform="translate(${n2(m.cx)} ${n2(m.cy)}) scale(${(m.size / 120).toFixed(4)}) translate(-60 -60)"><path d="${MARK_D}" fill="${rgb(COL.ink)}" fill-rule="evenodd"/></g>`);

/** the frame t (0..1) of the way through the move into seq[j] */
function frameAt(seq, j, t) {
  const B = seq[j];
  if (!j || t >= 1) return { pieces: ids.map((id) => [kindOf[id], at({ A: B.pieces[id], still: true }, 0, 0)]), mark: B.mark, window: B.window };
  const A = seq[j - 1], mv = B.move ?? {}, bend = mv.bend ?? 0.06, stagger = mv.stagger ?? 0.5, ease = EASE[mv.ease ?? "standard"];
  const order = Array.isArray(mv.order) ? mv.order : [];
  const movers = ids.filter((id) => JSON.stringify(A.pieces[id]) !== JSON.stringify(B.pieces[id]));
  const rank = [...order.filter((id) => movers.includes(id)), ...movers.filter((id) => !order.includes(id))];
  const start = Object.fromEntries(rank.map((id, k) => [id, rank.length > 1 ? (stagger * k) / (rank.length - 1) : 0]));
  const pieces = ids.map((id) => {
    const k = kindOf[id], m = plan(k, A.pieces[id], B.pieces[id], bend);
    const local = clamp((t - (start[id] ?? 0)) / (1 - stagger), 0, 1);
    return [k, at(m, local, ease(local))];
  });
  const u = ease(t);
  let mark;
  const ma = A.mark, mb = B.mark;
  if (ma || mb) { const a = ma ?? { ...mb, o: 0 }, b = mb ?? { ...ma, o: 0 }; mark = { cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), size: lerp(a.size, b.size, u), o: fadeAt(a.o ?? 1, b.o ?? 1, u) }; }
  let win;
  const wa = A.window, wb = B.window;
  if (wa || wb) { const full = { x: -1000, y: -1000, w: 2600, h: 2800, r: 0 }; const a = wa ?? full, b = wb ?? full; win = { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u), r: lerp(a.r ?? 0, b.r ?? 0, u) }; }
  return { pieces, mark, window: win };
}
let uid = 0;
function svgOf(fr, vb, size, unit) {
  const cid = `c${uid++}`;
  let body = "", clipped = "";
  fr.pieces.forEach(([k, g], i) => { const s = svgPiece(k, g, unit); if (clipSet.has(ids[i]) && fr.window) clipped += s; else body += s; });
  const w = fr.window;
  const clipDef = w ? `<defs><clipPath id="${cid}"><rect x="${n2(w.x)}" y="${n2(w.y)}" width="${n2(w.w)}" height="${n2(w.h)}" rx="${n2(w.r ?? 0)}"/></clipPath></defs>` : "";
  return `<svg viewBox="${vb}" width="${size[0]}" height="${size[1]}" xmlns="http://www.w3.org/2000/svg" style="background:${BG};display:block">${clipDef}${body}${w ? `<g clip-path="url(#${cid})">${clipped}</g>` : clipped}${markSvg(fr.mark)}</svg>`;
}
const DESK_VB = "0 0 600 800", PHONE_VB = "0 175 600 450";
// the sheet draws a desktop pane at W px and the phone band at the real 361/410 of it
const desk = (fr, W) => svgOf(fr, DESK_VB, [W, (W * 4) / 3], UNIT.desk);
const phone = (fr, W) => svgOf(fr, PHONE_VB, [W, W * 0.75], UNIT.phone);
const idx = (id) => steps.findIndex((s) => s.id === id || s.id.startsWith(id + "-"));

const browser = await chromium.launch({ channel: "chrome" });
async function shot(html, out, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#07080a;color:#9aa4ae;font:12px -apple-system,Helvetica,sans-serif">${html}</body></html>`);
  await page.screenshot({ path: out, fullPage: true });
  await page.close();
}
fs.mkdirSync(path.join(DIR, "singles"), { recursive: true });
const sfx = LIGHT ? "-light" : "";

if (args[0] === "--one") {
  for (const id of args.slice(1).filter((a) => !a.startsWith("--"))) {
    const j = idx(id); if (j < 0) { console.log("no", id); continue; }
    const html = `<div style="display:flex;gap:16px;padding:16px;align-items:flex-start">${desk(frameAt(steps, j, 1), 600)}<div style="display:grid;gap:10px">${phone(frameAt(phoneSteps, j, 1), 528)}<div style="width:528px">${steps[j].id} · ${steps[j].anchor ?? ""}<br>phone ${steps[j].phone.pieces ? "recomposed" : `s ${steps[j].phone.s}`} (band at true size relative to the pane)</div></div></div>`;
    await shot(html, path.join(DIR, "singles", `${steps[j].id}${sfx}.png`), 1180, 840);
    console.log("wrote", steps[j].id);
  }
} else if (args[0] === "--move") {
  for (const id of args.slice(1).filter((a) => !a.startsWith("--"))) {
    const j = idx(id);
    const ts = [0, 0.2, 0.4, 0.6, 0.8, 1];
    const cells = ts.map((t) => `<div><div style="height:18px">t ${t}</div>${desk(frameAt(steps, j, t), 300)}</div>`).join("");
    const mob = ts.map((t) => phone(frameAt(phoneSteps, j, t), 264)).join("");
    await shot(`<div style="padding:12px">${steps[j - 1].id} → ${steps[j].id}</div><div style="padding:12px;display:grid;grid-template-columns:repeat(6,300px);gap:10px">${cells}${mob}</div>`, path.join(DIR, "singles", `move-${steps[j].id}${sfx}.png`), 1900, 760);
    console.log("wrote move into", steps[j].id);
  }
} else {
  // ------------------------------------------------------------- the sheet
  const DW = 216, MW = Math.round((DW * 361) / 410);
  const esc = (s) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const panel = (label, svg, cls = "") => `<figure class="p ${cls}"><figcaption>${label}</figcaption><div class="g">${svg}</div></figure>`;
  const accentCount = (st) => Object.values(st.pieces).filter((p) => p.stroke === "accent" && !/lens|gathered|bead|plug|tiled|stacked|condensed|laid/.test(p.part)).length;
  const rows = steps.map((s, j) => {
    const tag = s.isVia ? "via" : s.beat ? "beat" : s.reel;
    let cells = panel(`<b>${s.id}</b> · ${tag} · ${esc(s.section)}<br><i>${esc(s.anchor)}</i>`, desk(frameAt(steps, j, 1), DW), "key");
    cells += panel(`phone · ${s.phone.pieces ? "recomposed" : "s " + s.phone.s} · accent ${accentCount(s)}`, phone(frameAt(phoneSteps, j, 1), MW), "mob");
    if (j > 0) for (const t of [0.33, 0.66]) cells += panel(`${steps[j - 1].id.split("-")[0]} → ${s.id.split("-")[0]} · t ${t}`, desk(frameAt(steps, j, t), DW) + `<div style="height:6px"></div>` + phone(frameAt(phoneSteps, j, t), MW), "tw");
    else cells += panel("opening frame, complete at scroll 0", "", "tw empty") + panel("", "", "tw empty");
    return `<div class="row">${cells}</div>`;
  });
  const half = Math.ceil(rows.length / 2);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box} body{margin:0;background:#07080a;color:#cfd5dc;font:12px/1.3 -apple-system,Helvetica,Arial,sans-serif;padding:28px}
h1{font-size:22px;margin:0 0 4px;color:#fff;font-weight:600} .sub{color:#8d96a0;margin:0 0 18px;max-width:2000px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:36px}
.row{display:grid;grid-template-columns:${DW}px ${MW}px ${DW}px ${DW}px;gap:10px;margin-bottom:16px;align-items:start}
.p{margin:0} figcaption{height:30px;overflow:hidden;color:#9aa4ae;font-size:10.5px} figcaption b{color:#fff} figcaption i{color:#c9c2b4;font-style:normal}
.g svg{border-radius:5px}
.mob .g svg{outline:1px solid #2a3440}
.tw .g svg{outline:1px dashed #2a313a}
.empty .g{height:${(DW * 4) / 3}px}
</style></head><body>
<h1>${esc(doc.name)} · formation storyboard${LIGHT ? " (light theme)" : ""}</h1>
<p class="sub">${doc.pool.length} pieces (${doc.pool.filter((p) => p.kind === "rect").length} rounded rects, ${doc.pool.filter((p) => p.kind === "line").length} lines, ${doc.pool.filter((p) => p.kind === "arc").length} arcs; ${doc.pool.filter((p) => p.clip).length} clipped) draw every formation. Each row: the formation on the 600×800 desktop stage; the same moment in the phone pocket (the 600×450 view at its true size relative to the pane; "recomposed" = the phone's own landscape composition); then the move INTO this row's formation from the row before at t .33 and .66, desktop above and phone below, as the engine plays it (bezier travel, polar lines, staggered starts with structure first, --ease-standard). Strokes are the engine's 2px; accent counts exclude parked pieces.</p>
<div class="cols"><div>${rows.slice(0, half).join("")}</div><div>${rows.slice(half).join("")}</div></div>
</body></html>`;
  fs.writeFileSync(path.join(DIR, `sheet${sfx}.html`), html);
  const page = await browser.newPage({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: path.join(DIR, `sheet${sfx}.png`), fullPage: true });
  await page.close();
  console.log("wrote sheet");
}
await browser.close();
