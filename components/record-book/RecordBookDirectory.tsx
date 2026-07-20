"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { TrophyGlyph, type TrophyGlyphKey } from "@/components/trophy/TrophyGlyph";
import {
  RECORD_CATEGORIES,
  recordCategoryHref,
} from "@/lib/record-book/navigation";

export function RecordBookDirectory() {
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const sync = () => setActiveHash(window.location.hash.replace("#", ""));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const activeKey =
    RECORD_CATEGORIES.find(
      (item) => recordCategoryHref(item.key).slice(1) === activeHash,
    )?.key ?? "overview";

  return (
    <Panel className="panel--directory p-3">
      <h2 className="trophy-panel-title trophy-panel-title-sm">Browse Records</h2>
      <nav className="trophy-directory" aria-label="Record categories">
        {RECORD_CATEGORIES.map((item) => {
          const href = recordCategoryHref(item.key);
          const isActive = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={href}
              className={isActive ? "trophy-cat trophy-cat-active" : "trophy-cat"}
              aria-current={isActive ? "true" : undefined}
            >
              <TrophyGlyph name={item.key as TrophyGlyphKey} className="trophy-cat-glyph" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </Panel>
  );
}
