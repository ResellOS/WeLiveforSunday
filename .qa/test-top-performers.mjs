import { config } from "dotenv";
config({ path: ".env.local" });
import { loadTopFantasyPerformers } from "../lib/server/topPerformers.ts";

const board = await loadTopFantasyPerformers(process.env.SLEEPER_LEAGUE_ID, 1);
console.log(board.label, board.projected, board.performers.length, board.performers[0]?.name);
