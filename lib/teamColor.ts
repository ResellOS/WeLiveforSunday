/** Deterministic accent for franchise names — stays within the site palette. */
const TEAM_ACCENTS = [
  "#40a867",
  "#7eb8e8",
  "#d57367",
  "#c99a55",
  "#b88fd4",
  "#e8c078",
  "#6eb89a",
  "#d4a94e",
] as const;

export function teamAccentColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TEAM_ACCENTS[Math.abs(hash) % TEAM_ACCENTS.length];
}
