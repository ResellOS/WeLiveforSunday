"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import type { TradePlayerOption } from "@/lib/trades/tradeTreeTypes";

interface TradeTreeToolbarProps {
  players: TradePlayerOption[];
  seasons: number[];
  selectedPlayerId: string | null;
  selectedSeason: number;
  onSelectPlayer: (playerId: string) => void;
  onSelectSeason: (season: number) => void;
  disabled?: boolean;
}

const DEBOUNCE_MS = 220;

export function TradeTreeToolbar({
  players,
  seasons,
  selectedPlayerId,
  selectedSeason,
  onSelectPlayer,
  onSelectSeason,
  disabled,
}: TradeTreeToolbarProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  const selected = useMemo(
    () => players.find((p) => p.playerId === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );

  const results = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return players.slice(0, 10);
    return players
      .filter((p) => {
        const hay =
          `${p.fullName} ${p.position ?? ""} ${p.nflTeam ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12);
  }, [players, debounced]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = useCallback(
    (playerId: string) => {
      onSelectPlayer(playerId);
      const p = players.find((x) => x.playerId === playerId);
      setQuery(p?.fullName ?? "");
      setOpen(false);
    },
    [onSelectPlayer, players],
  );

  useEffect(() => {
    if (selected) setQuery(selected.fullName);
    else setQuery("");
  }, [selectedPlayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tt-toolbar">
      <div className="tt-search" ref={wrapRef}>
        <label className="tt-search-label" htmlFor={`${listId}-input`}>
          Select Asset
        </label>
        <div className="tt-search-shell search-shell">
          <svg
            className="search-glyph"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.2" />
            <path d="m15.4 15.4 5.1 5.1" />
          </svg>
          <input
            ref={inputRef}
            id={`${listId}-input`}
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${listId}-list`}
            aria-autocomplete="list"
            aria-activedescendant={
              open && results[activeIndex]
                ? `${listId}-opt-${results[activeIndex].playerId}`
                : undefined
            }
            className="search-field tt-search-field"
            placeholder="Search players…"
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
                setOpen(true);
                return;
              }
              if (e.key === "Escape") {
                setOpen(false);
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && results[activeIndex]) {
                e.preventDefault();
                choose(results[activeIndex].playerId);
              }
            }}
          />
        </div>

        {open && results.length > 0 ? (
          <ul
            id={`${listId}-list`}
            className="tt-search-results"
            role="listbox"
          >
            {results.map((p, idx) => (
              <li key={p.playerId} role="presentation">
                <button
                  type="button"
                  id={`${listId}-opt-${p.playerId}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={[
                    "tt-search-option",
                    idx === activeIndex && "is-active",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => choose(p.playerId)}
                >
                  <Image
                    src={p.imageUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="tt-search-thumb"
                    unoptimized
                  />
                  <span className="tt-search-copy">
                    <span className="tt-search-name">{p.fullName}</span>
                    <span className="tt-search-meta">
                      {[p.position, p.nflTeam].filter(Boolean).join(" · ")}
                      {p.ownerName ? ` · ${p.ownerName}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <label className="season-plate tt-season">
        <span className="sr-only">Select season</span>
        <select
          value={String(selectedSeason)}
          disabled={disabled}
          onChange={(e) => onSelectSeason(Number(e.target.value))}
        >
          {seasons.map((yr) => (
            <option key={yr} value={yr}>
              Season {yr}
            </option>
          ))}
        </select>
        <span className="season-since" aria-hidden="true">
          Start year
        </span>
      </label>
    </div>
  );
}
