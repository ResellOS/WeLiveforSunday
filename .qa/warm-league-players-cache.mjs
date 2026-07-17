import { config } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

const leagueId = process.env.SLEEPER_LEAGUE_ID;
const cacheDir = join(process.cwd(), ".cache");
const fullPath = join(cacheDir, "sleeper-players.json");
const leaguePath = join(cacheDir, `league-${leagueId}-players.json`);

const rosters = await fetch(
  `https://api.sleeper.app/v1/league/${leagueId}/rosters`,
).then((r) => r.json());

const ids = new Set();
for (const r of rosters) for (const p of r.players ?? []) ids.add(p);

const full = JSON.parse(readFileSync(fullPath, "utf8"));
const subset = {};
for (const pid of ids) {
  if (full[pid]) subset[pid] = full[pid];
}

mkdirSync(cacheDir, { recursive: true });
writeFileSync(leaguePath, JSON.stringify(subset));
console.log("league cache", Object.keys(subset).length, "players ->", leaguePath);
