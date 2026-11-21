import type { QuestFeed } from "@/lib/mbta";

/** What GET /api/submissions?userId= returns that the hub uses. The server counts tokens; the browser never does. */
export type Progress = {
  tokenBalance: number;
  completedQuestIds: string[];
  verifiedQuestIds: string[];
};

export type ProgressResult =
  | { kind: "ok"; data: Progress }
  /** 503: the route says the database is not configured. */
  | { kind: "no_database" };

export async function fetchQuests(signal?: AbortSignal): Promise<QuestFeed> {
  const res = await fetch("/api/quests", { signal });
  if (!res.ok) throw new Error(`quests answered ${res.status}`);
  const feed = (await res.json()) as Partial<QuestFeed>;
  if (!feed || !Array.isArray(feed.quests)) throw new Error("quests answered with an unexpected shape");
  return feed as QuestFeed;
}

export async function fetchProgress(userId: string, signal?: AbortSignal): Promise<ProgressResult> {
  const res = await fetch(`/api/submissions?userId=${encodeURIComponent(userId)}`, { signal });
  if (res.status === 503) return { kind: "no_database" };
  if (!res.ok) throw new Error(`submissions answered ${res.status}`);
  const body = (await res.json()) as Partial<Progress>;
  if (typeof body.tokenBalance !== "number") throw new Error("submissions answered with an unexpected shape");
  return {
    kind: "ok",
    data: {
      tokenBalance: body.tokenBalance,
      completedQuestIds: Array.isArray(body.completedQuestIds) ? body.completedQuestIds : [],
      verifiedQuestIds: Array.isArray(body.verifiedQuestIds) ? body.verifiedQuestIds : [],
    },
  };
}
