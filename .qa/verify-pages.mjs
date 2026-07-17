import { chromium } from "playwright";

const routes = [
  "/",
  "/teams",
  "/teams?view=all",
  "/teams?view=power-rankings",
  "/history",
  "/history?view=timeline",
  "/trophy-room",
  "/trophy-room?view=championship",
  "/record-book",
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

const results = [];
const chunkFails = [];

page.on("response", (r) => {
  if (r.status() >= 400 && r.url().includes("_next")) {
    chunkFails.push({ status: r.status(), url: r.url() });
  }
});

for (const route of routes) {
  const errors = [];
  const onConsole = (m) => {
    if (m.type() === "error") errors.push(m.text());
  };
  page.on("console", onConsole);

  let status = 0;
  try {
    const res = await page.goto(`http://localhost:3002${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    status = res?.status() ?? 0;
    await page.waitForTimeout(2500);
  } catch (e) {
    results.push({ route, status: "TIMEOUT", errors: [String(e)] });
    page.off("console", onConsole);
    continue;
  }

  const overlay =
    (await page.locator("[data-nextjs-toast]").count()) +
    (await page.getByText("missing required error").count());
  const hydration = errors.filter((e) => /hydrat/i.test(e)).length;

  results.push({
    route,
    status,
    overlay,
    hydration,
    errors: errors.slice(0, 2),
  });
  page.off("console", onConsole);
}

await page.goto("http://localhost:3002/teams", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForTimeout(2000);
const rosterHref = await page.evaluate(() => {
  const a = document.querySelector('a[href^="/teams/"]');
  return a?.getAttribute("href") ?? null;
});

if (rosterHref) {
  const errors = [];
  const onConsole = (m) => {
    if (m.type() === "error") errors.push(m.text());
  };
  page.on("console", onConsole);
  const res = await page.goto(`http://localhost:3002${rosterHref}`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(2500);
  const overlay =
    (await page.locator("[data-nextjs-toast]").count()) +
    (await page.getByText("missing required error").count());
  const hydration = errors.filter((e) => /hydrat/i.test(e)).length;
  results.push({
    route: rosterHref,
    status: res?.status(),
    overlay,
    hydration,
    errors: errors.slice(0, 2),
  });
  page.off("console", onConsole);
}

await page.goto("http://localhost:3002/trophy-room", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForTimeout(2000);
const trophyAssets = await page.evaluate(() => ({
  history: !!document.querySelector(".tr-championship-vault-grid"),
  earnings: !!document.querySelector(".tr-career-earnings-exhibit"),
  awaits: !!document.querySelector(".tr-dynasty-milestones-exhibit"),
  jersey: !!document.querySelector('img[src*="trophy-jersey-art"]'),
  legacy: !!document.querySelector(".tr-league-legacy-exhibit"),
  moments: !!document.querySelector(".tr-dynasty-moments-exhibit"),
  heroVault: !!document.querySelector(".tr-vault-hero"),
}));

const broken = results.filter(
  (r) => r.status !== 200 || r.overlay > 0 || r.hydration > 0,
);

console.log(
  JSON.stringify({ results, chunkFails, broken, trophyAssets }, null, 2),
);
await browser.close();
process.exit(broken.length > 0 || chunkFails.length > 0 ? 1 : 0);
