import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const map = await fetch("https://api.sleeper.app/v1/players/nfl").then((r) =>
  r.json(),
);
const dir = join(process.cwd(), ".cache");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "sleeper-players.json"), JSON.stringify(map));
console.log("cached", Object.keys(map).length, "players");
