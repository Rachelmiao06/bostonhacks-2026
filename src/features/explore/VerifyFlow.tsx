"use client";

import { useEffect, useState } from "react";
import { CircleCheck, CircleX, MessageSquarePlus } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { getRiderId } from "@/lib/rider";
import { loadMyProgress, sendVerification } from "@/features/challenge/api";
import { flow } from "@/features/challenge/content";
import { Celebration } from "./Celebration";
import { refreshProgress } from "./progress";
import { AtlasButton, AtlasTextarea, ErrorNote } from "./ui";

type Verdict = "working" | "still_broken";

/** A verify quest inside the map panel: one tap, an optional note, no AI check. Uses PR #14's API helpers. */
export function VerifyFlow({ quest, onDone }: { quest: Quest; onDone: () => void }) {
  const [userId] = useState(getRiderId);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ verdict: Verdict; tokens: number; already: boolean } | null>(null);

  // Already answered on an earlier visit?
  useEffect(() => {
    let cancelled = false;
    loadMyProgress(userId).then((res) => {
      if (cancelled || !res.ok) return;
      const mine = res.data.verifications.find((v) => v.alert_id === quest.id);
      if (mine) setDone({ verdict: mine.verdict, tokens: quest.rewardTokens, already: true });
    });
    return () => {
      cancelled = true;
    };
  }, [userId, quest.id, quest.rewardTokens]);

  async function send(verdict: Verdict) {
    setError(null);
    setSending(verdict);
    const res = await sendVerification({ questId: quest.id, userId, verdict, note });
    setSending(null);
    if (res.ok) {
      setDone({ verdict, tokens: res.data.tokensAwarded, already: false });
      void refreshProgress();
    } else setError(res.message); // the note stays in the box
  }

  if (done) {
    return (
      <Celebration
        quest={quest}
        tokens={done.tokens}
        already={done.already}
        onDone={onDone}
        extra={<p className="text-sm">{done.verdict === "working" ? flow.verifiedWorking : flow.verifiedBroken}</p>}
      />
    );
  }

  return (
    <div className="space-y-4 font-ui">
      {/* The question and two big answers. The help sentence is read out to screen readers. */}
      <h3 className="font-serif text-xl font-semibold">{flow.verifyTitle}</h3>
      <p className="sr-only">{flow.verifyHelp}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <AtlasButton size="lg" fill="bg-cat-verify" className="h-14" disabled={sending !== null} onClick={() => send("working")}>
          <CircleCheck className="size-5" aria-hidden /> {sending === "working" ? flow.sending : flow.working}
        </AtlasButton>
        <AtlasButton size="lg" fill="bg-cat-service" className="h-14" disabled={sending !== null} onClick={() => send("still_broken")}>
          <CircleX className="size-5" aria-hidden /> {sending === "still_broken" ? flow.sending : flow.stillBroken}
        </AtlasButton>
      </div>
      {/* An optional note stays out of the way until asked for */}
      <details className="group">
        <summary
          aria-label={flow.noteLabel}
          className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full px-1 py-1 text-taupe outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/40 [&::-webkit-details-marker]:hidden"
        >
          <MessageSquarePlus className="size-5" aria-hidden />
        </summary>
        <AtlasTextarea
          id="map-verify-note"
          aria-label={flow.noteLabel}
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder={flow.notePlaceholder}
          rows={2}
          className="mt-2"
        />
      </details>
      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}
