import type { Metadata } from "next";

export const metadata: Metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <section className="py-8">
      <h1 className="font-display text-3xl font-bold text-gold-metallic">
        Teams
      </h1>
      <p className="mt-4 text-offwhite/70">
        League rosters, owners, and franchise pages will live here.
      </p>
    </section>
  );
}
