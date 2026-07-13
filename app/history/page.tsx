import type { Metadata } from "next";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <section className="py-8">
      <h1 className="font-display text-3xl font-bold text-gold-metallic">
        History
      </h1>
      <p className="mt-4 text-offwhite/70">
        Season-by-season standings, matchups, and the story of the league.
      </p>
    </section>
  );
}
