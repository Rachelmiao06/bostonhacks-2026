"use client";

import { useSyncExternalStore } from "react";
import type { Review } from "@/lib/ai";
import { getRiderId } from "@/lib/rider";

// This rider's contributions, from the existing GET /api/submissions route.
// One shared store, so the map pins, the progress chip, My Journey and Collection always agree.
// The server counts tokens (one reward per completed or verified quest); nothing is counted here.

export type MySubmission = {
  id: string;
  alert_id: string;
  text: string;
  has_photo: boolean;
  ai_status: "not_checked" | "needs_revision" | "reviewed" | string;
  ai_feedback: Review | null;
  status: "draft" | "completed" | string;
  handed_off: boolean;
  updated_at: string;
  completed_at: string | null;
  station_name?: string;
  header?: string;
  kind?: string;
  resolved_at?: string | null;
};

export type MyVerification = {
  alert_id: string;
  verdict: "working" | "still_broken";
  created_at: string;
  station_name: string;
  header: string;
};

export type MyProgress = {
  submissions: MySubmission[];
  verifications: MyVerification[];
  completedQuestIds: string[];
  verifiedQuestIds: string[];
  tokenBalance: number;
};

export type ProgressState =
  | { status: "loading" }
  /** The database is not set up or could not be reached: hide progress rather than show made-up numbers. */
  | { status: "unavailable" }
  | { status: "ready"; data: MyProgress; done: ReadonlySet<string> };

let state: ProgressState = { status: "loading" };
let started = false;
const listeners = new Set<() => void>();

function set(next: ProgressState) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Loads (or reloads) this rider's progress. Call after finishing a quest. */
export async function refreshProgress() {
  started = true;
  try {
    const res = await fetch(`/api/submissions?userId=${encodeURIComponent(getRiderId())}`);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as MyProgress;
    set({ status: "ready", data, done: new Set([...data.completedQuestIds, ...data.verifiedQuestIds]) });
  } catch {
    // Keep what we had if a reload fails.
    if (state.status !== "ready") set({ status: "unavailable" });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) void refreshProgress();
  return () => listeners.delete(listener);
}

const LOADING: ProgressState = { status: "loading" };

export function useMyProgress(): ProgressState {
  return useSyncExternalStore(subscribe, () => state, () => LOADING);
}

/** Stamps = finished contributions: completed reports plus verifications. */
export function stampCount(data: MyProgress) {
  return data.completedQuestIds.length + data.verifiedQuestIds.length;
}
