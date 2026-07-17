import { ExhibitArtPanel } from "@/components/trophy-room/ExhibitArtPanel";

export function CareerEarningsExhibit() {
  return (
    <ExhibitArtPanel
      src="/images/trophy-career-earnings.png"
      alt="WLFS Career Earnings — top managers in league history"
      width={1211}
      height={1299}
      className="tr-career-earnings-exhibit tr-panel-enter tr-panel-enter-delay-1"
      sizes="(min-width: 1024px) 16vw, 92vw"
    />
  );
}
