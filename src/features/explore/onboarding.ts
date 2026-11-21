// What this browser has already been shown, so the welcome and the two small hints appear once and never nag.
// Versioned: change VERSION to show everything again. Local only, nothing is sent anywhere, and it is
// separate from the map's saved camera (viewMemory.ts) and from the rider's stamps (those live on the server).
const KEY = "tparty.onboarding";
const VERSION = 1;

type Seen = { welcomed?: boolean; mapHint?: boolean; ticketHint?: boolean };
export type OnboardingStep = keyof Seen;

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

export function hasSeen(step: OnboardingStep): boolean {
  return read()[step] === true;
}

export function markSeen(step: OnboardingStep) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...read(), v: VERSION, [step]: true }));
  } catch {
    // storage blocked (private window): the hint may show again next visit, which is harmless
  }
}

// Whether the welcome was already done when this page loaded. Read once and kept, so choosing a start
// during this visit does not make the card vanish on its own mid-animation.
let welcomedAtLoad: boolean | undefined;
export function welcomedOnLoad(): boolean {
  welcomedAtLoad ??= hasSeen("welcomed");
  return welcomedAtLoad;
}
