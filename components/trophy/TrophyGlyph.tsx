export type TrophyGlyphKey =
  | "championship"
  | "runnerUp"
  | "highestScorer"
  | "bestRegular"
  | "managerOfYear"
  | "bestDraft"
  | "tradeOfYear"
  | "waiverPickup"
  | "toiletBowl"
  | "biggestComeback"
  | "mostPointsWeek"
  | "mostPointsPlayoffs"
  | "leagueMvp"
  | "payout"
  | "ring"
  | "jersey"
  | "franchises"
  | "season"
  | "playoffs"
  | "legacy"
  | "timeline"
  | "seasonResults"
  | "recordBreakers"
  | "milestones"
  | "ruleChanges"
  | "leagueInfo"
  | "overview"
  | "wins"
  | "winningPct"
  | "pointsAgainst"
  | "winStreaks"
  | "blowouts"
  | "leagueRecords";

const GLYPHS: Record<TrophyGlyphKey, React.ReactNode> = {
  championship: (
    <>
      <path d="M8 4h8v4.6c0 3-1.5 5-4 6-2.5-1-4-3-4-6V4Z" />
      <path d="M8 5.5H5.4v1.8c0 2 1.1 3.3 2.6 3.8M16 5.5h2.6v1.8c0 2-1.1 3.3-2.6 3.8" />
      <path d="M12 14.6V17M9.4 19h5.2M10.4 17h3.2v2h-3.2z" />
    </>
  ),
  runnerUp: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="m9.4 13.4-1.6 6 4.2-2.4 4.2 2.4-1.6-6" />
      <path d="M10.4 9.6 12 6.8l1.6 2.8h-3.2Z" />
    </>
  ),
  highestScorer: (
    <>
      <path d="M4.5 18.5v-6h3v6M10.5 18.5V8h3v10.5M16.5 18.5V4.8h3v13.7" />
      <path d="M3.5 19.5h17" />
    </>
  ),
  bestRegular: (
    <>
      <path d="m12 4 2 4.4 4.8.5-3.6 3.3 1 4.8L12 14.5 7.8 17l1-4.8L5.2 8.9l4.8-.5L12 4Z" />
    </>
  ),
  managerOfYear: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 19.5c.8-4 3.2-6 6.5-6s5.7 2 6.5 6" />
      <path d="M9 5.2c.8-1 1.8-1.6 3-1.6s2.2.6 3 1.6" />
    </>
  ),
  bestDraft: (
    <>
      <path d="M6.5 3.8h11v16.4h-11z" />
      <path d="M9 8h6M9 11.5h6M9 15h4" />
      <path d="M6.5 6.2h11" />
    </>
  ),
  tradeOfYear: (
    <>
      <path d="M4.5 8.5h13" />
      <path d="m14.5 5.5 3 3-3 3" />
      <path d="M19.5 15.5h-13" />
      <path d="m9.5 12.5-3 3 3 3" />
    </>
  ),
  waiverPickup: (
    <>
      <path d="M12 19V7" />
      <path d="m7.5 11.5 4.5-4.5 4.5 4.5" />
      <path d="M5 19.5h14" />
      <circle cx="12" cy="4.5" r="1.4" />
    </>
  ),
  toiletBowl: (
    <>
      <path d="M7 4.5h6v6h6c0 4.5-3 8-8 8.5l1 2H8l1-2c-3-1-5-3.8-5-7.5h3v-7Z" />
    </>
  ),
  biggestComeback: (
    <>
      <path d="M5 17c1.5-6 5-9.5 9.5-10.5" />
      <path d="M11 5.5h4v4" />
      <path d="M5 20h14" />
    </>
  ),
  mostPointsWeek: (
    <>
      <rect x="4.5" y="5.5" width="15" height="14" rx="1" />
      <path d="M4.5 9.5h15M8.5 3.5v4M15.5 3.5v4" />
      <path d="m12 11.5 1.2 2.5 2.8.3-2 1.9.5 2.8-2.5-1.4-2.5 1.4.5-2.8-2-1.9 2.8-.3L12 11.5Z" />
    </>
  ),
  mostPointsPlayoffs: (
    <>
      <path d="M4.5 5.5h5v4h5v4h5v6h-15v-14Z" />
      <path d="M9.5 19.5v-10M14.5 19.5v-6" />
    </>
  ),
  leagueMvp: (
    <>
      <path d="M4.5 8 8 11l4-5.5L16 11l3.5-3v9.5h-15V8Z" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  payout: (
    <>
      <path d="M9.5 4.5h5l1.5 3c2 1.6 3.2 3.8 3.2 6.3 0 3.6-3.2 6-7.2 6s-7.2-2.4-7.2-6c0-2.5 1.2-4.7 3.2-6.3l1.5-3Z" />
      <path d="M9.5 7.5h5" />
      <path d="M12 10v7M10 15.5c.5.7 1.2 1 2 1 1.2 0 2-.6 2-1.5s-.8-1.3-2-1.5c-1.2-.2-2-.6-2-1.5s.8-1.5 2-1.5c.8 0 1.5.3 2 1" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="13.5" r="6" />
      <circle cx="12" cy="13.5" r="3" />
      <path d="m9.5 8.5 1-3h3l1 3" />
      <path d="M10.7 4.2 12 2.5l1.3 1.7" />
    </>
  ),
  jersey: (
    <>
      <path d="m8.5 4 3.5-1.2L15.5 4l4 2.4-1.4 3.4-2.1-1v11H8V8.8l-2.1 1L4.5 6.4l4-2.4Z" />
      <path d="M9.6 4.2c.6 1 1.4 1.6 2.4 1.6s1.8-.6 2.4-1.6" />
    </>
  ),
  franchises: (
    <>
      <circle cx="8.5" cy="8" r="2.6" />
      <circle cx="15.8" cy="8.8" r="2.1" />
      <path d="M3.6 18.6c.7-3.4 2.7-5.2 4.9-5.2s4.2 1.8 4.9 5.2" />
      <path d="M13.9 15c1.8.2 3.2 1.5 3.8 3.6" />
    </>
  ),
  season: (
    <>
      <ellipse cx="12" cy="12" rx="8.5" ry="5.5" transform="rotate(-25 12 12)" />
      <path d="m8.5 14.5 7-5M10 10.6l1.4 1.4M11.6 9.4l1.4 1.4M13.2 8.3l1.4 1.4" />
    </>
  ),
  playoffs: (
    <>
      <path d="M4.5 5.5h5v4.2h-5zM4.5 14.3h5v4.2h-5zM14.5 9.9h5v4.2h-5z" />
      <path d="M9.5 7.6h2.5V12m0 0v4.4H9.5M12 12h2.5" />
    </>
  ),
  legacy: (
    <>
      <path d="M12 3.5c2.4 2.2 3.8 5.2 3.8 8.5s-1.4 6.3-3.8 8.5c-2.4-2.2-3.8-5.2-3.8-8.5S9.6 5.7 12 3.5Z" />
      <path d="M5 9.5c1.6-.8 4-1.3 7-1.3s5.4.5 7 1.3M5 14.5c1.6.8 4 1.3 7 1.3s5.4-.5 7-1.3" />
    </>
  ),
  timeline: (
    <>
      <path d="M3.5 12h17" />
      <circle cx="7" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="17" cy="12" r="1.8" />
      <path d="M7 10.2V6.5M12 13.8v3.7M17 10.2V6.5" />
    </>
  ),
  seasonResults: (
    <>
      <path d="M5 4.5h14v15H5z" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </>
  ),
  recordBreakers: (
    <>
      <path d="m13 3.5-6.5 10h5l-1.5 7 6.5-10h-5l1.5-7Z" />
    </>
  ),
  milestones: (
    <>
      <path d="M6.5 20.5v-16" />
      <path d="M6.5 4.5h11l-2.5 3.5 2.5 3.5h-11" />
    </>
  ),
  ruleChanges: (
    <>
      <path d="m8.5 5.5 6 6-2.5 2.5-6-6 2.5-2.5Z" />
      <path d="m12 9 6.5 6.5" />
      <path d="M4.5 19.5h9" />
      <path d="M6 16.5h6v3H6z" />
    </>
  ),
  leagueInfo: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 10.5V16" />
      <circle cx="12" cy="7.8" r="0.4" fill="currentColor" />
    </>
  ),
  overview: (
    <>
      <path d="M12 5.5c-1.6-1.3-3.8-2-6.8-2v15c3 0 5.2.7 6.8 2 1.6-1.3 3.8-2 6.8-2v-15c-3 0-5.2.7-6.8 2Z" />
      <path d="M12 5.5v15" />
    </>
  ),
  wins: (
    <>
      <circle cx="12" cy="10" r="5.5" />
      <path d="m9.5 10 1.8 1.8 3.2-3.6" />
      <path d="m8.5 14.8-1.5 5.7 5-2.9 5 2.9-1.5-5.7" />
    </>
  ),
  winningPct: (
    <>
      <path d="m6 18.5 12-13" />
      <circle cx="7.8" cy="7.8" r="2.3" />
      <circle cx="16.2" cy="16.2" r="2.3" />
    </>
  ),
  pointsAgainst: (
    <>
      <path d="M12 3.5 19 6v5.2c0 4.8-2.9 8.4-7 10.3-4.1-1.9-7-5.5-7-10.3V6l7-2.5Z" />
      <path d="m9 11.5 2 2 4-4.5" />
    </>
  ),
  winStreaks: (
    <>
      <path d="M12 3.5c1 2.5 3.5 3.7 3.5 7a3.5 3.5 0 0 1-7 0c0-1.4.5-2.4 1.2-3.4.6 1 1.3 1.5 2.3 1.7-.6-1.8-.6-3.6 0-5.3Z" />
      <path d="M7.5 15.5c.5 2.8 2.2 4.5 4.5 4.5s4-1.7 4.5-4.5" />
    </>
  ),
  blowouts: (
    <>
      <path d="m12 3.5 2 4 4.4-1.9-1.9 4.4 4 2-4 2 1.9 4.4-4.4-1.9-2 4-2-4-4.4 1.9 1.9-4.4-4-2 4-2L10 7.5l2-4Z" />
    </>
  ),
  leagueRecords: (
    <>
      <path d="M6 3.5h12v17l-6-3.5-6 3.5v-17Z" />
      <path d="m12 7.5 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3 1-2.1Z" />
    </>
  ),
};

export function TrophyGlyph({
  name,
  className,
}: {
  name: TrophyGlyphKey;
  className?: string;
}) {
  return (
    <svg
      className={className ?? "trophy-glyph"}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {GLYPHS[name]}
    </svg>
  );
}
