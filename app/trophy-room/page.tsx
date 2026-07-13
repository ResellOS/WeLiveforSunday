import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trophy Room" };

export default function TrophyRoomPage() {
  return (
    <section className="py-8">
      <h1 className="font-display text-3xl font-bold text-gold-metallic">
        Trophy Room
      </h1>
      <p className="mt-4 text-offwhite/70">
        Champions, runners-up, and every piece of hardware ever hoisted.
      </p>
    </section>
  );
}
