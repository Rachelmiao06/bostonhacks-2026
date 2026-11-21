"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quest } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { challengeHref } from "../links";
import { content, fill } from "./content";
import { useQuestHub, type BalanceState, type QuestHubApi } from "./useQuestHub";

// The hub: /challenge. A quest card opens the live quest page, /challenges/<id>.
// Presentation only. Loading, filtering and the token balance live in useQuestHub.ts.
export function Hub() {
  return (
    <Suspense fallback={<p className="font-pixel text-xs text-paper/70">{content.loading}</p>}>
      <HubGate />
    </Suspense>
  );
}

/** Old links looked like /challenge?id=<quest id>. Send them to the quest page. */
function HubGate() {
  const router = useRouter();
  const legacyId = useSearchParams().get("id");

  useEffect(() => {
    if (legacyId) router.replace(challengeHref(legacyId));
  }, [legacyId, router]);

  if (legacyId) return <p className="font-pixel text-xs text-paper/70">{content.opening}</p>;
  return <HubList />;
}

function HubList() {
  const hub = useQuestHub();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-heading text-3xl font-bold">{content.title}</h1>
          <BalanceChip balance={hub.balance} />
        </div>
        <p className="text-paper/80">{content.intro}</p>
        <p className="text-sm text-paper/70">{content.honestyNote}</p>
      </header>

      {hub.quests.state === "loading" && <p className="font-pixel text-xs text-paper/70">{content.loading}</p>}

      {hub.quests.state === "error" && (
        <Card>
          <CardHeader>
            <CardTitle>{content.errorTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={hub.retry}>
              {content.retry}
            </Button>
          </CardContent>
        </Card>
      )}

      {hub.quests.state === "ready" && <Ready hub={hub} />}
    </div>
  );
}

function Ready({ hub }: { hub: QuestHubApi }) {
  return (
    <>
      {hub.source === "snapshot" && (
        <p role="status" className="rounded-2xl border-2 border-ink bg-sun px-4 py-3 text-sm font-bold text-ink shadow-chip">
          {fill(content.snapshotBanner, { when: formatWhen(hub.fetchedAt) })}
        </p>
      )}

      {hub.total > 0 && (
        <div className="space-y-3">
          <FilterRow label={content.filterMode}>
            <Pill active={hub.mode === null} onClick={() => hub.setMode(null)}>{content.all}</Pill>
            <Pill active={hub.mode === "report"} onClick={() => hub.setMode("report")}>{content.modeReport}</Pill>
            <Pill active={hub.mode === "verify"} onClick={() => hub.setMode("verify")}>{content.modeVerify}</Pill>
          </FilterRow>
          {hub.lines.length > 0 && (
            <FilterRow label={content.filterLine}>
              <Pill active={hub.line === null} onClick={() => hub.setLine(null)}>{content.all}</Pill>
              {hub.lines.map((l) => (
                <Pill key={l} active={hub.line === l} onClick={() => hub.setLine(l)}>{l}</Pill>
              ))}
            </FilterRow>
          )}
        </div>
      )}

      {hub.total === 0 ? (
        <p className="text-paper/80">{content.none}</p>
      ) : hub.visible.length === 0 ? (
        <p className="text-paper/80">{content.empty}</p>
      ) : (
        <ul className="grid gap-5">
          {hub.visible.map((q) => (
            <li key={q.id}>
              <QuestCard quest={q} done={hub.isDone(q.id)} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function QuestCard({ quest, done }: { quest: Quest; done: boolean }) {
  const facts = [
    quest.stationName,
    quest.lines.length > 0 ? `${quest.lines.join(", ")} line` : null,
    quest.mode === "report" && quest.daysOpen > 0
      ? quest.daysOpen === 1
        ? content.dayOpen
        : fill(content.daysOpen, { n: quest.daysOpen })
      : null,
    quest.failuresLast90Days && quest.failuresLast90Days > 1
      ? fill(content.failures, { n: quest.failuresLast90Days })
      : null,
    fill(content.tokens, { n: quest.rewardTokens }),
  ].filter(Boolean);

  return (
    <Link
      href={challengeHref(quest.id)}
      className="group block rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-sky/60"
    >
      <Card className="transition-shadow group-hover:shadow-tile-lift">
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge tone={quest.mode === "report" ? "cherry" : "leaf"}>
              {quest.mode === "report" ? content.modeReportBadge : content.modeVerifyBadge}
            </Badge>
            <Badge tone="sun">{content.community}</Badge>
            {done && <Badge tone="sky">{content.done}</Badge>}
            {quest.activeNow === false && <Badge tone="steel">{content.notActive}</Badge>}
          </div>
          <CardTitle>{quest.facilityName}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">{facts.join(" · ")}</CardContent>
      </Card>
    </Link>
  );
}

function BalanceChip({ balance }: { balance: BalanceState }) {
  if (balance.state === "ready") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-4 py-1.5 font-heading font-bold text-ink shadow-chip">
        <Coins className="size-4" aria-hidden /> {balance.progress.tokenBalance} {content.balanceLabel}
      </span>
    );
  }
  const text =
    balance.state === "loading"
      ? content.balanceLoading
      : balance.reason === "no_database"
        ? content.balanceUnavailableNoDatabase
        : content.balanceUnavailable;
  return <span className="text-sm text-paper/70">{text}</span>;
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="w-12 text-sm font-bold text-paper/80">{label}</span>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border-2 border-ink px-3 py-1 text-sm font-bold outline-none focus-visible:ring-4 focus-visible:ring-sky/60",
        active ? "bg-sun text-ink" : "bg-paper text-ink hover:brightness-105",
      )}
    >
      {children}
    </button>
  );
}

const BADGE_TONES = { sun: "bg-sun", sky: "bg-sky", cherry: "bg-cherry text-paper", leaf: "bg-leaf", steel: "bg-steel" } as const;

function Badge({ children, tone }: { children: React.ReactNode; tone: keyof typeof BADGE_TONES }) {
  return (
    <span className={cn("rounded-full border-2 border-ink px-3 py-0.5 text-xs font-bold text-ink", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

function formatWhen(iso: string | null) {
  if (!iso) return "an earlier time";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "an earlier time";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
}
