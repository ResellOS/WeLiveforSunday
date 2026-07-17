import { ExhibitArtPanel } from "@/components/trophy-room/ExhibitArtPanel";

export function DynastyMoments() {
  return (
    <ExhibitArtPanel
      src="/images/trophy-dynasty-moments.png"
      alt="WLFS Dynasty Moments — 2026, the beginning"
      width={1327}
      height={1186}
      className="tr-dynasty-moments-exhibit tr-panel-enter tr-panel-enter-delay-2"
      sizes="(min-width: 1024px) 35vw, 92vw"
      animated
    />
  );
}
