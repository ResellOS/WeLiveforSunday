/** Sleeper CDN URL helpers — safe for client and server bundles. */

export function sleeperPlayerThumb(playerId: string): string {
  return `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;
}

export function sleeperTeamLogo(teamAbbr: string): string {
  return `https://sleepercdn.com/images/team_logos/nfl/${teamAbbr.toLowerCase()}.png`;
}
