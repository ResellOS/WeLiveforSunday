/** Small formatting/util helpers shared across pages. */

/** Join truthy class names. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Win percentage in [0,1]; ties count as half a win. */
export function winPct(wins: number, losses: number, ties = 0): number {
  const games = wins + losses + ties;
  if (games === 0) return 0;
  return (wins + ties * 0.5) / games;
}

/** Format a fraction as a leading-dot percentage, e.g. 0.625 -> ".625". */
export function fmtPct3(fraction: number): string {
  return fraction.toFixed(3).replace(/^0/, "");
}

/** "12-4" or "12-4-1" record string. */
export function record(wins: number, losses: number, ties = 0): string {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

/** Ordinal, e.g. 1 -> "1st", 2 -> "2nd". */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** One-decimal points, e.g. 1234.5. */
export function fmtPoints(points: number): string {
  return points.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Combine Sleeper's split fpts / fpts_decimal into a single number. */
export function combineFpts(fpts?: number, fptsDecimal?: number): number {
  return (fpts ?? 0) + (fptsDecimal ?? 0) / 100;
}
