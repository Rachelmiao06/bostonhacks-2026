import type { MyProgress } from "@/features/explore/progress";

// Example journal entries, shown ONLY when the rider has no real history yet (so the page is not empty) or in the preview.
// They are clearly labelled "Example" on the page and are never counted, saved or sent anywhere.

const ago = (now: Date, days: number, hour = 12) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export function demoProgress(now: Date): MyProgress {
  const base = { has_photo: false, handed_off: false, resolved_at: null };
  return {
    submissions: [
      {
        ...base,
        id: "demo-1",
        alert_id: "demo-1",
        text: "The elevator at Park Street has been out for three days. I use a wheelchair and had to go two stops past to reach the street. A sign at the gate would help.",
        ai_status: "reviewed",
        ai_feedback: { status: "reviewed", scores: { relevance: 5, specificity: 4, completeness: 4, photoRelevance: null }, feedback: "Clear and specific: you say who it affects and what happened. Nice work.", suggestions: [] },
        status: "completed",
        handed_off: true,
        updated_at: ago(now, 1),
        completed_at: ago(now, 1),
        station_name: "Park Street",
        header: "Elevator out of service",
        kind: "elevator",
        likes: 3,
      },
      {
        ...base,
        id: "demo-2",
        alert_id: "demo-2",
        text: "The escalator was stopped.",
        ai_status: "needs_revision",
        ai_feedback: { status: "needs_revision", scores: { relevance: 4, specificity: 2, completeness: 2, photoRelevance: null }, feedback: "A good start, but it is short. Tell the MBTA what you needed to do and how long it was stopped.", suggestions: ["Which direction was it stopped?", "What did you do instead?"] },
        status: "draft",
        updated_at: ago(now, 3),
        completed_at: null,
        station_name: "Downtown Crossing",
        header: "Escalator out of service",
        kind: "escalator",
      },
      {
        ...base,
        id: "demo-3",
        alert_id: "demo-3",
        text: "Both lifts at Harvard were closed on a Saturday morning, so I took the long way round with my stroller.",
        ai_status: "reviewed",
        ai_feedback: null,
        status: "completed",
        updated_at: ago(now, 6),
        completed_at: ago(now, 6),
        station_name: "Harvard",
        header: "Elevator out of service",
        kind: "elevator",
        likes: 1,
      },
    ],
    verifications: [
      { alert_id: "demo-v1", verdict: "working", created_at: ago(now, 2, 9), station_name: "Kenmore", header: "Elevator reported fixed" },
      { alert_id: "demo-v2", verdict: "still_broken", created_at: ago(now, 4, 15), station_name: "Back Bay", header: "Elevator reported fixed" },
      { alert_id: "demo-v3", verdict: "working", created_at: ago(now, 8, 10), station_name: "Alewife", header: "Elevator reported fixed" },
    ],
    completedQuestIds: [],
    verifiedQuestIds: [],
    tokenBalance: 0,
  };
}
