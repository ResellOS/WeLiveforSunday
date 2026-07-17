import { chromium } from "playwright";

const browser = await chromium.launch();
const viewports = [
  { width: 1536, height: 1024, out: ".qa/homepage-layout-fixed.png" },
  { width: 1920, height: 1080, out: ".qa/homepage-layout-fixed-1920.png" },
];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    ticker: document.querySelector(".home-area-ticker")?.getBoundingClientRect().width,
    performers: document.querySelector(".home-area-performers")?.getBoundingClientRect().width,
  }));
  console.log(vp.width, JSON.stringify(metrics));
  await page.screenshot({ path: vp.out, fullPage: false });
  await page.close();
}

await browser.close();
