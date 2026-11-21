"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { content, instructionsFor } from "./content";
import { challengeHref, QUEST_ID_PARAM } from "./links";
import { findQuest, sampleQuests, type Quest } from "./sample-quests";
import { SubmitForm } from "./SubmitForm";
import { resetEverything, submissionStatus, tokenBalance, useAppState, type AppState } from "./storage";
import { cn } from "@/lib/utils";

// The quest comes from the URL (/challenge?id=...) so it works for live quests later too.
export function Challenge() {
  return (
    <Suspense fallback={<p className="font-pixel text-xs text-paper/70">Loading...</p>}>
      <ChallengeInner />
    </Suspense>
  );
}

function ChallengeInner() {
  const id = useSearchParams().get(QUEST_ID_PARAM);
  const state = useAppState();

  if (!state) return <p className="font-pixel text-xs text-paper/70">Loading...</p>;

  const quest = id ? findQuest(id) : null;
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TokenChip state={state} />
        <ResetButton />
      </div>
      {id === null ? (
        <QuestPicker state={state} />
      ) : quest ? (
        <QuestView quest={quest} state={state} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{content.notFound}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={challengeHref()} className="font-bold underline">
              {content.backToList}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TokenChip({ state }: { state: AppState }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-4 py-1.5 font-heading font-bold text-ink shadow-chip">
      <Coins className="size-4" aria-hidden /> {tokenBalance(state)} tokens
    </span>
  );
}

function ResetButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (!window.confirm(content.resetConfirm)) return;
        await resetEverything();
        window.location.reload();
      }}
    >
      {content.resetLabel}
    </Button>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "sun" | "steel" | "sky" }) {
  const tones = { sun: "bg-sun", steel: "bg-steel", sky: "bg-sky" } as const;
  return (
    <span className={cn("rounded-full border-2 border-ink px-3 py-0.5 text-xs font-bold text-ink", tones[tone])}>
      {children}
    </span>
  );
}

const STATUS_LABEL = { draft: "Draft", reviewed: "Reviewed", completed_in_app: "Completed in app" } as const;

function statusLabel(state: AppState, questId: string) {
  const status = submissionStatus(state.submissions[questId]);
  return status ? STATUS_LABEL[status] : null;
}

function QuestPicker({ state }: { state: AppState }) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl font-bold">{content.pickerTitle}</h1>
        <p className="text-paper/80">{content.pickerIntro}</p>
      </div>
      <ul className="grid gap-5">
        {sampleQuests.map((q) => {
          const status = statusLabel(state, q.id);
          return (
            <li key={q.id}>
              <Link
                href={challengeHref(q.id)}
                className="group block rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-sky/60"
              >
                <Card className="transition-shadow group-hover:shadow-tile-lift">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2">
                      {q.isSample && <Badge tone="steel">{content.sampleBadge}</Badge>}
                      <Badge tone="sun">{content.communityBadge}</Badge>
                      {status && <Badge tone="sky">{status}</Badge>}
                    </div>
                    <CardTitle>{q.facilityName}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    {q.stationName} · {q.lines.join(", ")} line · +{q.rewardTokens} tokens
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function QuestView({ quest, state }: { quest: Quest; state: AppState }) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            {quest.isSample && <Badge tone="steel">{content.sampleBadge}</Badge>}
            <Badge tone="sun">{content.communityBadge}</Badge>
          </div>
          <h1 className="font-heading text-2xl leading-snug font-bold">{quest.facilityName}</h1>
          <p className="text-muted-foreground">
            {quest.stationName} · {quest.lines.join(", ")} line · +{quest.rewardTokens} tokens
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{quest.header}</p>
          <p className="font-bold">{instructionsFor(quest.kind)}</p>
          {quest.isSample && <p className="text-sm text-muted-foreground">{content.sampleNote}</p>}
          <p className="text-sm text-muted-foreground">{content.honestyNote}</p>
          <p className="text-sm">
            Source:{" "}
            <a className="font-bold underline" href={quest.sourceUrl} target="_blank" rel="noreferrer">
              MBTA alerts (opens mbta.com)
            </a>
          </p>
        </CardContent>
      </Card>

      {/* key: switching quests starts a fresh form instead of reusing the old one's state */}
      <SubmitForm key={quest.id} quest={quest} state={state} />
    </div>
  );
}
