// Text for the quest hub (/challenge). Placeholder copy: tune freely.
export const content = {
  title: "Pick a quest",
  intro: "Real MBTA elevator, escalator and access problems. Pick one, tell us what you see, and earn tokens.",
  honestyNote:
    "T Party is not the MBTA. Finishing a quest here does not send anything to the MBTA. To report an issue officially, use the MBTA's own channels.",
  loading: "Loading quests...",
  opening: "Opening that quest...",

  errorTitle: "We could not load the quests",
  retry: "Try again",
  empty: "No quests match right now. Try another filter, or check back soon.",
  none: "There are no quests right now.",

  snapshotBanner: "MBTA could not be reached, so these are saved quests from {when}. They may be out of date.",

  balanceLabel: "tokens",
  balanceUnavailableNoDatabase: "Token balance unavailable: the database is not connected.",
  balanceUnavailable: "Token balance unavailable right now.",
  balanceLoading: "Loading your tokens...",

  filterLine: "Line",
  filterMode: "Type",
  all: "All",
  modeReport: "Report a problem",
  modeVerify: "Check a fix",
  modeReportBadge: "Report",
  modeVerifyBadge: "Check a fix",
  community: "Community mission · unofficial",
  done: "Done",
  notActive: "Not active right now",
  daysOpen: "open {n} days",
  dayOpen: "open 1 day",
  failures: "out {n} times in 90 days",
  tokens: "+{n} tokens",
};

export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
