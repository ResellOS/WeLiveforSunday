import { config } from "dotenv";
config({ path: ".env.local" });
import { getKtcValueMap } from "../lib/queries.ts";
import { getRosters } from "../lib/sleeper.ts";

const ktc = await getKtcValueMap();
console.log("ktc size", ktc.size);

const leagueId = process.env.SLEEPER_LEAGUE_ID;
const rosters = await getRosters(leagueId);
const ids = new Set();
for (const r of rosters) for (const p of r.players ?? []) ids.add(p);
console.log("roster players", ids.size);
