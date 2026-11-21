// Data model from docs/SPEC.md. Types only, no logic.

export type Station = {
  id: string;
  name: string;
  lines: string[];
  mapX: number;
  mapY: number;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  /** Official = real MBTA request for input. Community = made by Tada, must be labelled unofficial. */
  type: "official_opportunity" | "community_mission";
  stationIds: string[];
  category: string;
  sourceUrl: string | null;
  participationUrl: string | null;
  deadline: string | null;
  instructions: string;
  rewardTokens: number;
  status: "active" | "expired" | "archived";
};

export type Submission = {
  id: string;
  challengeId: string;
  userId: string;
  text: string;
  photoId: string | null;
  aiStatus: "not_checked" | "needs_revision" | "reviewed";
  aiFeedback: string | null;
  /** "completed_in_app" never means the MBTA received it. */
  participationStatus: "draft" | "ready_for_official_submission" | "completed_in_app";
  updatedAt: string;
};

export type Photo = {
  id: string;
  submissionId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** The file itself belongs in IndexedDB, not localStorage. */
  localStorageKey: string | null;
};

export type UserState = {
  anonymousUserId: string;
  tokenBalance: number;
  completedChallengeIds: string[];
};

export type RewardEvent = {
  id: string;
  challengeId: string;
  userId: string;
  tokensAwarded: number;
  awardedAt: string;
};
