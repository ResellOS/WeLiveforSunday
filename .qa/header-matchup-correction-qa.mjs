import { chromium } from "playwright";
import { statSync } from "fs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
await page.goto("http://localhost:3002/", {
  waitUntil: "networkidle",
  timeout: 120000,
});
await page.waitForTimeout(2500);

const metrics = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  headerH: document.querySelector(".header-inner")?.clientHeight,
  navIcons: [...document.querySelectorAll(".nav-icon")].map((el) => ({
    w: el.clientWidth,
    h: el.clientHeight,
    src: el.getAttribute("src"),
  })),
  navItems: [...document.querySelectorAll(".nav-item")].map((el) => ({
    w: el.clientWidth,
    h: el.clientHeight,
    label: el.querySelector(".nav-label")?.textContent,
  })),
  matchupHeaderNavs: document.querySelectorAll(".matchups-header-nav").length,
  matchupBottomControls: document.querySelectorAll(".weekly-matchups-controls")
    .length,
  matchupDots: document.querySelectorAll(".weekly-matchups-dot").length,
  visibleMatchups: document.querySelectorAll(
    ".weekly-matchups-page-active .matchup-premium-card",
  ).length,
  matchupPages: document.querySelectorAll(".weekly-matchups-page").length,
  headerActionsHTML: document
    .querySelector(".matchups-header-actions")
    ?.innerHTML.includes("matchups-header-nav"),
}));

const iconSizes = {
  homeicon: statSync("public/images/nav/homeicon.png").size,
};

console.log(JSON.stringify({ metrics, iconSizes }, null, 2));
await page.screenshot({
  path: ".qa/header-matchup-correction.png",
  clip: { x: 0, y: 0, width: 1536, height: 140 },
});
await browser.close();
