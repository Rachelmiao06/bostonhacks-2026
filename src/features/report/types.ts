// Shared by the Report screens and the /api/report routes. No secrets here.

export type Verdict = "fixable" | "private" | "unclear" | "emergency";

export type CheckResult = {
  verdict: Verdict;
  /** Plain-language reason shown to the user. */
  reason: string;
  /** One of Boston's 311 service names (see categories.ts). Only meaningful when fixable. */
  serviceName: string;
  /** Draft description, editable by the user. Only meaningful when fixable. */
  description: string;
};

export type NearbyCase = {
  caseId: string;
  serviceName: string;
  team: string | null;
  status: string;
  openedAt: string | null;
  distanceM: number;
};

export type CityStatus = {
  caseId: string;
  status: string;
  team: string | null;
  serviceName: string | null;
  openedAt: string | null;
  closedAt: string | null;
  closureReason: string | null;
  closureComment: string | null;
};

export type Stage = "sent" | "in_progress" | "closed";

/** A case kept on this device. Simulated cases are labelled so: they were never sent to the city. */
export type SavedCase = {
  caseId: string;
  /** "demo" = simulated send; "followed" = a real 311 case someone else filed. */
  kind: "demo" | "followed";
  serviceName: string;
  team: string;
  description: string;
  lat: number;
  lng: number;
  /** Small JPEG data URL, for the list. */
  thumb: string | null;
  createdAt: number;
};

export type ApiError = { error: string; code?: string };
