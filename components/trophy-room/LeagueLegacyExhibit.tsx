import { ExhibitArtPanel } from "@/components/trophy-room/ExhibitArtPanel";

export function LeagueLegacyExhibit() {
  return (
    <ExhibitArtPanel
      src="/images/trophy-league-legacy.png"
      alt="WLFS League Legacy — established 2026, founding franchises, playoffs, and champions"
      width={1098}
      height={1432}
      className="tr-league-legacy-exhibit tr-panel-enter tr-panel-enter-delay-2"
      sizes="(min-width: 1024px) 16vw, 92vw"
    />
  );
}
