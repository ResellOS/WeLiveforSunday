"use client";

import { useMemo, useState } from "react";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtPct3, record } from "@/lib/format";
import type { ContenderStatus } from "@/lib/league";

export interface TeamCardData {
  rosterId: number;
  rank: number;
  teamName: string;
  managerName: string;
  avatar: string | null;
  wins: number;
  losses: number;
  ties: number;
  pct: number;
  status: ContenderStatus;
  powerScore: number;
  rosterValue: number;
  avgAge: number | null;
  draftCapital: number;
}

type SortKey = "power" | "value" | "age" | "capital" | "record";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "power", label: "Power Ranking" },
  { key: "value", label: "Roster Value (KTC)" },
  { key: "age", label: "Team Age (avg)" },
  { key: "capital", label: "Draft Capital" },
  { key: "record", label: "Record" },
];

function metric(t: TeamCardData, key: SortKey): { value: number; label: string } {
  switch (key) {
    case "power":
      return { value: t.powerScore, label: `${t.powerScore.toFixed(1)} PWR` };
    case "value":
      return { value: t.rosterValue, label: `${t.rosterValue.toLocaleString()} KTC` };
    case "age":
      return {
        value: t.avgAge ?? -1,
        label: t.avgAge != null ? `${t.avgAge.toFixed(1)} yrs avg` : "age n/a",
      };
    case "capital":
      return { value: t.draftCapital, label: `${t.draftCapital} picks` };
    case "record":
      return { value: t.pct, label: fmtPct3(t.pct) };
  }
}

export function TeamsGrid({ teams }: { teams: TeamCardData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("power");

  const sorted = useMemo(() => {
    // Age sorts ascending (youngest first); everything else descending.
    const dir = sortKey === "age" ? 1 : -1;
    return [...teams].sort((a, b) => dir * (metric(a, sortKey).value - metric(b, sortKey).value));
  }, [teams, sortKey]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <label className="text-xs uppercase tracking-wider text-offwhite/50">
          Sort by
        </label>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="cursor-pointer rounded-md border border-gold/30 bg-background px-3 py-1.5 text-sm text-offwhite outline-none transition-colors hover:border-gold focus:border-gold focus:ring-1 focus:ring-gold"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key} className="bg-background">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map((t) => {
          const m = metric(t, sortKey);
          return (
            <div key={t.rosterId} className="panel panel-hover p-4">
              <div className="flex items-start justify-between">
                <span className="font-display text-2xl font-bold text-gold/70">
                  #{t.rank}
                </span>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <TeamAvatar src={t.avatar} name={t.teamName} size={44} />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-offwhite">
                    {t.teamName}
                  </div>
                  <div className="truncate text-xs text-offwhite/40">
                    @{t.managerName}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-sm">
                <div>
                  <div className="font-display font-bold text-offwhite">
                    {record(t.wins, t.losses, t.ties)}
                  </div>
                  <div className="text-[11px] text-offwhite/40">
                    {fmtPct3(t.pct)} win%
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-gold">
                    {m.label}
                  </div>
                  <div className="text-[11px] text-offwhite/40">
                    {SORTS.find((s) => s.key === sortKey)?.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
