import type { Metadata } from "next";

export const metadata: Metadata = { title: "Record Book" };

export default function RecordBookPage() {
  return (
    <section className="py-8">
      <h1 className="font-display text-3xl font-bold text-gold-metallic">
        Record Book
      </h1>
      <p className="mt-4 text-offwhite/70">
        All-time highs, lows, streaks, and the records that define WLFS.
      </p>
    </section>
  );
}
