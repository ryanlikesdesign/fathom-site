// Quick look at formation drawings straight from forms.mjs (no assignment):
//   node sketch.mjs F14 F15 [--park] [--light]  -> singles/sketch-<id>.png
// Desktop at 600x800 and the phone pocket (600x450 view) side by side.
// Strokes mimic the engine: --why-stroke is 2px at any scale (desktop pane
// ~410px for 600 units, phone band ~361px), bands (sw) scale with the art.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { makeApi } from "./lib.mjs";
import { FORMATIONS } from "./forms.mjs";

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), ".out");
const args = process.argv.slice(2);
const LIGHT = args.includes("--light"), PARK = args.includes("--park");
const COL = LIGHT
  ? { ink: [20, 24, 30], soft: [74, 82, 94], accent: [36, 92, 160], navy: [31, 59, 92] }
  : { ink: [236, 230, 218], soft: [166, 174, 186], accent: [124, 178, 232], navy: [31, 59, 92] };
const BG = LIGHT ? "#f4f1ea" : "#0e1013";
const DEG = Math.PI / 180;
const n2 = (x) => (Math.round(x * 100) / 100).toString();

export function pieceSvg(kind, g, lk, unit, colOverride) {
  const col = colOverride ?? COL[lk.stroke];
  const sw = lk.sw !== undefined ? lk.sw : (lk.weight ?? 1) <= 1 ? (lk.weight ?? 1) * 2 * unit : (2 + (lk.weight - 1)) * unit;
  const fill = lk.fill && lk.fill !== "none" ? `rgb(${COL[lk.fill].join(",")})` : "none";
  const st = `stroke="rgb(${col.join(",")})" stroke-width="${n2(sw)}" opacity="${lk.o ?? 1}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"`;
  if (kind === "rect") {
    const w = Math.max(0, g.w), h = Math.max(0, g.h), r = Math.max(0, Math.min(g.r, w / 2, h / 2));
    const tr = g.rot ? ` transform="rotate(${n2(g.rot)} ${n2(g.x + w / 2)} ${n2(g.y + h / 2)})"` : "";
    return `<rect x="${n2(g.x)}" y="${n2(g.y)}" width="${n2(w)}" height="${n2(h)}" rx="${n2(r)}"${tr} ${st}/>`;
  }
  if (kind === "line") return `<path d="M${n2(g.x1)} ${n2(g.y1)} L${n2(g.x2)} ${n2(g.y2)}" ${st}/>`;
  const span = Math.max(-360, Math.min(360, g.a1 - g.a0));
  const P = (a) => `${n2(g.cx + g.r * Math.cos(a * DEG))} ${n2(g.cy + g.r * Math.sin(a * DEG))}`;
  const sweep = span >= 0 ? 1 : 0;
  return `<path d="M${P(g.a0)} A${n2(g.r)} ${n2(g.r)} 0 0 ${sweep} ${P(g.a0 + span / 2)} A${n2(g.r)} ${n2(g.r)} 0 0 ${sweep} ${P(g.a0 + span)}" ${st}/>`;
}
const MARK_D = "M70,60 A10,10 0 1 1 50,60 A10,10 0 1 1 70,60 Z M87,60 A27,27 0 1 1 33,60 A27,27 0 1 1 87,60 Z M79,60 A19,19 0 1 1 41,60 A19,19 0 1 1 79,60 Z M102,60 A42,42 0 1 1 18,60 A42,42 0 1 1 102,60 Z M96,60 A36,36 0 1 1 24,60 A36,36 0 1 1 96,60 Z M115,60 A55,55 0 1 1 5,60 A55,55 0 1 1 115,60 Z M111,60 A51,51 0 1 1 9,60 A51,51 0 1 1 111,60 Z";
const markSvg = (m) => (m ? `<g opacity="${m.o ?? 1}" transform="translate(${m.cx} ${m.cy}) scale(${m.size / 120}) translate(-60 -60)"><path d="${MARK_D}" fill="rgb(${COL.ink.join(",")})" fill-rule="evenodd"/></g>` : "");

function draw(S, P, vb, size, unit, mark) {
  let body = "";
  for (const k of ["rect", "line", "arc"]) for (const s of S[k]) body += pieceSvg(k, s.g, s.look, unit);
  if (PARK) for (const k of ["rect", "line", "arc"]) for (const s of P[k]) body += pieceSvg(k, s.g, { ...s.look, o: 0.5 }, unit, [230, 60, 60]);
  return `<svg viewBox="${vb}" width="${size[0]}" height="${size[1]}" xmlns="http://www.w3.org/2000/svg" style="background:${BG};display:block">${body}${markSvg(mark)}</svg>`;
}
const browser = await chromium.launch({ channel: "chrome" });
fs.mkdirSync(path.join(DIR, "singles"), { recursive: true });
for (const id of args.filter((a) => !a.startsWith("--"))) {
  const f = FORMATIONS.find((x) => x.id === id || x.id.startsWith(id + "-"));
  if (!f) { console.log("no", id); continue; }
  const a = makeApi(); f.build(a);
  // desktop: 600 units drawn 600 px here; the real pane is ~410 px, so 2px = 2.93 units
  const desk = draw(a.S, a.P, "0 0 600 800", [600, 800], 1.465, f.mark);
  let mob;
  if (f.mobile) { const m = makeApi(); f.mobile(m); mob = draw(m.S, m.P, "0 175 600 450", [600, 450], 1.66, f.mobileMark ?? f.mark); }
  else { const ph = f.phone, w = 600 / ph.s, h = 450 / ph.s; mob = draw(a.S, a.P, `${n2(ph.cx - w / 2)} ${n2(ph.cy - h / 2)} ${n2(w)} ${n2(h)}`, [600, 450], 1.66 / ph.s, f.mark); }
  // the phone pocket at true relative size: 361 px band vs the 410 px pane
  const html = `<!doctype html><html><body style="margin:0;background:#07080a;color:#9aa;font:13px sans-serif"><div style="display:flex;gap:20px;padding:16px;align-items:flex-start">${desk}<div style="display:grid;gap:10px"><div style="width:528px;height:396px;overflow:hidden">${mob.replace('width="600" height="450"', 'width="528" height="396"')}</div><div>${f.id} · ${f.anchor ?? ""}<br>${f.mobile ? "phone: own composition" : `phone: s ${f.phone.s} at ${f.phone.cx},${f.phone.cy}`}</div></div></div></body></html>`;
  const page = await browser.newPage({ viewport: { width: 1180, height: 840 } });
  await page.setContent(html);
  await page.screenshot({ path: path.join(DIR, "singles", `sketch-${f.id}${LIGHT ? "-light" : ""}.png`), fullPage: true });
  await page.close();
  console.log("sketched", f.id);
}
await browser.close();
