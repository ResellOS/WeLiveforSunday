"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtPct3, record } from "@/lib/format";
import { teamAccentColor } from "@/lib/teamColor";
import type { TeamCardData } from "@/lib/teams/types";

export type SortKey =
  | "power"
  | "value"
  | "age"
  | "capital"
  | "record"
  | "pct"
  | "pointsFor"
  | "championships";

const SORTS: Array<{ key: SortKey; label: string; needsValue?: boolean }> = [
  { key: "power", label: "Power Ranking" },
  { key: "record", label: "Record" },
  { key: "pct", label: "Winning Percentage" },
  { key: "pointsFor", label: "Points For" },
  { key: "value", label: "Roster Value", needsValue: true },
  { key: "age", label: "Average Age" },
  { key: "capital", label: "Draft Capital" },
  { key: "championships", label: "Championships" },
];

function metric(
  t: TeamCardData,
  key: SortKey,
): { value: number; label: string; unavailable?: boolean } {
  switch (key) {
    case "power":
      return { value: t.powerScore, label: `${t.powerScore.toFixed(1)} PWR` };
    case "value":
      if (!t.rosterValueAvailable) {
        return { value: -1, label: "n/a", unavailable: true };
      }
      return {
        value: t.rosterValue,
        label: `${t.rosterValue.toLocaleString()} KTC`,
      };
    case "age":
      return {
        value: t.avgAge ?? -1,
        label: t.avgAge != null ? `${t.avgAge.toFixed(1)} yrs avg` : "n/a",
        unavailable: t.avgAge == null,
      };
    case "capital":
      return { value: t.draftCapital, label: `${t.draftCapital} picks` };
    case "record":
      return { value: t.wins - t.losses * 0.01, label: record(t.wins, t.losses, t.ties) };
    case "pct":
      return { value: t.pct, label: fmtPct3(t.pct) };
    case "pointsFor":
      return { value: t.pointsFor, label: t.pointsFor.toFixed(1) };
    case "championships":
      return {
        value: t.championships,
        label: t.championships > 0 ? String(t.championships) : "0",
      };
  }
}

function AnimatedPower({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(value * eased * 10) / 10);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display.toFixed(1)}</>;
}

export interface TeamFranchiseCardProps {
  team: TeamCardData;
  index: number;
  edgeClass?: string;
  metricOverride?: { label: string; value: string };
  showViewCta?: boolean;
}

export function TeamFranchiseCard({
  team: t,
  index,
  edgeClass,
  metricOverride,
  showViewCta = true,
}: TeamFranchiseCardProps) {
  const accent = teamAccentColor(t.teamName);
  const isElite = index < 4;
  const href = `/teams/${t.rosterId}`;

  return (
    <Link
      href={href}
      className={[
        "team-franchise-card",
        isElite && "team-franchise-card--elite",
        edgeClass,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          animationDelay: `${index * 40}ms`,
          "--team-accent": accent,
        } as React.CSSProperties
      }
      aria-label={`Open ${t.teamName} franchise page`}
    >
      <span className="team-card-shimmer" aria-hidden="true" />
      <span className="team-card-rim-glow" aria-hidden="true" />
      {isElite && <span className="team-card-sparkle" aria-hidden="true" />}

      <div className="team-card-top">
        <span className="team-card-rank">#{t.rank}</span>
        <StatusBadge status={t.status} variant="teams" />
      </div>

      <div className="team-card-identity">
        <TeamAvatar
          src={t.avatar}
          name={t.teamName}
          size={64}
          className="team-card-avatar"
        />
        <div className="team-card-names">
          <span className="team-card-name" style={{ color: accent }}>
            {t.teamName}
          </span>
          <span className="team-card-manager">{t.managerName}</span>
          <span className="team-card-handle">@{t.managerName}</span>
        </div>
      </div>

      <div className="team-card-stats">
        <div className="team-card-record">
          <span className="team-stat-primary">
            {record(t.wins, t.losses, t.ties)}
          </span>
          <span className="team-stat-secondary">{fmtPct3(t.pct)} win%</span>
        </div>
        <div className="team-card-power">
          <span className="team-power-icon" aria-hidden="true">
            🏈
          </span>
          <span className="team-power-value">
            <AnimatedPower value={t.powerScore} />
          </span>
          <span className="team-power-label">PWR</span>
        </div>
      </div>

      {metricOverride && (
        <div className="team-card-metric-row">
          <span className="team-card-metric-label">{metricOverride.label}</span>
          <span className="team-card-metric-value">{metricOverride.value}</span>
        </div>
      )}

      {showViewCta && (
        <span className="team-card-cta">View Franchise →</span>
      )}
    </Link>
  );
}

export function TeamsGrid({
  teams,
  defaultSort = "power",
  ageSortAsc = false,
}: {
  teams: TeamCardData[];
  defaultSort?: SortKey;
  ageSortAsc?: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>(defaultSort);
  const hasValue = teams.some((t) => t.rosterValueAvailable);

  const sorted = useMemo(() => {
    const dir =
      sortKey === "age" ? (ageSortAsc ? 1 : -1) : sortKey === "capital" ? -1 : -1;
    return [...teams].sort((a, b) => {
      const ma = metric(a, sortKey);
      const mb = metric(b, sortKey);
      if (ma.unavailable && mb.unavailable) return 0;
      if (ma.unavailable) return 1;
      if (mb.unavailable) return -1;
      return dir * (ma.value - mb.value);
    });
  }, [teams, sortKey, ageSortAsc]);

  const visibleSorts = SORTS.filter(
    (s) => !s.needsValue || hasValue,
  );

  return (
    <div className="teams-grid-wrap">
      <div className="teams-sort-bar">
        <label htmlFor="teams-sort" className="teams-sort-label">
          Sort by
        </label>
        <div className="teams-sort-select-wrap">
          <select
            id="teams-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="teams-sort-select"
          >
            {visibleSorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="teams-card-grid teams-card-grid--animate">
        {sorted.map((t, index) => (
          <TeamFranchiseCard key={t.rosterId} team={t} index={index} />
        ))}
      </div>
    </div>
  );
}
