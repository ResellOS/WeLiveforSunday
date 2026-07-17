"use client";

import { useState } from "react";

const CURRENT_SEASON = new Date().getFullYear();
const FIRST_SEASON = 2026;

const SEASONS = Array.from(
  { length: Math.max(1, CURRENT_SEASON - FIRST_SEASON + 1) },
  (_, i) => String(CURRENT_SEASON - i),
);

export default function SeasonSelector() {
  const [season, setSeason] = useState(SEASONS[0]);

  return (
    <label className="season-plate">
      <span className="sr-only">Select season</span>
      <select value={season} onChange={(e) => setSeason(e.target.value)}>
        {SEASONS.map((yr) => (
          <option key={yr} value={yr}>
            Season {yr}
          </option>
        ))}
      </select>
      <span className="season-since" aria-hidden="true">
        Since {FIRST_SEASON}
      </span>
    </label>
  );
}
