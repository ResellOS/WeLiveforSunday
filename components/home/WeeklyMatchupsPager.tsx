"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MatchupCard } from "@/components/MatchupCard";
import type { MatchupPair, StandingRow } from "@/lib/league";

const ROTATE_MS = 10_000;
const PAGE_SIZE = 2;

export function WeeklyMatchupsPager({
  pairs,
  teams,
  live,
  week,
}: {
  pairs: MatchupPair[];
  teams: StandingRow[];
  live: boolean;
  week: number;
}) {
  const teamsByRoster = useMemo(
    () => new Map(teams.map((t) => [t.rosterId, t])),
    [teams],
  );

  const pages = useMemo(() => {
    const sorted = [...pairs].sort((a, b) => a.matchupId - b.matchupId);
    if (sorted.length <= PAGE_SIZE) return [sorted];
    const out: MatchupPair[][] = [];
    for (let i = 0; i < sorted.length; i += PAGE_SIZE) {
      out.push(sorted.slice(i, i + PAGE_SIZE));
    }
    return out;
  }, [pairs]);

  const multiPage = pages.length > 1;
  const [pageIndex, setPageIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (!multiPage || hovering || reducedMotion) return;
    intervalRef.current = setInterval(() => {
      setSlideDir(1);
      setPageIndex((i) => (i + 1) % pages.length);
    }, ROTATE_MS);
  }, [clearTimer, multiPage, hovering, reducedMotion, pages.length]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const goToPage = (index: number) => {
    setSlideDir(
      index > pageIndex || (pageIndex === pages.length - 1 && index === 0)
        ? 1
        : -1,
    );
    setPageIndex(index);
    startTimer();
  };

  const nextPage = () => goToPage((pageIndex + 1) % pages.length);
  const prevPage = () => goToPage((pageIndex - 1 + pages.length) % pages.length);

  return (
    <>
      <div className="section-heading matchups-section-heading">
        <div>
          <h2 className="section-title">This Week&apos;s Matchups</h2>
          <p className="section-subtitle">
            Week {week}
            {live ? " · live" : ""}
          </p>
        </div>
        <div className="matchups-header-actions">
          {multiPage && (
            <>
              <button
                type="button"
                className="matchups-header-nav"
                onClick={prevPage}
                aria-label="Previous matchups"
              >
                ‹
              </button>
              <button
                type="button"
                className="matchups-header-nav"
                onClick={nextPage}
                aria-label="Next matchups"
              >
                ›
              </button>
            </>
          )}
          <span className="panel-action">View All Matchups</span>
        </div>
      </div>

      <div
        className="weekly-matchups-pager"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocusCapture={() => setHovering(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setHovering(false);
          }
        }}
      >
        <div
          className="weekly-matchups-stage weekly-matchups-stage-dual"
          aria-live="polite"
          data-slide-dir={slideDir}
        >
          {pages.map((pagePairs, i) => (
            <div
              key={i}
              className={[
                "weekly-matchups-page",
                i === pageIndex && "weekly-matchups-page-active",
                i < pageIndex && "weekly-matchups-page-left",
                i > pageIndex && "weekly-matchups-page-right",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden={i !== pageIndex}
            >
              <div className="weekly-scoreboard weekly-scoreboard-premium">
                {pagePairs.map((p) => (
                  <MatchupCard
                    key={p.matchupId}
                    pair={p}
                    teamsByRoster={teamsByRoster}
                    live={live}
                    variant="spotlight"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
