"use client";

import type { TradeHistorySort } from "@/lib/trades/tradeHistory";
import type { TradeTeamInfo } from "@/lib/trades/tradeTreeTypes";

interface TradeHistoryFiltersProps {
  seasons: number[];
  teams: TradeTeamInfo[];
  season: number | "all";
  rosterId: number | "all";
  query: string;
  sort: TradeHistorySort;
  onSeasonChange: (v: number | "all") => void;
  onRosterChange: (v: number | "all") => void;
  onQueryChange: (v: string) => void;
  onSortChange: (v: TradeHistorySort) => void;
  resultCount: number;
}

export function TradeHistoryFilters({
  seasons,
  teams,
  season,
  rosterId,
  query,
  sort,
  onSeasonChange,
  onRosterChange,
  onQueryChange,
  onSortChange,
  resultCount,
}: TradeHistoryFiltersProps) {
  return (
    <div className="th-filters">
      <div className="th-filters-row">
        <label className="th-field th-field--search">
          <span className="th-field-label">Search</span>
          <div className="tt-search-shell search-shell">
            <svg
              className="search-glyph"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="10.5" cy="10.5" r="6.2" />
              <path d="m15.4 15.4 5.1 5.1" />
            </svg>
            <input
              type="search"
              className="search-field tt-search-field"
              placeholder="Player or team…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
        </label>

        <label className="th-field">
          <span className="th-field-label">Team</span>
          <select
            className="th-select"
            value={rosterId === "all" ? "all" : String(rosterId)}
            onChange={(e) => {
              const v = e.target.value;
              onRosterChange(v === "all" ? "all" : Number(v));
            }}
          >
            <option value="all">All teams</option>
            {teams.map((t) => (
              <option key={t.rosterId} value={t.rosterId}>
                {t.teamName}
              </option>
            ))}
          </select>
        </label>

        <label className="th-field">
          <span className="th-field-label">Season</span>
          <select
            className="th-select"
            value={season === "all" ? "all" : String(season)}
            onChange={(e) => {
              const v = e.target.value;
              onSeasonChange(v === "all" ? "all" : Number(v));
            }}
          >
            <option value="all">All seasons</option>
            {seasons.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </label>

        <label className="th-field">
          <span className="th-field-label">Sort</span>
          <select
            className="th-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as TradeHistorySort)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      <p className="th-filters-count" aria-live="polite">
        {resultCount} trade{resultCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
