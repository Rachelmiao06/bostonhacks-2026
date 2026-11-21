// Text for the stats page. Placeholder copy: tune freely.
export const content = {
  title: "The T, in numbers",
  intro:
    "How long MBTA elevators and escalators stay broken, where it keeps happening, and what T Party riders are doing about it.",
  loading: "Loading the numbers...",

  liveBadge: "Live data",
  sampleBadge: "Sample data",
  sampleNoApi: "The stats service is not part of this build yet, so these are invented sample numbers.",
  sampleNoDatabase: "The database is not connected, so these are invented sample numbers.",
  sampleWarning: "Do not read these as real MBTA figures.",
  errorTitle: "We could not load the stats",
  retry: "Try again",
  updated: "Updated",

  openTitle: "Broken right now",
  openUnit: "outages open",
  longestTitle: "Open the longest",
  daysOpen: "days open",

  fixTitle: "How long fixes take",
  fixIntro: "For outages that ended in the last {days} days. The median is the typical outage: half were fixed faster than that.",
  median: "Typical (median)",
  slowest: "9 in 10 fixed within",
  byMonthTitle: "Typical time to fix, by month",
  excludedNote: "{n} closed outages are left out of these numbers because MBTA's end time for them was not exact.",

  openDaysTitle: "Open outages, day by day",
  openDaysIntro: "How many outages were open at the end of each of the last {days} days.",
  openDaysSummary: "{latest} open on the latest day. The most was {peak}, on {peakDay}.",

  repeatTitle: "Keeps breaking",
  repeatIntro: "Units that broke 3 or more times in the last {days} days.",
  repeatUnit: "outages",
  busiestTitle: "Busiest stations",
  busiestIntro: "Stations with the most outages in the last {days} days.",
  none: "Nothing to show for this period.",

  ridersTitle: "What riders are doing",
  riders: "Riders",
  completed: "Completed reports",
  coverage: "Open outages with a rider report",
  improved: "Reports improved after the AI check",
  handoff: "Opened the official MBTA form",
  resolvedAfter: "Outages resolved after a rider report",
  verifications: "Fix checks by riders",
  confirmedWorking: "Fix checks that said it works",
  disputedFixes: "Outages a rider says are still broken",

  notesTitle: "About these numbers",
  correlationNote:
    "\"Resolved after a report\" shows timing only. MBTA may have fixed these anyway, and T Party does not claim credit.",
  handoffNote:
    "Opening the official MBTA form is not proof that a report was sent. T Party cannot see what happens on mbta.com.",
  verifyNote:
    "A fix check or a \"still broken\" is one rider's own report. T Party cannot verify it, and it does not overrule MBTA.",
  aiNote: "\"Improved\" means a rider revised their report at least once after the AI check. The AI does not verify facts.",
  sourcesLabel: "Sources",
  onRecord: "outages on record",
  since: "history starts",
  syncs: "live syncs so far",
};

export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
