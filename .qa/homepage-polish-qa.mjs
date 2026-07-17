import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
await page.goto("http://localhost:3002/", { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(3000);
await page.waitForSelector(".performer-card", { timeout: 15000 }).catch(() => null);

const metrics = await page.evaluate(() => ({
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  powerRows: document.querySelectorAll(".power-rank-row").length,
  nflCards: document.querySelectorAll(".nfl-score-card").length,
  performerCards: document.querySelectorAll(".performer-card").length,
  activityItems: document.querySelectorAll(".activity-item").length,
  matchupSpotlight: document.querySelectorAll(".matchup-premium-card").length,
  dots: document.querySelectorAll(".weekly-matchups-dot").length,
  standingsRows: document.querySelectorAll(".standings-row").length,
  nflGridCols: document.querySelector(".nfl-scores-grid")
    ? getComputedStyle(document.querySelector(".nfl-scores-grid")).gridTemplateColumns
    : null,
}));

console.log(JSON.stringify(metrics, null, 2));
await page.screenshot({ path: ".qa/homepage-polish-final.png", fullPage: false });
await browser.close();
