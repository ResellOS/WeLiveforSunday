"use client";

import { useEffect, useRef } from "react";
import type { FantasyNewsItem } from "@/lib/home";
import { sleeperPlayerThumb, sleeperTeamLogo } from "@/lib/sleeperMedia";

function categoryClass(cat: string): string {
  const k = cat.toLowerCase();
  if (k.includes("injury")) return "news-cat news-cat-injury";
  if (k.includes("trade")) return "news-cat news-cat-trade";
  return "news-cat";
}

function isBreaking(item: FantasyNewsItem): boolean {
  const k = item.category.toLowerCase();
  return k.includes("injury") || k.includes("breaking") || k.includes("out");
}

export function SleeperNews({ items }: { items: FantasyNewsItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length <= 3) return;

    let frame: number;
    let pos = 0;
    const speed = 0.2;

    const tick = () => {
      pos += speed;
      const half = track.scrollHeight / 2;
      if (pos >= half) pos = 0;
      track.style.transform = `translateY(-${pos}px)`;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [items.length]);

  const display = items.length > 3 ? [...items, ...items] : items;

  return (
    <div className="sleeper-news sleeper-news-v2">
      <span className="sleeper-news-live-pulse" aria-hidden="true" />
      <div className="sleeper-news-viewport">
        <div ref={trackRef} className="sleeper-news-track">
          {display.map((item, i) => (
            <article
              key={`${item.playerId}-${item.headline}-${i}`}
              className={[
                "news-card",
                isBreaking(item) && "news-card-breaking",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="news-card-headshot">
                <span className="news-card-headshot-energy" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sleeperPlayerThumb(item.playerId)}
                  alt={item.playerName}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sleeperTeamLogo(item.nflTeam)}
                  alt=""
                  className="news-card-team-logo"
                />
              </div>
              <div className="news-card-body min-w-0">
                <div className="news-card-top">
                  <span className={categoryClass(item.category)}>
                    {item.category}
                  </span>
                  <span className="news-card-time">{item.time}</span>
                </div>
                <p className="news-card-player">
                  {item.playerName}
                  <span className="news-card-pos">
                    {item.position} · {item.nflTeam}
                  </span>
                </p>
                <p className="news-card-headline">{item.headline}</p>
                <div className="news-card-footer">
                  <span className="news-card-source">{item.source}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="news-card-link"
                    aria-label={`Read article on ${item.source}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M14 4h6v6M10 14 4 20M20 4 10 10" />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
