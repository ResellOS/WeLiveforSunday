"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";
import {
  TROPHY_NAV,
  parseTrophyView,
  trophyViewHref,
} from "@/lib/trophy-room/views";

export function TrophyRoomSidebar() {
  const searchParams = useSearchParams();
  const view = parseTrophyView(searchParams.get("view") ?? undefined);

  return (
    <>
      <Panel className="panel--directory p-3 tr-panel-enter">
        <nav className="trophy-directory" aria-label="Trophy categories">
          {TROPHY_NAV.map((item) => {
            const active = item.view === view;
            return (
              <Link
                key={item.view}
                href={trophyViewHref(item.view)}
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
    </>
  );
}
