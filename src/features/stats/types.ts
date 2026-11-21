// The shape returned by GET /api/stats (teammate's route, src/app/api/stats/route.ts).
// If that route changes, change this file and nothing else.

export type OutageKind = "elevator" | "escalator" | "access";

export type StatsResponse = {
  generatedAt: string;
  outages: {
    openNow: {
      total: number;
      byKind: Partial<Record<OutageKind, number>>;
      longestOpen: { questId: string; stationName: string; header: string; kind: string; daysOpen: number }[];
    };
    /** How long MBTA took to close outages that ended in the last `windowDays` days. */
    timeToFix: {
      windowDays: number;
      byKind: { kind: string; resolved: number; medianHours: number | null; p90Hours: number | null }[];
      byMonth: { month: string; resolved: number; medianHours: number | null }[];
    };
    /** Units that broke 3 or more times in the window. */
    repeatOffenders: { facilityId: string; stationName: string; kind: string; outages: number }[];
    busiestStations: { stationName: string; outages: number }[];
  };
  riders: {
    riders: number;
    submissions: number;
    completed: number;
    /** Share of open outages with at least one rider report. null when there are no open outages. */
    coveragePercent: number | null;
    /** Share of completed reports revised at least once after the AI check. */
    improvedByAiPercent: number | null;
    /** Share of completed reports where the rider opened MBTA's form. Not proof of submission. */
    handoffPercent: number | null;
    /** Outages MBTA resolved after a rider reported them here. Timing only, never a cause. */
    resolvedAfterReport: number;
  };
  dataNotes: {
    totalOutagesOnRecord: number;
    archiveStartsAt: string | null;
    liveSyncs: number;
    sources: string[];
  };
};
