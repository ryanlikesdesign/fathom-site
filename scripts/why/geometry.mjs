// Captures the /why page's measured geometry at one window size, the way the
// director reads it (components/why/anchors.ts measure, with every pin
// released): each [data-why-at] box in document px, 1svh, the scroll range,
// the header, and the stage pane's grid unit. test/why/morph-continuity.test.ts
// times every move on it (each runs over enough scroll to read as motion).
//
//   (dev server on :3011) node scripts/why/geometry.mjs 1440x900 > test/fixtures/why-geometry-1440.json
import { chromium } from "playwright-core";

const [size = "1440x900", url = "http://localhost:3011/why"] = process.argv.slice(2);
const [width, height] = size.split("x").map(Number);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width, height } });
await page.route(/posthog/, (r) => r.abort());
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const geom = await page.evaluate(() => {
  const article = document.querySelector("article.why");
  article.setAttribute("data-why-measuring", "");
  const y = scrollY;
  const at = {};
  article.querySelectorAll("[data-why-at]").forEach((el) => {
    const name = el.dataset.whyAt;
    if (name in at) return;
    const r = el.getBoundingClientRect();
    at[name] = { top: Math.round((r.top + y) * 10) / 10, height: Math.round(r.height * 10) / 10 };
  });
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;height:100svh;width:0;visibility:hidden";
  document.body.appendChild(probe);
  const svh = probe.getBoundingClientRect().height / 100;
  probe.remove();
  const svg = document.querySelector(".why-pane svg.why-morph")?.getBoundingClientRect();
  const unit = svg && svg.width ? Math.min(svg.width / 600, svg.height / 800) : 1;
  article.removeAttribute("data-why-measuring");
  return {
    mode: document.documentElement.getAttribute("data-why"),
    at,
    svh,
    maxScroll: document.documentElement.scrollHeight - innerHeight,
    headerH: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-h")) || 0,
    unit,
  };
});
await browser.close();
console.log(JSON.stringify({ size, ...geom }, null, 1));
