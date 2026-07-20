/**
 * Team accent helpers — re-exports the shared trades/config palette so existing
 * imports keep working with the same roster-stable colors.
 */

export {
  TEAM_COLOR_PALETTE,
  TEAM_COLOR_OVERRIDES,
  teamColorForRoster,
  teamColorForName,
  teamBadgeTextColor,
} from "@/lib/config/teamColors";

import { teamColorForName } from "@/lib/config/teamColors";

/** @deprecated Prefer teamColorForRoster / teamColorForName from config/teamColors. */
export function teamAccentColor(name: string): string {
  return teamColorForName(name);
}
