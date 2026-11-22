// What this browser has already been shown by the coach. Local only, nothing is sent anywhere.
// Versioned: change VERSION to show the tour to everyone again.
const KEY = "tada.coach";
const VERSION = 1;

export type CoachStep = "intro" | "tour";
type Seen = Partial<Record<CoachStep, boolean>>;

function read(): Seen {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { v?: number } & Seen;
    return parsed.v === VERSION ? parsed : {};
  } catch {
    return {};
  }
}

export const coachSeen = (step: CoachStep) => read()[step] === true;

export function coachMarkSeen(step: CoachStep) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...read(), v: VERSION, [step]: true }));
  } catch {
    // storage blocked (private window): the tour may show again next visit, which is harmless
  }
}

export function coachReset() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing to reset
  }
}
