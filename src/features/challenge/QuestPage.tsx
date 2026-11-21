"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Quest, QuestFeed } from "@/lib/mbta";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ribbon } from "@/components/shared/ribbon";
import { Coin } from "@/components/shared/coin";
import { daysOpenText, details, failuresText, kindLabels } from "./content";
import { useQuest } from "./useQuest";
import { ReportForm } from "./ReportForm";
import { VerifyForm } from "./VerifyForm";

// The live quest page at /challenges/[id]. Quest data comes from /api/quests only.
export function QuestPage({ id }: { id: string }) {
  const lookup = useQuest(id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {lookup.state === "loading" && <Status>{details.loading}</Status>}
      {lookup.state === "error" && <Status role="alert">{details.loadFailed}</Status>}
      {lookup.state === "not_found" && <QuestNotFound />}
      {lookup.state === "found" && <QuestDetails quest={lookup.quest} source={lookup.source} />}
    </div>
  );
}

function Status({ children, role }: { children: React.ReactNode; role?: "alert" }) {
  return (
    <p role={role ?? "status"} className="font-pixel text-xs leading-relaxed text-foreground/80">
      {children}
    </p>
  );
}

export function QuestNotFound() {
  return (
    <Card>
      <CardHeader>
        <h1 className="font-heading text-2xl font-bold">{details.notFoundTitle}</h1>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{details.notFoundBody}</p>
        <Button render={<Link href="/explore" />} nativeButton={false}>
          {details.backToExplore}
        </Button>
      </CardContent>
    </Card>
  );
}

function QuestDetails({ quest, source }: { quest: Quest; source: QuestFeed["source"] }) {
  const verify = quest.mode === "verify";
  return (
    <article className="space-y-6">
      <Ribbon tone="sun">{details.communityLabel}</Ribbon>

      <Card>
        <CardHeader className="gap-3">
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {verify ? details.verifyMode : details.reportMode} · {kindLabels[quest.kind]}
          </p>
          <h1 className="font-heading text-2xl leading-snug font-bold sm:text-3xl">{quest.facilityName}</h1>
          {verify && <p className="font-bold">{details.resolvedNote}</p>}
        </CardHeader>

        <CardContent className="space-y-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Fact label={details.stationLabel}>{quest.stationName}</Fact>
            <Fact label={details.linesLabel}>
              {quest.lines.length > 0 ? quest.lines.join(", ") : details.noLines}
            </Fact>
            <Fact label={details.kindLabel}>{kindLabels[quest.kind]}</Fact>
            {!verify && <Fact label={details.openLabel}>{daysOpenText(quest.daysOpen)}</Fact>}
            {quest.failuresLast90Days !== undefined && (
              <Fact label={details.failuresLabel}>{failuresText(quest.failuresLast90Days)}</Fact>
            )}
            <Fact label={details.rewardLabel}>
              <span className="inline-flex items-center gap-1.5">
                <Coin size={20} className="motion-reduce:animate-none" /> +{quest.rewardTokens} tokens
              </span>
            </Fact>
          </dl>

          <section className="space-y-1 rounded-xl border-2 border-ink bg-muted p-4">
            <h2 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{details.alertLabel}</h2>
            <p>{quest.header}</p>
          </section>

          <a
            href={quest.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-bold underline underline-offset-4"
          >
            {details.sourceLink} <ExternalLink className="size-4" aria-hidden />
          </a>

          <p className="text-sm text-muted-foreground">{details.communityNote}</p>
          {source === "snapshot" && <p className="text-sm text-muted-foreground">{details.snapshotNote}</p>}
        </CardContent>
      </Card>

      {verify ? <VerifyForm quest={quest} /> : <ReportForm quest={quest} />}
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}
