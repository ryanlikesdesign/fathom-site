// Captures the homepage in headless Chrome (the installed Google Chrome, via
// playwright-core): `node scripts/shoot.mjs video|light|mobile`. "video" saves a
// frame of the sticky phone at every scene beat plus rest frames (dark);
// "light" the rest frames in light; "mobile" each step at 390px. PostHog is
// blocked. Output goes outside the repo (SHOOT_OUT, default ~/fathom-evidence).

import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = process.env.SHOOT_OUT || `${process.env.HOME}/fathom-evidence/site/shots`;
fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.SHOOT_URL || 'http://localhost:3009/';

async function smoothTo(p, y) {
  const cur = await p.evaluate(() => scrollY);
  const n = 18;
  for (let i = 1; i <= n; i++) { await p.mouse.wheel(0, (y - cur) / n); await p.waitForTimeout(30); }
  await p.waitForTimeout(200);
}
async function waitRest(p, sel, max = 16000) {
  let last = '', stable = 0, t = 0;
  while (t < max) {
    const b = await p.evaluate((s) => document.querySelector(s)?.dataset.beat ?? '', sel);
    if (b === last) stable += 250; else { stable = 0; last = b; }
    if (stable >= 2500) break;
    await p.waitForTimeout(250); t += 250;
  }
  return last;
}

async function desktop(scheme, video) {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme,
    deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.route(/posthog/, r => r.abort());
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `${OUT}/desktop-${scheme}-00-hero.png` });
  const steps = await p.$$eval('.step[data-step]', els => els.map(s => ({ k: s.dataset.step, top: Math.round(s.getBoundingClientRect().top + scrollY) })));
  let i = 1;
  for (const { k, top } of steps) {
    await smoothTo(p, top);
    const sel = `.scrolly-sticky [data-screen="${k}"]`;
    let last = '', stable = 0, t = 0, f = 0;
    const phone = await p.$('.scrolly-sticky .phone');
    while (t < 18000) {
      const b = await p.evaluate((s) => document.querySelector(s)?.dataset.beat ?? '', sel);
      if (b !== last) { stable = 0; last = b; if (video) { await p.waitForTimeout(420); await phone.screenshot({ path: `${OUT}/frames-${String(i).padStart(2,'0')}-${k}-${String(f++).padStart(2,'0')}-${b}.png` }); } }
      else stable += 250;
      if (stable >= 2500) break;
      await p.waitForTimeout(250); t += 250;
    }
    const rest = last;
    await p.screenshot({ path: `${OUT}/desktop-${scheme}-${String(i).padStart(2, '0')}-${k}.png` });
    console.log(scheme, i, k, 'rest=', rest);
    i++;
  }
  const after = await p.$$eval('section', els => els.map(s => Math.round(s.getBoundingClientRect().top + scrollY)).filter(y => y > 0));
  const scrollyEnd = steps.at(-1).top + 900;
  for (const y of after.filter(y => y > scrollyEnd)) {
    await smoothTo(p, y); await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/desktop-${scheme}-${String(i).padStart(2, '0')}-section.png` }); i++;
  }
  await ctx.close(); await b.close();
}

async function mobile(scheme) {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.route(/posthog/, r => r.abort());
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${OUT}/mobile-${scheme}-00-hero.png` });
  const n = await p.$$eval('.step', els => els.length);
  for (let i = 0; i < n; i++) {
    await p.evaluate((i) => document.querySelectorAll('.step')[i].querySelector('.step-phone')?.scrollIntoView({ block: 'center' }), i);
    await p.waitForTimeout(600);
    await waitRest(p, `.step:nth-of-type(${i + 1}) [data-scene]`, 14000).catch(() => {});
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/mobile-${scheme}-${String(i + 1).padStart(2, '0')}.png` });
  }
  await ctx.close(); await b.close();
}

const mode = process.argv[2];
if (mode === 'video') await desktop('dark', true);
if (mode === 'light') await desktop('light', false);
if (mode === 'mobile') await mobile('dark');
