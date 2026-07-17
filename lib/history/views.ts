/** History page sidebar view keys — synced to `?view=` query param. */

export const HISTORY_VIEWS = [
  "timeline",
  "champions",
  "season-results",
  "playoffs",
  "leaders",
  "records",
  "milestones",
  "trades",
  "rules",
  "information",
] as const;

export type HistoryView = (typeof HISTORY_VIEWS)[number];

export const DEFAULT_HISTORY_VIEW: HistoryView = "timeline";

export function parseHistoryView(
  raw: string | string[] | undefined,
): HistoryView {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (HISTORY_VIEWS as readonly string[]).includes(v)) {
    return v as HistoryView;
  }
  return DEFAULT_HISTORY_VIEW;
}

export const HISTORY_NAV: Array<{
  view: HistoryView;
  label: string;
  glyph:
    | "timeline"
    | "championship"
    | "seasonResults"
    | "playoffs"
    | "highestScorer"
    | "recordBreakers"
    | "milestones"
    | "tradeOfYear"
    | "ruleChanges"
    | "leagueInfo";
}> = [
  { view: "timeline", label: "Timeline", glyph: "timeline" },
  { view: "champions", label: "Champions", glyph: "championship" },
  { view: "season-results", label: "Season Results", glyph: "seasonResults" },
  { view: "playoffs", label: "Playoff History", glyph: "playoffs" },
  { view: "leaders", label: "League Leaders", glyph: "highestScorer" },
  { view: "records", label: "Record Breakers", glyph: "recordBreakers" },
  { view: "milestones", label: "League Milestones", glyph: "milestones" },
  { view: "trades", label: "Trades History", glyph: "tradeOfYear" },
  { view: "rules", label: "Rule Changes", glyph: "ruleChanges" },
  { view: "information", label: "League Information", glyph: "leagueInfo" },
];

export function historyViewHref(view: HistoryView): string {
  return view === DEFAULT_HISTORY_VIEW
    ? "/history"
    : `/history?view=${view}`;
}

export const CEREMONIAL_MOMENTS = [
  {
    title: "League Officially Founded",
    detail: "The WLFS dynasty officially begins.",
  },
  {
    title: "Sixteen Franchises Joined",
    detail:
      "Every founding manager secured their place in league history.",
  },
  {
    title: "Inaugural Draft Completed",
    detail:
      "The first player draft established the foundation of every franchise.",
  },
  {
    title: "League Rules Finalized",
    detail:
      "The competitive framework of the dynasty was officially established.",
  },
  {
    title: "Opening Kickoff Approaching",
    detail: "The first season of WLFS history is about to begin.",
  },
] as const;
