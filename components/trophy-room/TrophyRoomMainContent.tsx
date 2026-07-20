import { ChampionshipHistory } from "@/components/trophy-room/ChampionshipHistory";
import { JerseyWall } from "@/components/trophy-room/JerseyWall";
import { TrophyRoomEmptyView } from "@/components/trophy-room/TrophyRoomEmptyView";
import type { TrophyView } from "@/lib/trophy-room/views";
import type { JerseyRow } from "@/lib/queries";

export function TrophyRoomMainContent({
  view,
  championByYear = {},
  jerseyByYear,
  teamNames = {},
}: {
  view: TrophyView;
  championByYear?: Record<number, { champion_roster_id: number | null }>;
  jerseyByYear: Record<number, JerseyRow>;
  teamNames?: Record<number, string>;
}) {
  const jerseyMap = new Map(Object.entries(jerseyByYear).map(([k, v]) => [Number(k), v]));

  if (view === "championship") {
    return (
      <>
        <ChampionshipHistory
          championByYear={championByYear}
          teamNames={teamNames}
        />
        <JerseyWall jerseyByYear={jerseyMap} />
      </>
    );
  }

  return <TrophyRoomEmptyView view={view} />;
}
