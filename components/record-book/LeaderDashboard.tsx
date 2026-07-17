"use client";

import { useEffect, useState } from "react";
import { teamAccentColor } from "@/lib/teamColor";
import { TrophyGlyph, type TrophyGlyphKey } from "@/components/trophy/TrophyGlyph";

export type LeaderCardData = {
  key: string;
  icon: TrophyGlyphKey;
  label: string;
  /** Primary display — number or status text */
  value: string;
  /** Team/manager name below value */
  subtext?: string | null;
  /** Animate count-up when value is numeric */
  numeric?: boolean;
  waiting?: boolean;
};

function AnimatedValue({
  value,
  numeric,
  waiting,
}: {
  value: string;
  numeric?: boolean;
  waiting?: boolean;
}) {
  const parsed = numeric ? parseFloat(value.replace(/,/g, "")) : NaN;
  const [display, setDisplay] = useState(
    numeric && !Number.isNaN(parsed) ? 0 : value,
  );

  useEffect(() => {
    if (!numeric || Number.isNaN(parsed) || waiting) {
      setDisplay(value);
      return;
    }

    const duration = 900;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(parsed * eased).toLocaleString());
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, numeric, parsed, waiting]);

  return (
    <span
      className={
        waiting ? "leader-value leader-value-waiting" : "leader-value"
      }
      style={
        !waiting && !numeric
          ? { color: teamAccentColor(value) }
          : undefined
      }
    >
      {display}
    </span>
  );
}

export function LeaderDashboard({ cards }: { cards: LeaderCardData[] }) {
  return (
    <div className="leader-cards leader-cards-premium">
      {cards.map((card, i) => (
        <div
          key={card.key}
          className="leader-card leader-card-premium"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <span className="leader-card-glow" aria-hidden="true" />
          <TrophyGlyph name={card.icon} className="leader-glyph" />
          <AnimatedValue
            value={card.value}
            numeric={card.numeric}
            waiting={card.waiting}
          />
          {card.subtext && !card.waiting && (
            <span
              className="leader-team"
              style={{ color: teamAccentColor(card.subtext) }}
            >
              {card.subtext}
            </span>
          )}
          <span className="leader-label">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
