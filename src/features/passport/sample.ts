import type { MyProgress, MySubmission, MyVerification } from "@/features/explore/progress";

/** Made-up progress for the demo (`/passport?demo=full`). Never sent anywhere and never mixed with real data. */
export type DemoLevel = "empty" | "some" | "full";

const report = (n: number, kind: string, station: string, day: number, status: "completed" | "draft" = "completed"): MySubmission => ({
  id: `demo-${n}`,
  alert_id: `demo-alert-${n}`,
  text: "",
  has_photo: false,
  ai_status: status === "completed" ? "reviewed" : "not_checked",
  ai_feedback: null,
  status,
  handed_off: false,
  updated_at: `2026-11-${String(day).padStart(2, "0")}T12:00:00Z`,
  completed_at: status === "completed" ? `2026-11-${String(day).padStart(2, "0")}T12:00:00Z` : null,
  station_name: station,
  header: "",
  kind,
});

const check = (n: number, station: string, day: number): MyVerification => ({
  alert_id: `demo-check-${n}`,
  verdict: "working",
  created_at: `2026-11-${String(day).padStart(2, "0")}T15:00:00Z`,
  station_name: station,
  header: "",
});

const all = {
  reports: [
    report(1, "elevator", "Park Street", 18),
    report(2, "escalator", "Downtown Crossing", 18),
    report(3, "shuttle", "Kenmore", 19),
    report(4, "closure", "Aquarium", 20),
    report(5, "station", "State", 21),
  ],
  draft: report(6, "elevator", "Haymarket", 21, "draft"),
  checks: [check(1, "Back Bay", 19), check(2, "Government Center", 20)],
};

export function demoProgress(level: DemoLevel): MyProgress {
  const reports = level === "empty" ? [] : level === "some" ? all.reports.slice(0, 2) : all.reports;
  const checks = level === "full" ? all.checks : [];
  const submissions = level === "empty" ? [] : [...reports, all.draft];
  return {
    submissions,
    verifications: checks,
    completedQuestIds: reports.map((r) => r.alert_id),
    verifiedQuestIds: checks.map((c) => c.alert_id),
    tokenBalance: (reports.length + checks.length) * 10,
  };
}
