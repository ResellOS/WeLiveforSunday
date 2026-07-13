/**
 * Editable league configuration for We Live for Sundays (WLFS).
 *
 * These are hand-maintained constants (dates, static copy, links) that don't
 * live in Sleeper or Supabase. Update them each season.
 */

/** The league's inaugural season (used for season selectors, "seasons completed", etc.). */
export const FIRST_SEASON = 2018;

/* -------------------------------------------------------------------------- */
/* Key dates — update every season                                             */
/* -------------------------------------------------------------------------- */

/** In-season trade deadline. */
export const TRADE_DEADLINE = new Date("2026-11-17T23:59:00-05:00");

/** Rookie draft date. */
export const ROOKIE_DRAFT_DATE = new Date("2026-08-25T20:00:00-04:00");

/**
 * Fallback NFL kickoff used only if Sleeper's NFL state can't provide a live
 * next-kickoff. The home page prefers a computed/live value when available.
 */
export const NFL_KICKOFF_FALLBACK = new Date("2026-09-10T20:20:00-04:00");

/* -------------------------------------------------------------------------- */
/* Static copy                                                                 */
/* -------------------------------------------------------------------------- */

export const LEAGUE_TAGLINE = "Where legends are forged and Sundays are sacred.";

/** Shown in the Trophy Room / Teams reward blurb. */
export const CHAMPION_REWARD_TEXT =
  "The WLFS champion takes home the league trophy, a custom championship jersey, and eternal glory in the Trophy Room.";

/** Static total payout figure for the Trophy Room stat bar. */
export const TOTAL_PAYOUTS = "$12,000";

/* -------------------------------------------------------------------------- */
/* Social links (footer)                                                       */
/* -------------------------------------------------------------------------- */

export interface SocialLink {
  label: string;
  href: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "X / Twitter", href: "https://x.com/" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "Discord", href: "https://discord.com/" },
];
