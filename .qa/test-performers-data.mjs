import { config } from "dotenv";
config({ path: ".env.local" });

const leagueId = process.env.SLEEPER_LEAGUE_ID;
const headers = {
  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};

const [rosters, ktcRes, playersRes] = await Promise.all([
  fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`).then((r) => r.json()),
  fetch(
    "https://imtbuvnzajjoyhotoxvo.supabase.co/rest/v1/ktc_values?select=player_name,value",
    { headers },
  ).then((r) => r.json()),
  fetch("https://api.sleeper.app/v1/players/nfl").then((r) => r.json()),
]);

const ktc = new Map(ktcRes.map((r) => [r.player_name.toLowerCase(), r.value]));
const ids = new Set();
for (const r of rosters) for (const p of r.players ?? []) ids.add(p);

let matched = 0;
const top = [];
for (const pid of ids) {
  const p = playersRes[pid];
  const name = p?.full_name?.toLowerCase();
  const value = name ? (ktc.get(name) ?? 0) : 0;
  if (value > 0) {
    matched++;
    top.push({ name: p.full_name, value });
  }
}
top.sort((a, b) => b.value - a.value);
console.log({ rosterPlayers: ids.size, ktcSize: ktc.size, matched, top5: top.slice(0, 5) });
