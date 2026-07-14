import { Fragment } from "react";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { fmtPct3, fmtPoints, record } from "@/lib/format";
import type { StandingRow } from "@/lib/league";

function streakLabel(streak: number): string {
  if (streak === 0) return "—";
  return streak > 0 ? `W${streak}` : `L${Math.abs(streak)}`;
}

export function StandingsTable({
  standings,
  playoffCutoff,
}: {
  standings: StandingRow[];
  /** Draw a divider after this rank (e.g. top-6 playoff line). */
  playoffCutoff?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-offwhite/50">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Team</th>
            <th className="px-3 py-2 text-right font-medium">W-L</th>
            <th className="px-3 py-2 text-right font-medium">Pct</th>
            <th className="px-3 py-2 text-right font-medium">PF</th>
            <th className="px-3 py-2 text-right font-medium">PA</th>
            <th className="px-3 py-2 text-right font-medium">Streak</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((t) => (
            <Fragment key={t.rosterId}>
              <tr className="border-t border-white/5 transition-colors hover:bg-gold/[0.04]">
                <td className="px-3 py-2.5 font-display font-bold text-gold/80">
                  {t.rank}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <TeamAvatar src={t.avatar} name={t.teamName} size={28} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-offwhite">
                        {t.teamName}
                      </div>
                      <div className="truncate text-xs text-offwhite/40">
                        @{t.managerName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {record(t.wins, t.losses, t.ties)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-offwhite/70">
                  {fmtPct3(t.pct)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {fmtPoints(t.pointsFor)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-offwhite/60">
                  {fmtPoints(t.pointsAgainst)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span
                    className={
                      t.streak > 0
                        ? "text-emerald-400"
                        : t.streak < 0
                          ? "text-crimson-300"
                          : "text-offwhite/40"
                    }
                  >
                    {streakLabel(t.streak)}
                  </span>
                </td>
              </tr>
              {playoffCutoff === t.rank && (
                <tr aria-hidden>
                  <td colSpan={7} className="px-3 py-1">
                    <div className="flex items-center gap-2">
                      <div className="divider-gold flex-1" />
                      <span className="text-[10px] uppercase tracking-widest text-gold/60">
                        Playoff Line
                      </span>
                      <div className="divider-gold flex-1" />
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
