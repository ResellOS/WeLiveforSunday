/** Trophy Room sidebar view keys — synced to `?view=` query param. */

export const TROPHY_VIEWS = [
  "championship",
  "runner-up",
  "highest-scorer",
  "best-regular-season",
  "manager-of-year",
  "best-draft",
  "trade-of-year",
  "waiver-pickup",
  "toilet-bowl",
  "biggest-comeback",
  "most-points-week",
  "most-points-playoffs",
  "mvp",
  "records",
] as const;

export type TrophyView = (typeof TROPHY_VIEWS)[number];

export const DEFAULT_TROPHY_VIEW: TrophyView = "championship";

export function parseTrophyView(
  raw: string | string[] | undefined,
): TrophyView {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (TROPHY_VIEWS as readonly string[]).includes(v)) {
    return v as TrophyView;
  }
  return DEFAULT_TROPHY_VIEW;
}

export const TROPHY_NAV: Array<{
  view: TrophyView;
  label: string;
  glyph:
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
    | "recordBreakers";
}> = [
  { view: "championship", label: "Championship", glyph: "championship" },
  { view: "runner-up", label: "Runner-Up", glyph: "runnerUp" },
  { view: "highest-scorer", label: "Highest Scorer", glyph: "highestScorer" },
  {
    view: "best-regular-season",
    label: "Best Regular Season",
    glyph: "bestRegular",
  },
  { view: "manager-of-year", label: "Manager of the Year", glyph: "managerOfYear" },
  { view: "best-draft", label: "Best Draft", glyph: "bestDraft" },
  { view: "trade-of-year", label: "Trade of the Year", glyph: "tradeOfYear" },
  { view: "waiver-pickup", label: "Waiver Pickup of the Year", glyph: "waiverPickup" },
  { view: "toilet-bowl", label: "Toilet Bowl", glyph: "toiletBowl" },
  { view: "biggest-comeback", label: "Biggest Comeback", glyph: "biggestComeback" },
  { view: "most-points-week", label: "Most Points — Week", glyph: "mostPointsWeek" },
  {
    view: "most-points-playoffs",
    label: "Most Points — Playoffs",
    glyph: "mostPointsPlayoffs",
  },
  { view: "mvp", label: "League MVP", glyph: "leagueMvp" },
  { view: "records", label: "Records", glyph: "recordBreakers" },
];

export function trophyViewHref(view: TrophyView): string {
  return view === DEFAULT_TROPHY_VIEW
    ? "/trophy-room"
    : `/trophy-room?view=${view}`;
}

export const TROPHY_VIEW_LABELS: Record<TrophyView, string> = Object.fromEntries(
  TROPHY_NAV.map((n) => [n.view, n.label]),
) as Record<TrophyView, string>;
