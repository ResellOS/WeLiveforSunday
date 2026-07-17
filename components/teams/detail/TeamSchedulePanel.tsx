"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import { fmtPoints } from "@/lib/format";
import type { ScheduleEntry } from "@/lib/teams/schedule";

const RESULT_CLASS: Record<ScheduleEntry["result"], string> = {
  win: "sched-win",
  loss: "sched-loss",
  tie: "sched-tie",
  upcoming: "sched-upcoming",
  live: "sched-live",
  bye: "sched-bye",
};

const RESULT_LABEL: Record<ScheduleEntry["result"], string> = {
  win: "W",
  loss: "L",
  tie: "T",
  upcoming: "Upcoming",
  live: "Live",
  bye: "Bye",
};

export function TeamSchedulePanel({
  schedule,
}: {
  schedule: ScheduleEntry[];
}) {
  return (
    <Panel className="p-4 team-detail-panel">
      <h2 className="team-detail-panel-title">Schedule</h2>
      <div className="team-schedule-list">
        {schedule.map((s) => (
          <div
            key={s.week}
            className={`team-schedule-row ${RESULT_CLASS[s.result]}`}
          >
            <span className="team-schedule-week">Wk {s.week}</span>
            {s.opponentRosterId ? (
              <Link
                href={`/teams/${s.opponentRosterId}`}
                className="team-schedule-opponent"
              >
                <TeamAvatar
                  src={s.opponentAvatar}
                  name={s.opponentName}
                  size={28}
                />
                <span>{s.opponentName}</span>
              </Link>
            ) : (
              <span className="team-schedule-opponent">{s.opponentName}</span>
            )}
            <span className="team-schedule-score">
              {s.teamScore != null && s.opponentScore != null
                ? `${fmtPoints(s.teamScore)} – ${fmtPoints(s.opponentScore)}`
                : "—"}
            </span>
            <span
              className={`team-schedule-result ${RESULT_CLASS[s.result]}`}
            >
              {RESULT_LABEL[s.result]}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
