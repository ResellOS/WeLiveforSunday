import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });

await page.goto("http://localhost:3002/teams?view=all", {
  waitUntil: "networkidle",
  timeout: 120000,
});
await page.waitForTimeout(2000);
await page.screenshot({ path: ".qa/teams-all.png", fullPage: true });

await page.goto("http://localhost:3002/teams?view=power-rankings", {
  waitUntil: "networkidle",
  timeout: 120000,
});
await page.waitForTimeout(1500);
await page.screenshot({ path: ".qa/teams-power-rankings.png", fullPage: true });

const rosterLink = await page.$("a.teams-power-row");
const href = rosterLink ? await rosterLink.getAttribute("href") : "/teams/1";
await page.goto(`http://localhost:3002${href}`, {
  waitUntil: "networkidle",
  timeout: 120000,
});
await page.waitForTimeout(2000);
await page.screenshot({ path: ".qa/teams-detail.png", fullPage: true });

const metrics = await page.evaluate(() => ({
  cards: document.querySelectorAll(".team-franchise-card").length,
  powerRows: document.querySelectorAll(".teams-power-row").length,
  rosterRows: document.querySelectorAll(".team-roster-row").length,
  scheduleRows: document.querySelectorAll(".team-schedule-row").length,
}));

console.log(JSON.stringify(metrics, null, 2));
await browser.close();
