"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PLACEHOLDERS: Array<[prefix: string, text: string]> = [
  ["/trophy-room", "Search the trophy room…"],
  ["/teams", "Search teams…"],
  ["/trades", "Search trades…"],
  ["/history", "Search league history…"],
  ["/record-book", "Search the record book…"],
];

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const placeholder =
    PLACEHOLDERS.find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    "Search the league…";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="search-shell">
      <span className="sr-only">Search</span>
      <svg className="search-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.2" />
        <path d="m15.4 15.4 5.1 5.1" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="search-field"
      />
    </form>
  );
}
