"use client";

import { useEffect, useState } from "react";
import type { Quest, QuestFeed } from "@/lib/mbta";

export type QuestLookup =
  | { state: "loading" }
  | { state: "error" }
  | { state: "not_found" }
  | { state: "found"; quest: Quest; source: QuestFeed["source"] };

/** Finds one quest in the existing /api/quests list. No extra MBTA call. */
export function useQuest(id: string): QuestLookup {
  const [result, setResult] = useState<QuestLookup>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/quests")
      .then((res) => {
        if (!res.ok) throw new Error(`quests answered ${res.status}`);
        return res.json() as Promise<QuestFeed>;
      })
      .then((feed) => {
        if (cancelled) return;
        const quest = feed.quests.find((q) => q.id === id);
        setResult(quest ? { state: "found", quest, source: feed.source } : { state: "not_found" });
      })
      .catch(() => {
        if (!cancelled) setResult({ state: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return result;
}
