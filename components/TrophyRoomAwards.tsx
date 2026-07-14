"use client";

import { useState } from "react";
import { cn } from "@/lib/format";
import { EmptyState } from "@/components/ui/Panel";

export interface Award {
  key: string;
  label: string;
  winner: string | null;
  detail: string | null;
  season: string | null;
  /** Cut awards are shown disabled in the filter and hidden from the grid. */
  cut: boolean;
}

export function TrophyRoomAwards({ awards }: { awards: Award[] }) {
  const active = awards.filter((a) => !a.cut);
  const [selected, setSelected] = useState<string>("all");

  const shown =
    selected === "all" ? active : active.filter((a) => a.key === selected);

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {/* Filter sidebar */}
      <nav className="md:col-span-1">
        <div className="panel p-2">
          <button
            onClick={() => setSelected("all")}
            className={cn(
              "block w-full rounded px-3 py-1.5 text-left text-sm transition-colors",
              selected === "all"
                ? "bg-gold/15 font-semibold text-gold"
                : "text-offwhite/70 hover:bg-white/5",
            )}
          >
            All Awards
          </button>
          {awards.map((a) => (
            <button
              key={a.key}
              disabled={a.cut}
              onClick={() => !a.cut && setSelected(a.key)}
              className={cn(
                "block w-full rounded px-3 py-1.5 text-left text-sm transition-colors",
                a.cut && "cursor-not-allowed text-offwhite/25",
                !a.cut && selected === a.key
                  ? "bg-gold/15 font-semibold text-gold"
                  : !a.cut && "text-offwhite/70 hover:bg-white/5",
              )}
            >
              {a.label}
              {a.cut && (
                <span className="ml-1 text-[10px] uppercase tracking-wide">
                  (cut)
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Award cards */}
      <div className="md:col-span-3">
        {shown.some((a) => a.winner) ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {shown.map((a) => (
              <div key={a.key} className="panel panel-hover p-4">
                <div className="text-xs uppercase tracking-wider text-gold/70">
                  {a.label}
                </div>
                <div className="mt-2 font-display text-lg font-bold text-gold-metallic">
                  {a.winner ?? "—"}
                </div>
                {a.detail && (
                  <div className="mt-1 text-sm text-offwhite/60">{a.detail}</div>
                )}
                {a.season && (
                  <div className="mt-1 text-xs text-offwhite/40">{a.season}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Awards pending"
            message="These honors are computed from Sleeper history and league records — they populate once the season is underway."
          />
        )}
      </div>
    </div>
  );
}
