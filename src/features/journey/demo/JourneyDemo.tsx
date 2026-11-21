"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Quest } from "@/lib/mbta";
import { JourneySurface } from "../JourneySurface";
import { policy, shouldAutoReview, suggestNext } from "../policy";
import { useJourney } from "../useJourney";
import { Field } from "./Field";
import { Reward } from "./Reward";
import { Sheet } from "./Sheet";
import { useDemoQuests } from "./useDemoQuests";

/**
 * PLACEHOLDER HOME SCREEN for /journey. It exists to show the flow working end to end on live quests.
 * Real screens replace Field (the map), Sheet and Reward and keep this wiring:
 *
 *   tap a problem      -> select
 *   every edit         -> draft
 *   pause after typing -> reviewStarted, then the real check -> reviewResult
 *   hold on the ring   -> commit (inside Sheet), then the real save -> completed / sendFailed
 *
 * The check and the save are STAND-INS here (a timer and a local set). In the real app they are
 * `useReport` and `/api/submissions` from features/challenge.
 * Try the one-gesture verify path with /journey?mode=verify (the demo has no database).
 */
export function JourneyDemo() {
  const journey = useJourney();
  // The actions never change identity, so they are safe as effect dependencies (the journey object is not).
  const { select, dismiss, draft, reviewStarted, reviewResult, completed, next } = journey;
  const { stage, questId, parkedQuestId } = journey.state;
  const { quests } = useDemoQuests();

  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(new Set());
  const [nextId, setNextId] = useState<string | null>(null);
  const changedSinceCheck = useRef(false);
  const drafts = useRef<Map<string, { text: string; photoUrl: string | null }>>(new Map());

  const quest = useMemo(() => quests.find((q) => q.id === questId) ?? null, [quests, questId]);

  const onSelect = (q: Quest) => {
    const mode = new URLSearchParams(window.location.search).get("mode") === "verify" ? "verify" : q.mode;
    const saved = drafts.current.get(q.id); // a draft the rider walked away from comes back
    setText(saved?.text ?? "");
    setPhotoUrl(saved?.photoUrl ?? null);
    changedSinceCheck.current = Boolean(saved);
    setNextId(null);
    select(q.id, mode);
    if (saved && mode === "report") draft(true);
  };

  const edit = (nextText: string, nextPhoto: string | null) => {
    setText(nextText);
    setPhotoUrl(nextPhoto);
    changedSinceCheck.current = true;
    if (questId) drafts.current.set(questId, { text: nextText, photoUrl: nextPhoto });
    draft(nextText.trim().length > 0 || nextPhoto !== null);
  };

  // Automatic check: when the rider pauses, there is no Check button to press.
  useEffect(() => {
    const idle = policy.autoReviewIdleMs;
    if (!shouldAutoReview({ stage, chars: text.trim().length, hasPhoto: photoUrl !== null, changedSinceCheck: changedSinceCheck.current, idleMs: idle })) return;
    const timer = setTimeout(() => {
      changedSinceCheck.current = false;
      reviewStarted();
    }, idle);
    return () => clearTimeout(timer);
  }, [stage, text, photoUrl, reviewStarted]);

  // STAND-IN for the AI check. Real: useReport + /api/review. Typing the word "fail" shows the retry path.
  useEffect(() => {
    if (stage !== "reviewing") return;
    const timer = setTimeout(() => {
      reviewResult(/\bfail\b/i.test(text) ? "failed" : text.trim().length >= 60 || photoUrl ? "passed" : "needs_work");
    }, 900);
    return () => clearTimeout(timer);
  }, [stage, text, photoUrl, reviewResult]);

  // STAND-IN for the save. Real: /api/submissions (and /api/verifications for a verify).
  useEffect(() => {
    if (stage !== "sending" || !quest) return;
    const timer = setTimeout(() => {
      setDoneIds((ids) => new Set(ids).add(quest.id));
      drafts.current.delete(quest.id);
      completed(quest.rewardTokens);
    }, 700);
    return () => clearTimeout(timer);
  }, [stage, quest, completed]);

  // After the reward the map takes over by itself and points at the next problem.
  useEffect(() => {
    if (stage !== "reward" || !quest) return;
    const timer = setTimeout(() => {
      setNextId(suggestNext(quests, doneIds, quest, quest.id));
      next();
    }, policy.rewardLingerMs);
    return () => clearTimeout(timer);
  }, [stage, quest, quests, doneIds, next]);

  return (
    <JourneySurface
      journey={journey}
      map={
        <Field
          quests={quests}
          doneIds={doneIds}
          nextId={nextId}
          selectedId={stage === "explore" ? null : questId}
          parkedId={parkedQuestId}
          dimmed={journey.layers.map === "dimmed"}
          onSelect={onSelect}
          onBackgroundTap={() => journey.layers.gestures.dismiss && dismiss()}
        />
      }
      sheet={
        quest && journey.layers.sheet !== "hidden" ? (
          <Sheet
            key={quest.id}
            journey={journey}
            quest={quest}
            text={text}
            photoUrl={photoUrl}
            onText={(value) => edit(value, photoUrl)}
            onPhoto={(file) => edit(text, file ? URL.createObjectURL(file) : null)}
          />
        ) : null
      }
      overlay={journey.state.reward ? <Reward tokens={journey.state.reward.tokens} /> : null}
    />
  );
}
