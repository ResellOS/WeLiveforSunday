/**
 * Stable franchise accent colors for Trades surfaces (Trade Tree, Trade History,
 * Hall of Fame / Shame) and other WLFS team callouts.
 *
 * Prefer roster-id mapping so a franchise keeps the same color across seasons
 * even if the display name changes. Name-hash is a fallback for places that
 * only have a string (champions lists, etc.).
 */

/** High-contrast metallic / field palette — distinct under dense tree branches. */
export const TEAM_COLOR_PALETTE = [
  "#C9A227", // metallic gold
  "#3D8B6E", // deep field green
  "#4A7DB8", // steel blue
  "#C45C4A", // aged crimson
  "#8B6BB8", // bronze-violet
  "#D4893A", // copper
  "#2F9E8F", // teal
  "#A67C52", // warm bronze
  "#6B8F3A", // olive
  "#B85C7A", // muted rose
  "#5A8A9E", // slate teal
  "#9E7B2F", // antique brass
] as const;

/**
 * Optional hand-tuned overrides by Sleeper roster_id.
 * Fill in once franchises are locked if you want fixed brand colors.
 */
export const TEAM_COLOR_OVERRIDES: Record<number, string> = {
  // e.g. 1: "#C9A227",
};

export function teamColorForRoster(rosterId: number): string {
  const override = TEAM_COLOR_OVERRIDES[rosterId];
  if (override) return override;
  const idx = Math.abs(rosterId) % TEAM_COLOR_PALETTE.length;
  return TEAM_COLOR_PALETTE[idx];
}

/** Name-based fallback when roster id is unavailable. */
export function teamColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TEAM_COLOR_PALETTE[Math.abs(hash) % TEAM_COLOR_PALETTE.length];
}

/** Readable label color on a solid team badge. */
export function teamBadgeTextColor(bgHex: string): "#0A0E14" | "#F5F1E8" {
  const hex = bgHex.replace("#", "");
  if (hex.length < 6) return "#F5F1E8";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Relative luminance (sRGB approx).
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "#0A0E14" : "#F5F1E8";
}
