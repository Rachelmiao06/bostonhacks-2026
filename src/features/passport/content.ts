// The passport is read with pictures. These words exist only for screen readers, tooltips and the demo notes.
export const content = {
  title: "Passport",
  tokens: (n: number) => `${n} ${n === 1 ? "token" : "tokens"}`,
  progress: (have: number, total: number) => `${have} of ${total} landmarks collected`,
  locked: "Not collected yet",
  nextOnMap: "Find a problem on the map",
  draft: (station: string) => (station ? `Finish your draft at ${station}` : "Finish your draft"),
  stamp: (kind: string, station: string) => (station ? `${kind} at ${station}` : kind),
  extra: (n: number) => `${n} more ${n === 1 ? "stamp" : "stamps"} beyond the album`,
  island: "See your island",
  loading: "Opening your passport",
  /** Shown to screen readers when the database is not reachable. The page still draws an empty album. */
  offline: "Your progress could not load right now.",
};
