"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";
import {
  TEAMS_NAV,
  parseTeamsView,
  teamsViewHref,
} from "@/lib/teams/views";

export function TeamsSidebar() {
  const searchParams = useSearchParams();
  const view = parseTeamsView(searchParams.get("view") ?? undefined);

  return (
    <>
      <Panel className="panel--directory p-3">
        <h2 className="trophy-panel-title trophy-panel-title-sm">
          Browse Teams
        </h2>
        <nav className="trophy-directory" aria-label="Team directory">
          {TEAMS_NAV.map((item) => {
            const active = item.view === view;
            return (
              <Link
                key={item.view}
                href={teamsViewHref(item.view)}
                className={
                  active ? "trophy-cat trophy-cat-active" : "trophy-cat"
                }
                aria-current={active ? "true" : undefined}
              >
                <TrophyGlyph name={item.glyph} className="trophy-cat-glyph" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </Panel>

      <Panel className="panel--rewards p-0 teams-sidebar-filler-panel">
        <div className="teams-sidebar-filler">
          <Image
            src="/images/teams-sidebar-filler.png"
            alt="We Live for Sundays league rewards — championship ring, licensed NFL jersey, and $600+ champion payout"
            width={400}
            height={520}
            className="teams-sidebar-filler-img"
            priority
          />
        </div>
      </Panel>
    </>
  );
}
