"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TeamAvatar } from "@/components/ui/TeamAvatar";
import type { LeagueActivityItem, LeagueActivityPayload } from "@/lib/leagueActivity";

const POLL_MS = 45_000;
const NEAR_BOTTOM_PX = 48;

function ActivityIcon({ type }: { type: LeagueActivityItem["type"] }) {
  const cls = `activity-icon activity-icon-${type}`;
  switch (type) {
    case "trade":
      return (
        <span className={cls} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3.5 7.5h11.5" strokeWidth="2" />
            <path d="m13.2 4.2 3.3 3.3-3.3 3.3" strokeWidth="2" />
            <path d="M20.5 16.5H9" strokeWidth="2" />
            <path d="m10.8 13.2-3.3 3.3 3.3 3.3" strokeWidth="2" />
          </svg>
        </span>
      );
    case "waiver":
    case "free_agent":
      return (
        <span className={cls} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" strokeWidth="2.2" />
          </svg>
        </span>
      );
    case "drop":
      return (
        <span className={cls} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14" strokeWidth="2.2" />
          </svg>
        </span>
      );
    case "commissioner":
      return (
        <span className={cls} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3 14.5 8.5 20.5 9.3 16 13.4 17.2 19.5 12 16.8 6.8 19.5 8 13.4 3.5 9.3 9.5 8.5 12 3Z" />
          </svg>
        </span>
      );
    default:
      return (
        <span className={cls} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
          </svg>
        </span>
      );
  }
}

function msgClass(type: LeagueActivityItem["type"]): string {
  return `activity-item activity-item-${type}`;
}

export function LeagueChat({
  initial,
}: {
  initial: LeagueActivityPayload;
}) {
  const [items, setItems] = useState<LeagueActivityItem[]>(initial.items);
  const [live, setLive] = useState(initial.live);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const trackScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;
    wasNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/league-activity", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as LeagueActivityPayload;
      const prevIds = new Set(itemsRef.current.map((m) => m.id));
      const fresh = new Set<string>();
      for (const item of data.items) {
        if (!prevIds.has(item.id)) fresh.add(item.id);
      }
      setItems(data.items);
      setLive(data.live);
      setError(null);
      if (fresh.size > 0) {
        setNewIds(fresh);
        setTimeout(() => setNewIds(new Set()), 1200);
      }
      if (wasNearBottomRef.current && feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
    } catch {
      setLive(false);
      setError("Unable to refresh activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="league-chat">
      <div className="league-chat-header">
        <span className="league-chat-title">League Activity</span>
        {live && (
          <span className="live-badge" aria-label="Live">
            <span className="live-badge-dot" />
            LIVE
          </span>
        )}
        {loading && (
          <span className="league-chat-status">Updating…</span>
        )}
      </div>

      <div
        ref={feedRef}
        className="league-chat-feed"
        onScroll={trackScroll}
      >
        {error && items.length === 0 && (
          <p className="league-activity-empty">{error}</p>
        )}
        {items.length === 0 && !error && (
          <p className="league-activity-empty">
            {initial.emptyMessage ??
              "No trades or roster moves recorded yet this season."}
          </p>
        )}
        {items.map((msg, idx) => (
          <div
            key={msg.id}
            className={[
              msgClass(msg.type),
              newIds.has(msg.id) && "activity-item-new",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <TeamAvatar src={msg.avatar} name={msg.author} size={30} />
            <ActivityIcon type={msg.type} />
            <div className="activity-msg-body min-w-0">
              <div className="activity-msg-meta">
                <span className="activity-msg-author">{msg.author}</span>
                <span className="activity-msg-time">{msg.time}</span>
              </div>
              <p className="activity-msg-text">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
