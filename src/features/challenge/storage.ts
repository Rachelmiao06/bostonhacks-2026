import { useSyncExternalStore } from "react";
import type { RewardEvent, Submission } from "@/lib/types";
import { clearPhotos, type PhotoMeta } from "./photo";
import type { ReviewResult } from "./review";
import type { Quest } from "./sample-quests";

// Everything a player has done lives in this browser (localStorage). No accounts, no server.
const KEY = "tparty:v1";

export type StoredSubmission = {
  questId: string;
  text: string;
  photo: PhotoMeta | null;
  /** The AI check, plus the draft signature it was run on. If the draft changes, the check is out of date. */
  review: { result: ReviewResult; signature: string } | null;
  participationStatus: Submission["participationStatus"];
  updatedAt: string;
};

export type AppState = {
  anonymousUserId: string;
  submissions: Record<string, StoredSubmission>;
  rewards: RewardEvent[];
};

let cache: AppState | null = null;
const listeners = new Set<() => void>();

function read(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // unreadable or blocked storage: start fresh
  }
  return { anonymousUserId: crypto.randomUUID(), submissions: {}, rewards: [] };
}

function commit(next: AppState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: state stays in memory for this tab
  }
  listeners.forEach((l) => l());
}

/** Re-reads localStorage, as a page refresh or another tab would. */
export function reloadFromStorage() {
  cache = read();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      reloadFromStorage();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): AppState {
  if (!cache) cache = read();
  return cache;
}

/** null on the server and during hydration, the real state afterwards. */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function tokenBalance(state: AppState) {
  return state.rewards.reduce((sum, r) => sum + r.tokensAwarded, 0);
}

export function draftSignature(text: string, photoSignature: string | null) {
  return `${text.trim()}|${photoSignature ?? ""}`;
}

type DraftPatch = { text: string; photo: PhotoMeta | null };

export function saveDraft(questId: string, patch: DraftPatch) {
  const state = getSnapshot();
  const existing = state.submissions[questId];
  if (existing?.participationStatus === "completed_in_app") return;
  const submissions = { ...state.submissions };
  if (!patch.text.trim() && !patch.photo) {
    delete submissions[questId];
  } else {
    submissions[questId] = {
      questId,
      review: existing?.review ?? null,
      participationStatus: "draft",
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  }
  commit({ ...state, submissions });
}

export function saveReview(questId: string, result: ReviewResult, signature: string) {
  const state = getSnapshot();
  const existing = state.submissions[questId];
  if (!existing || existing.participationStatus === "completed_in_app") return;
  commit({
    ...state,
    submissions: {
      ...state.submissions,
      [questId]: { ...existing, review: { result, signature }, updatedAt: new Date().toISOString() },
    },
  });
}

/** Marks the quest done in the app and awards tokens once per quest. */
export function completeQuest(quest: Quest) {
  const state = getSnapshot();
  const existing = state.submissions[quest.id];
  if (!existing || existing.participationStatus === "completed_in_app") return;
  const now = new Date().toISOString();
  const alreadyRewarded = state.rewards.some((r) => r.challengeId === quest.id);
  commit({
    ...state,
    submissions: {
      ...state.submissions,
      [quest.id]: { ...existing, participationStatus: "completed_in_app", updatedAt: now },
    },
    rewards: alreadyRewarded
      ? state.rewards
      : [
          ...state.rewards,
          {
            id: crypto.randomUUID(),
            challengeId: quest.id,
            userId: state.anonymousUserId,
            tokensAwarded: quest.rewardTokens,
            awardedAt: now,
          },
        ],
  });
}

/** For lists: a short status for one quest, or null when the player has not started it. */
export function submissionStatus(saved: StoredSubmission | undefined) {
  if (!saved) return null;
  if (saved.participationStatus === "completed_in_app") return "completed_in_app" as const;
  return saved.review?.result.status === "reviewed" ? ("reviewed" as const) : ("draft" as const);
}

/** Deletes every draft, completion, token and saved photo on this device. */
export async function resetEverything() {
  resetAll();
  try {
    await clearPhotos();
  } catch {
    // no photos to clear
  }
}

export function resetAll() {
  cache = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}
