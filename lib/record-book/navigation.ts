import type { TrophyGlyphKey } from "@/components/trophy/TrophyGlyph";

export const RECORD_CATEGORIES: Array<{ key: TrophyGlyphKey; label: string }> =
  [
    { key: "overview", label: "Overview" },
    { key: "wins", label: "Wins" },
    { key: "winningPct", label: "Winning %" },
    { key: "championship", label: "Championships" },
    { key: "playoffs", label: "Playoff Wins" },
    { key: "highestScorer", label: "Points For" },
    { key: "pointsAgainst", label: "Points Against" },
    { key: "tradeOfYear", label: "Trades" },
    { key: "winStreaks", label: "Win Streaks" },
    { key: "blowouts", label: "Blowouts" },
    { key: "mostPointsWeek", label: "Weekly Records" },
    { key: "mostPointsPlayoffs", label: "Playoff Records" },
    { key: "biggestComeback", label: "Comebacks" },
    { key: "leagueRecords", label: "League Records" },
  ];

const SECTION_BY_CATEGORY: Partial<Record<TrophyGlyphKey, string>> = {
  overview: "all-time-leaders",
  wins: "all-time-leaders",
  winningPct: "offensive-records",
  championship: "championship-history",
  playoffs: "win-streaks",
  highestScorer: "offensive-records",
  pointsAgainst: "defensive-records",
  tradeOfYear: "trade-records",
  winStreaks: "win-streaks",
  blowouts: "offensive-records",
  mostPointsWeek: "offensive-records",
  mostPointsPlayoffs: "offensive-records",
  biggestComeback: "misc-records",
  leagueRecords: "all-time-leaders",
};

export function recordCategoryHref(key: TrophyGlyphKey): string {
  const sectionId = SECTION_BY_CATEGORY[key] ?? "all-time-leaders";
  return `#${sectionId}`;
}
