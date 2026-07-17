"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FantasyPerformer } from "@/lib/home";
import {
  sleeperPlayerThumb,
  sleeperTeamLogo,
} from "@/lib/sleeperMedia";
import { fmtPoints } from "@/lib/format";

function playerEnergyClass(name: string, position: string): string {
  const n = name.toLowerCase();
  if (
    (n.includes("allen") && position === "QB") ||
    (n.includes("jackson") && position === "QB") ||
    (n.includes("burrow") && position === "QB")
  ) {
    return "performer-energy-blue";
  }
  if (
    n.includes("jefferson") ||
    n.includes("chase") ||
    n.includes("lamb") ||
    position === "WR"
  ) {
    return "performer-energy-purple";
  }
  if (
    n.includes("mccaffrey") ||
    n.includes("cmc") ||
    n.includes("henry") ||
    position === "RB"
  ) {
    return "performer-energy-green";
  }
  if (
    n.includes("mahomes") ||
    n.includes("kelce") ||
    n.includes("hill") ||
    position === "TE"
  ) {
    return "performer-energy-orange";
  }
  if (position === "QB") return "performer-energy-blue";
  return "performer-energy-neutral";
}

function PerformerCard({
  player,
  projected,
}: {
  player: FantasyPerformer;
  projected: boolean;
}) {
  const tier =
    player.rank === 1
      ? "gold"
      : player.rank === 2
        ? "silver"
        : player.rank === 3
          ? "bronze"
          : null;

  const energy = playerEnergyClass(player.name, player.position);

  return (
    <article
      className={[
        "performer-card",
        tier && `performer-card-${tier}`,
        energy,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="performer-rank">#{player.rank}</span>
      <div className="performer-card-bg" aria-hidden="true" />
      <div className="performer-card-lights" aria-hidden="true" />
      <div className="performer-card-vignette" aria-hidden="true" />
      <div className="performer-card-shine" aria-hidden="true" />
      {tier && <div className="performer-card-particles" aria-hidden="true" />}
      <div className="performer-headshot-wrap">
        <div className={`performer-energy ${energy}`} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sleeperPlayerThumb(player.playerId)}
          alt={player.name}
          className="performer-headshot"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sleeperTeamLogo(player.nflTeam)}
          alt=""
          className="performer-team-logo"
        />
      </div>
      <div className="performer-info">
        <span className="performer-name">{player.name}</span>
        <span className="performer-pos">{player.position}</span>
      </div>
      <div className="performer-fpts">
        <span className="performer-fpts-val">
          {projected ? player.fpts.toLocaleString() : fmtPoints(player.fpts)}
        </span>
        <span className="performer-fpts-label">
          {projected ? "KTC" : "FPTS"}
        </span>
      </div>
      <div className="performer-proj">
        {projected ? "Projected" : `Proj ${fmtPoints(player.projected)}`}
      </div>
      <p className="performer-statline">{player.statLine}</p>
      <div className="performer-footer">
        <span
          className={
            player.trend === "up"
              ? "performer-trend performer-trend-up"
              : player.trend === "down"
                ? "performer-trend performer-trend-down"
                : "performer-trend"
          }
        >
          {player.trend === "up" ? "▲" : player.trend === "down" ? "▼" : "—"}
        </span>
        {player.boom && <span className="performer-boom">BOOM</span>}
      </div>
    </article>
  );
}

const PAGE_SIZE = 4;
const ROTATE_MS = 5_000;

export function FantasyPerformersCarousel({
  performers,
  label,
  projected = false,
}: {
  performers: FantasyPerformer[];
  label: string;
  projected?: boolean;
}) {
  const pages = useMemo(() => {
    if (performers.length === 0) return [];
    const pageCount = Math.ceil(performers.length / PAGE_SIZE);
    const out: FantasyPerformer[][] = [];
    for (let page = 0; page < pageCount; page++) {
      const items: FantasyPerformer[] = [];
      for (let slot = 0; slot < PAGE_SIZE; slot++) {
        const idx = (page * PAGE_SIZE + slot) % performers.length;
        items.push(performers[idx]);
      }
      out.push(items);
    }
    return out;
  }, [performers]);

  const [pageIndex, setPageIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (hovering || reducedMotion || pages.length <= 1) return;
    const id = setInterval(() => {
      setSlideDir(1);
      setPageIndex((i) => (i + 1) % pages.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [hovering, reducedMotion, pages.length]);

  const goToPage = useCallback(
    (index: number) => {
      setSlideDir(
        index > pageIndex || (pageIndex === pages.length - 1 && index === 0)
          ? 1
          : -1,
      );
      setPageIndex(index);
    },
    [pageIndex, pages.length],
  );

  const nextPage = () => goToPage((pageIndex + 1) % pages.length);
  const prevPage = () => goToPage((pageIndex - 1 + pages.length) % pages.length);

  if (performers.length === 0) {
    return (
      <div className="performers-carousel">
        <div className="performers-carousel-header">
          <span className="performers-carousel-title">Top Fantasy Performers</span>
          <span className="performers-carousel-sub">No data yet</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="performers-carousel"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="performers-carousel-header">
        <span className="performers-carousel-title">Top Fantasy Performers</span>
        <span className="performers-carousel-sub">TOP 50 — {label}</span>
      </div>
      <div className="performers-carousel-controls">
        <button
          type="button"
          className="performers-carousel-nav"
          onClick={prevPage}
          aria-label="Previous performers page"
        >
          ‹
        </button>
        <div
          className="performers-carousel-viewport"
          aria-live="polite"
          data-slide-dir={slideDir}
        >
          <div className="performers-carousel-stage">
            {pages.map((pagePlayers, i) => (
              <div
                key={i}
                className={[
                  "performers-carousel-page",
                  i === pageIndex && "performers-carousel-page-active",
                  i < pageIndex && "performers-carousel-page-left",
                  i > pageIndex && "performers-carousel-page-right",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden={i !== pageIndex}
              >
                {pagePlayers.map((p) => (
                  <PerformerCard
                    key={`${i}-${p.playerId}`}
                    player={p}
                    projected={projected}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="performers-carousel-nav"
          onClick={nextPage}
          aria-label="Next performers page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
