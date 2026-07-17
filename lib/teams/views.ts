/** Teams page sidebar view keys — synced to `?view=` query param. */

export const TEAMS_VIEWS = [
  "all",
  "my-team",
  "contenders",
  "rebuilders",
  "power-rankings",
  "roster-value",
  "team-ages",
  "draft-capital",
] as const;

export type TeamsView = (typeof TEAMS_VIEWS)[number];

export const DEFAULT_TEAMS_VIEW: TeamsView = "all";

export function parseTeamsView(raw: string | string[] | undefined): TeamsView {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (TEAMS_VIEWS as readonly string[]).includes(v)) {
    return v as TeamsView;
  }
  return DEFAULT_TEAMS_VIEW;
}

export const TEAMS_NAV: Array<{
  view: TeamsView;
  label: string;
  glyph:
    | "franchises"
    | "managerOfYear"
    | "championship"
    | "bestDraft"
    | "highestScorer"
    | "payout"
    | "season"
    | "tradeOfYear";
}> = [
  { view: "all", label: "All Teams", glyph: "franchises" },
  { view: "my-team", label: "My Team", glyph: "managerOfYear" },
  { view: "contenders", label: "Contenders", glyph: "championship" },
  { view: "rebuilders", label: "Rebuilders", glyph: "bestDraft" },
  { view: "power-rankings", label: "Power Rankings", glyph: "highestScorer" },
  { view: "roster-value", label: "Roster Value", glyph: "payout" },
  { view: "team-ages", label: "Team Ages", glyph: "season" },
  { view: "draft-capital", label: "Draft Capital", glyph: "tradeOfYear" },
];

export function teamsViewHref(view: TeamsView): string {
  return view === DEFAULT_TEAMS_VIEW ? "/teams" : `/teams?view=${view}`;
}
