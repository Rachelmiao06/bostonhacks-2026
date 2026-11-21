import type { StatsResponse } from "./types";

// SAMPLE numbers so the page can be built and shown before the database is connected.
// They are invented round figures and must never be presented as real MBTA data.
// The page labels them "Sample data" whenever they are used.
export const sampleStats: StatsResponse = {
  generatedAt: "2026-11-21T12:00:00.000Z",
  outages: {
    openNow: {
      total: 40,
      byKind: { elevator: 18, escalator: 20, access: 2 },
      longestOpen: [
        { questId: "sample-1", stationName: "Sample Station A", header: "Sample outage: escalator out of service.", kind: "escalator", daysOpen: 120 },
        { questId: "sample-2", stationName: "Sample Station B", header: "Sample outage: elevator out of service.", kind: "elevator", daysOpen: 90 },
        { questId: "sample-3", stationName: "Sample Station C", header: "Sample outage: elevator out of service.", kind: "elevator", daysOpen: 45 },
      ],
    },
    timeToFix: {
      windowDays: 90,
      byKind: [
        { kind: "elevator", resolved: 100, medianHours: 24, p90Hours: 240, },
        { kind: "escalator", resolved: 140, medianHours: 36, p90Hours: 480 },
        { kind: "access", resolved: 10, medianHours: 12, p90Hours: 72 },
      ],
      byMonth: [
        { month: "2026-06", resolved: 80, medianHours: 20 },
        { month: "2026-07", resolved: 90, medianHours: 28 },
        { month: "2026-08", resolved: 85, medianHours: 24 },
        { month: "2026-09", resolved: 95, medianHours: 36 },
        { month: "2026-10", resolved: 100, medianHours: 30 },
        { month: "2026-11", resolved: 40, medianHours: 26 },
      ],
    },
    repeatOffenders: [
      { facilityId: "sample-f1", stationName: "Sample Station A", kind: "escalator", outages: 6 },
      { facilityId: "sample-f2", stationName: "Sample Station D", kind: "elevator", outages: 4 },
      { facilityId: "sample-f3", stationName: "Sample Station B", kind: "elevator", outages: 3 },
    ],
    busiestStations: [
      { stationName: "Sample Station A", outages: 12 },
      { stationName: "Sample Station B", outages: 9 },
      { stationName: "Sample Station D", outages: 7 },
      { stationName: "Sample Station C", outages: 5 },
    ],
  },
  riders: {
    riders: 20,
    submissions: 30,
    completed: 20,
    coveragePercent: 25,
    improvedByAiPercent: 60,
    handoffPercent: 40,
    resolvedAfterReport: 3,
  },
  dataNotes: {
    totalOutagesOnRecord: 1000,
    archiveStartsAt: "2019-01-01T00:00:00.000Z",
    liveSyncs: 50,
    sources: ["Sample data only"],
  },
};
