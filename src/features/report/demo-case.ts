// A simulated case, clearly labelled "Demo" in the UI. It moves Sent -> In progress -> Closed on a timer so the
// whole loop can be shown. The closure notes are written in the style of Boston's real `closure_comments`.
import type { SavedCase, Stage } from "./types";

const IN_PROGRESS_AFTER_MS = 15_000;
const CLOSED_AFTER_MS = 50_000;

const NOTES: Record<string, string> = {
  Pothole: "Pothole has been filled.",
  "Sidewalk Repair": "Sidewalk has been repaired.",
  "Street Light Outage": "Street light has been repaired.",
  "Litter & Debris": "Litter has been picked up.",
  "Illegal Dumping or Disposal": "Dumped items have been removed.",
  "Overflowing Trash": "Trash has been collected.",
  "Illegal Graffiti": "Graffiti has been removed.",
  "Missing / Knocked Down Sign": "Sign has been replaced.",
  "Fallen Tree or Branches": "Branches have been cleared.",
  "Needle Pickup": "Needles have been picked up.",
  "Dead Animal General": "Animal has been removed.",
};

export function demoStage(c: SavedCase, now = Date.now()): Stage {
  const age = now - c.createdAt;
  return age >= CLOSED_AFTER_MS ? "closed" : age >= IN_PROGRESS_AFTER_MS ? "in_progress" : "sent";
}

export const demoNote = (serviceName: string) => NOTES[serviceName] ?? "The issue has been taken care of.";
export const demoClosedAt = (c: SavedCase) => c.createdAt + CLOSED_AFTER_MS;
