"use client";

import { useEffect, useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { getRiderId } from "@/lib/rider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { loadMyProgress, sendVerification } from "./api";
import { flow } from "./content";
import { RewardCard } from "./RewardCard";

type Verdict = "working" | "still_broken";

// Verify quests: one tap, optional note, no AI check.
export function VerifyForm({ quest }: { quest: Quest }) {
  const [userId] = useState(getRiderId);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ verdict: Verdict; tokens: number; already: boolean } | null>(null);

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
    if (res.ok) setDone({ verdict, tokens: res.data.tokensAwarded, already: false });
    else setError(res.message); // the note stays in the box
  }

  if (done) {
    return (
      <RewardCard
        tokens={done.tokens}
        already={done.already}
        extra={<p>{done.verdict === "working" ? flow.verifiedWorking : flow.verifiedBroken}</p>}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-xl font-bold">{flow.verifyTitle}</h2>
        <p className="text-muted-foreground">{flow.verifyHelp}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" size="lg" className="h-14 bg-leaf text-ink" disabled={sending !== null} onClick={() => send("working")}>
            <CircleCheck aria-hidden className="size-5" /> {sending === "working" ? flow.sending : flow.working}
          </Button>
          <Button type="button" size="lg" variant="destructive" className="h-14" disabled={sending !== null} onClick={() => send("still_broken")}>
            <CircleX aria-hidden className="size-5" /> {sending === "still_broken" ? flow.sending : flow.stillBroken}
          </Button>
        </div>

        <div className="space-y-2">
          <label htmlFor="verify-note" className="text-sm font-bold">
            {flow.noteLabel}
          </label>
          <textarea
            id="verify-note"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder={flow.notePlaceholder}
            rows={2}
            className="w-full resize-y rounded-2xl border-2 border-ink bg-card p-3 text-base text-card-foreground shadow-chip outline-none placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-sky/60"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border-2 border-ink bg-cherry px-3 py-2 text-sm font-bold text-paper">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
