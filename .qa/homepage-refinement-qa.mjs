import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
await page.goto("http://localhost:3002/", { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(3000);
await page.waitForSelector(".performer-card", { timeout: 15000 }).catch(() => null);

const metrics = await page.evaluate(() => {
  const powerRows = document.querySelectorAll(".power-rank-row").length;
  const performerCards = document.querySelectorAll(
    ".performers-carousel-track .performer-card",
  ).length;
  const nflCards = document.querySelectorAll(".nfl-ticker-grid .ticker-game").length;
  const championImg = document.querySelector(".champion-artwork-img");
  const matchupSpotlight = document.querySelectorAll(".matchup-card-spotlight").length;
  const dots = document.querySelectorAll(".weekly-matchups-dot").length;

  return {
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    powerRows,
    performerCards,
    nflCards,
    matchupSpotlight,
    dots,
    championSrc: championImg?.getAttribute("src") ?? null,
    tickerWidth: document.querySelector(".home-area-ticker")?.getBoundingClientRect().width,
    performersWidth: document.querySelector(".home-area-performers")?.getBoundingClientRect().width,
    powerViewportHeight: document.querySelector(".power-rankings-viewport")?.getBoundingClientRect().height,
    nflGridCols: document.querySelector(".nfl-ticker-grid")?.style.gridTemplateColumns ?? null,
  };
});

console.log(JSON.stringify(metrics, null, 2));
await page.screenshot({ path: ".qa/homepage-refinement.png", fullPage: false });
await browser.close();
