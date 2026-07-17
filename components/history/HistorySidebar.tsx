"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph } from "@/components/trophy/TrophyGlyph";
import {
  HISTORY_NAV,
  parseHistoryView,
  historyViewHref,
} from "@/lib/history/views";

export function HistorySidebar() {
  const searchParams = useSearchParams();
  const view = parseHistoryView(searchParams.get("view") ?? undefined);

  return (
    <>
      <Panel className="panel--directory p-3">
        <h2 className="trophy-panel-title trophy-panel-title-sm">
          Browse History
        </h2>
        <nav className="trophy-directory" aria-label="History categories">
          {HISTORY_NAV.map((item) => {
            const active = item.view === view;
            return (
              <Link
                key={item.view}
                href={historyViewHref(item.view)}
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

      <Panel className="panel--rewards p-0 history-foundation-panel">
        <div className="history-foundation-art">
          <Image
            src="/images/history-sidebar-filler.png"
            alt="WLFS league foundation — dynasty charter, founding franchises, and championship legacy"
            width={400}
            height={520}
            className="history-foundation-img"
            priority
          />
          <span className="history-foundation-glow" aria-hidden="true" />
        </div>
      </Panel>
    </>
  );
}
