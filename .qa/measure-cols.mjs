import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });

const cols = await page.evaluate(() => {
  const areas = [
    ".home-area-featured",
    ".home-area-standings",
    ".home-area-matchups",
    ".home-area-countdown",
    ".home-area-news",
    ".home-area-champion",
  ];
  return Object.fromEntries(
    areas.map((sel) => {
      const el = document.querySelector(sel);
      const r = el?.getBoundingClientRect();
      return [sel, r ? { w: Math.round(r.width), l: Math.round(r.left), r: Math.round(r.right) } : null];
    }),
  );
});

console.log(JSON.stringify(cols, null, 2));
await page.screenshot({ path: ".qa/homepage-layout-fixed-full.png", fullPage: true });
await browser.close();
