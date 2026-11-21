// SAMPLE quests so the submit flow can be tested before live MBTA data is wired in.
// The Quest shape mirrors `Quest` in src/lib/mbta.ts (teammate's PR). When that lands,
// import the real type and fetch /api/quests instead of using this list.
export type Quest = {
  id: string;
  kind: "elevator" | "escalator" | "access";
  facilityName: string;
  stationName: string;
  lines: string[];
  header: string;
  /** Always a Tada mission, never an official MBTA request for comment. */
  type: "community_mission";
  sourceUrl: string;
  rewardTokens: number;
  /** True for made-up test data. The UI labels it. */
  isSample: boolean;
};

export const sampleQuests: Quest[] = [
  {
    id: "sample-park-street-elevator",
    kind: "elevator",
    facilityName: "Park Street elevator (sample)",
    stationName: "Park Street",
    lines: ["Red", "Green"],
    header: "Sample outage for testing: an elevator between the street and the platforms is out of service.",
    type: "community_mission",
    sourceUrl: "https://www.mbta.com/alerts",
    rewardTokens: 25,
    isSample: true,
  },
  {
    id: "sample-maverick-escalator",
    kind: "escalator",
    facilityName: "Maverick escalator (sample)",
    stationName: "Maverick",
    lines: ["Blue"],
    header: "Sample outage for testing: an escalator from the lobby to the platform is out of service.",
    type: "community_mission",
    sourceUrl: "https://www.mbta.com/alerts",
    rewardTokens: 25,
    isSample: true,
  },
  {
    id: "sample-back-bay-access",
    kind: "access",
    facilityName: "Back Bay accessible entrance (sample)",
    stationName: "Back Bay",
    lines: ["Orange"],
    header: "Sample issue for testing: an accessible route into the station is blocked.",
    type: "community_mission",
    sourceUrl: "https://www.mbta.com/alerts",
    rewardTokens: 25,
    isSample: true,
  },
];

export function findQuest(id: string | null) {
  return sampleQuests.find((q) => q.id === id) ?? null;
}
