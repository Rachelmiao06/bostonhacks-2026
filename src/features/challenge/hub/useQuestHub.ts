"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Quest, QuestFeed } from "@/lib/mbta";
import { getRiderId } from "@/lib/rider";
import { fetchProgress, fetchQuests, type Progress } from "./api";

/**
 * THE CONTRACT FOR ANY QUEST HUB SCREEN.
 * This hook loads the live quests and the rider's server-side token balance, and filters the list.
 * A screen only renders what it returns. Redesign it freely; keep using the hook.
 */

export type QuestsState =
  | { state: "loading" }
  | { state: "ready"; feed: QuestFeed }
  | { state: "error" };

export type BalanceState =
  | { state: "loading" }
  | { state: "ready"; progress: Progress }
  /** The server cannot say (no database, or a failure). Never shown as 0. */
  | { state: "unavailable"; reason: "no_database" | "error" };

export type ModeFilter = "report" | "verify" | null;

const NO_QUESTS: Quest[] = [];

export function useQuestHub() {
  const [quests, setQuests] = useState<QuestsState>({ state: "loading" });
  const [balance, setBalance] = useState<BalanceState>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [line, setLine] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeFilter>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchQuests(controller.signal)
      .then((feed) => setQuests({ state: "ready", feed }))
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setQuests({ state: "error" });
      });
    fetchProgress(getRiderId(), controller.signal)
      .then((result) =>
        setBalance(
          result.kind === "ok"
            ? { state: "ready", progress: result.data }
            : { state: "unavailable", reason: "no_database" },
        ),
      )
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setBalance({ state: "unavailable", reason: "error" });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setQuests({ state: "loading" });
    setBalance({ state: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const all = useMemo(() => (quests.state === "ready" ? quests.feed.quests : NO_QUESTS), [quests]);

  const lines = useMemo(() => {
    const seen = new Set<string>();
    for (const q of all) for (const l of q.lines) seen.add(l);
    return [...seen];
  }, [all]);

  const visible = useMemo(
    () => all.filter((q) => (!line || q.lines.includes(line)) && (!mode || q.mode === mode)),
    [all, line, mode],
  );

  /** True when the server says this rider already finished the quest (report completed or fix checked). */
  const isDone = useCallback(
    (questId: string) =>
      balance.state === "ready" &&
      (balance.progress.completedQuestIds.includes(questId) || balance.progress.verifiedQuestIds.includes(questId)),
    [balance],
  );

  return {
    quests,
    balance,
    retry,
    // filtering
    line,
    setLine,
    mode,
    setMode,
    lines,
    visible,
    total: all.length,
    isDone,
    /** "snapshot" means MBTA could not be reached and the quests are saved data. */
    source: quests.state === "ready" ? quests.feed.source : null,
    fetchedAt: quests.state === "ready" ? quests.feed.fetchedAt : null,
  };
}

export type QuestHubApi = ReturnType<typeof useQuestHub>;
