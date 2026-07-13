"use client";

import { useState } from "react";

// Current NFL season; historical seasons descend from here.
const CURRENT_SEASON = new Date().getFullYear();
const FIRST_SEASON = 2018; // adjust to the league's inaugural season

const SEASONS = Array.from(
  { length: CURRENT_SEASON - FIRST_SEASON + 1 },
  (_, i) => String(CURRENT_SEASON - i),
);

export default function SeasonSelector() {
  const [season, setSeason] = useState(SEASONS[0]);

  return (
    <label className="relative">
      <span className="sr-only">Select season</span>
      <select
        value={season}
        onChange={(e) => setSeason(e.target.value)}
        className="cursor-pointer rounded-md border border-gold/30 bg-background px-3 py-1.5 text-sm font-medium text-offwhite outline-none transition-colors hover:border-gold focus:border-gold focus:ring-1 focus:ring-gold"
      >
        {SEASONS.map((yr) => (
          <option key={yr} value={yr} className="bg-background text-offwhite">
            {yr}
          </option>
        ))}
      </select>
    </label>
  );
}
