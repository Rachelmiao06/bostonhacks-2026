"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { QuestKind } from "@/lib/mbta";
import { PixelTrain } from "@/components/shared/pixel-train";
import { Stamp } from "@/components/shared/stamp";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryStyle } from "@/features/explore/category";
import { categoryOfKind, kindLabels, type CategoryId } from "@/features/explore/content";
import { useMyProgress, type MySubmission, type MyVerification } from "@/features/explore/progress";
import { content } from "./content";

const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

const categoryOfSubmission = (s: MySubmission): CategoryId => categoryOfKind[(s.kind ?? "station") as QuestKind] ?? "station";

/**
 * Everything this rider has done, as a stack of travel tickets: drafts to finish, completed reports, checked fixes.
 * All of it comes from GET /api/submissions; nothing is counted or invented here.
 */
export function MyChallenges() {
  const progress = useMyProgress();

  return (
    <article className="font-ui text-graphite">
      <header className="space-y-1.5 border-b border-hairline pb-5">
        <p className="font-mono text-[0.65rem] tracking-[0.16em] text-taupe uppercase">{content.eyebrow}</p>
        <h1 className="font-serif text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{content.title}</h1>
        {progress.status === "ready" && (
          <p className="text-sm text-taupe">
            {content.summary(progress.data.completedQuestIds.length, progress.data.verifiedQuestIds.length, progress.data.tokenBalance)}
          </p>
        )}
      </header>

      {progress.status === "loading" && <p className="pt-6 text-sm text-taupe">{content.loading}</p>}
      {progress.status === "unavailable" && (
        <p role="alert" className="pt-6 text-sm text-taupe">
          {content.unavailable}
        </p>
      )}
      {progress.status === "ready" && <Journey submissions={progress.data.submissions} verifications={progress.data.verifications} />}
    </article>
  );
}

function Journey({ submissions, verifications }: { submissions: MySubmission[]; verifications: MyVerification[] }) {
  const drafts = submissions.filter((s) => s.status !== "completed");
  const completed = submissions.filter((s) => s.status === "completed");

  if (submissions.length === 0 && verifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
        <PixelTrain size={72} />
        <h2 className="font-serif text-2xl font-semibold">{content.emptyTitle}</h2>
        <p className="max-w-sm text-sm text-taupe">{content.emptyBody}</p>
        <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-full bg-graphite px-5 text-sm font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25">
          {content.emptyCta} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-9 pt-6">
      {drafts.length > 0 && (
        <Section title={content.inProgress} note={content.inProgressNote} count={drafts.length}>
          {drafts.map((s) => (
            <TicketRow
              key={s.id}
              category={categoryOfSubmission(s)}
              kindLabel={s.kind ? kindLabels[s.kind as QuestKind] : undefined}
              station={s.station_name ?? ""}
              header={s.header ?? ""}
              status={s.ai_status === "reviewed" ? content.passed : s.ai_status === "needs_revision" ? content.needsRevision : content.draft}
              notes={s.resolved_at ? [content.nowFixed] : []}
              action={{ href: `/?quest=${encodeURIComponent(s.alert_id)}`, label: content.continue }}
            />
          ))}
        </Section>
      )}

      {completed.length > 0 && (
        <Section title={content.completed} count={completed.length}>
          {completed.map((s) => (
            <TicketRow
              key={s.id}
              category={categoryOfSubmission(s)}
              kindLabel={s.kind ? kindLabels[s.kind as QuestKind] : undefined}
              station={s.station_name ?? ""}
              header={s.header ?? ""}
              status={`${content.completedInApp} ${content.on(day(s.completed_at))}`}
              notes={[...(s.handed_off ? [content.handedOff] : []), ...(s.resolved_at ? [content.nowFixed] : [])]}
              quote={s.text}
              stamped
              action={s.resolved_at ? undefined : { href: `/?quest=${encodeURIComponent(s.alert_id)}`, label: content.viewOnMap }}
            />
          ))}
        </Section>
      )}

      {verifications.length > 0 && (
        <Section title={content.checked} count={verifications.length}>
          {verifications.map((v) => (
            <TicketRow
              key={v.alert_id}
              category="verify"
              station={v.station_name}
              header={v.header}
              status={`${v.verdict === "working" ? content.working : content.stillBroken} ${content.on(day(v.created_at))}`}
              notes={[]}
              stamped
            />
          ))}
        </Section>
      )}

      <p className="border-t border-hairline pt-4 text-xs text-taupe">{content.honest}</p>
    </div>
  );
}

function Section({ title, note, count, children }: { title: string; note?: string; count: number; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        <span className="font-mono text-xs text-taupe tabular-nums">{count}</span>
      </div>
      {note && <p className="-mt-2 text-xs text-taupe">{note}</p>}
      <ul className="space-y-3">{children}</ul>
    </section>
  );
}

type RowProps = {
  category: CategoryId;
  kindLabel?: string;
  station: string;
  header: string;
  status: string;
  notes: string[];
  quote?: string;
  stamped?: boolean;
  action?: { href: string; label: string };
};

/** One contribution as a printed ticket: a coloured stub on the left, the details, and a stamp once done. */
function TicketRow({ category, kindLabel, station, header, status, notes, quote, stamped, action }: RowProps) {
  const style = categoryStyle[category];
  const Icon = style.icon;
  const info = categoryInfo(category);

  return (
    <li className="relative flex overflow-hidden rounded-xl border border-hairline bg-ivory shadow-float">
      {/* Stub */}
      <div className={cn("flex w-11 shrink-0 flex-col items-center justify-center gap-1 border-r border-dashed border-graphite/15 sm:w-14", style.soft)}>
        <Icon className={cn("size-4", style.text)} aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className={cn("text-[0.7rem] font-semibold", style.text)}>{kindLabel ?? info.label}</p>
          <h3 className="font-serif text-lg leading-tight font-semibold">{station}</h3>
          {header && <p className="line-clamp-2 text-sm text-graphite/80">{header}</p>}
          {quote && <blockquote className="line-clamp-3 border-l-2 border-graphite/15 pl-2.5 font-serif text-sm text-graphite/75 italic">“{quote}”</blockquote>}
          <p className="pt-0.5 font-mono text-[0.62rem] tracking-wide text-taupe uppercase">{status}</p>
          {notes.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {notes.map((note) => (
                <li key={note} className="rounded-full bg-stone px-2 py-0.5 text-[0.68rem] text-taupe">
                  {note}
                </li>
              ))}
            </ul>
          )}
          {action && (
            <Link href={action.href} className="inline-flex items-center gap-1 pt-1 text-xs font-medium underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
              {action.label} <ArrowRight className="size-3" aria-hidden />
            </Link>
          )}
        </div>
        {stamped && (
          <Stamp
            size="sm"
            top={info.stamp}
            middle={category === "verify" ? "Checked" : "Done"}
            tone={cn(style.text, style.border)}
            className="mt-1 max-sm:hidden"
          />
        )}
      </div>
    </li>
  );
}
