"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/format";
import type { NotableMomentRow, MomentCategory } from "@/lib/queries";
import { EmptyState } from "@/components/ui/Panel";

const CATEGORIES: Array<{ key: MomentCategory | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "championship", label: "Championship" },
  { key: "comeback", label: "Comeback" },
  { key: "blowout", label: "Blowout" },
  { key: "record", label: "Record" },
  { key: "trade", label: "Trade" },
];

const CATEGORY_COLOR: Record<MomentCategory, string> = {
  championship: "text-gold",
  comeback: "text-emerald-300",
  blowout: "text-crimson-300",
  record: "text-sky-300",
  trade: "text-purple-300",
};

export function NotableMomentsFeed({ moments }: { moments: NotableMomentRow[] }) {
  const [filter, setFilter] = useState<MomentCategory | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? moments : moments.filter((m) => m.category === filter)),
    [moments, filter],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === c.key
                ? "border-gold bg-gold/15 text-gold"
                : "border-white/10 text-offwhite/60 hover:border-gold/40 hover:text-offwhite",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No moments yet"
          message="Notable moments are added to the notable_moments table as the league makes history."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((m) => (
            <li key={m.id} className="panel p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-display font-semibold text-offwhite">
                  {m.title}
                </h4>
                {m.category && (
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-semibold uppercase tracking-wide",
                      CATEGORY_COLOR[m.category],
                    )}
                  >
                    {m.category}
                  </span>
                )}
              </div>
              {(m.season_year || m.week) && (
                <div className="mt-0.5 text-xs text-offwhite/40">
                  {m.season_year ?? ""}
                  {m.week ? ` · Week ${m.week}` : ""}
                </div>
              )}
              {m.description && (
                <p className="mt-2 text-sm text-offwhite/70">{m.description}</p>
              )}
              {m.stat_highlight && (
                <p className="mt-2 inline-block rounded bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                  {m.stat_highlight}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
