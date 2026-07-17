import { ExhibitArtPanel } from "@/components/trophy-room/ExhibitArtPanel";

export function DynastyMilestones() {
  return (
    <ExhibitArtPanel
      src="/images/trophy-first-champion-awaits.png"
      alt="The First Champion Awaits — dynasty milestones, championship rewards, game, and moment"
      width={1122}
      height={1402}
      className="tr-dynasty-milestones-exhibit tr-panel-enter tr-panel-enter-delay-1"
      sizes="(min-width: 1024px) 35vw, 92vw"
      priority
      animated
    />
  );
}
