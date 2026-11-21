"use client";

import { useEffect, useState } from "react";
import type { Quest, QuestFeed } from "@/lib/mbta";

/** Demo only: the live quests. The real home screen already loads these (features/explore/quests.ts). */
export function useDemoQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/quests", { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<QuestFeed>) : Promise.reject(new Error(String(res.status)))))
      .then((feed) => setQuests(feed.quests.filter((q) => q.activeNow !== false).slice(0, 60)))
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, []);

  return { quests, failed };
}
