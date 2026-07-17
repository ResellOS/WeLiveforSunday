import { chromium } from "playwright";
import { statSync } from "fs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
await page.goto("http://localhost:3002/", {
  waitUntil: "networkidle",
  timeout: 120000,
});
await page.waitForTimeout(3000);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2000);

const metrics = await page.evaluate(() => ({
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  navIcons: [...document.querySelectorAll(".nav-icon-image")].map((el) => ({
    w: el.clientWidth,
    h: el.clientHeight,
    src: el.getAttribute("src"),
  })),
  navLabels: [...document.querySelectorAll(".nav-item-label")].map(
    (el) => el.textContent,
  ),
  performerPages: document.querySelectorAll(".performers-carousel-page").length,
  visiblePerformerCards: [
    ...document.querySelectorAll(".performers-carousel-page-active .performer-card"),
  ].length,
  performerTrackJs: document.querySelectorAll(".performers-carousel-track-js")
    .length,
  matchupPages: document.querySelectorAll(".weekly-matchups-page").length,
  visibleMatchups: [
    ...document.querySelectorAll(
      ".weekly-matchups-page-active .matchup-premium-card",
    ),
  ].length,
  powerRows: document.querySelectorAll(".power-rank-row").length,
}));

const iconSizes = {
  homeicon: statSync("public/images/nav/homeicon.png").size,
  teamsicon: statSync("public/images/nav/teamsicon.png").size,
};

console.log(JSON.stringify({ metrics, iconSizes }, null, 2));
await page.screenshot({
  path: ".qa/refinement-pass-final.png",
  fullPage: false,
});
await browser.close();
