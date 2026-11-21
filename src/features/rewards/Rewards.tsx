"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { QuestKind } from "@/lib/mbta";
import { PixelTrain } from "@/components/shared/pixel-train";
import { Stamp } from "@/components/shared/stamp";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryStyle } from "@/features/explore/category";
import { categories, categoryOfKind, type CategoryId } from "@/features/explore/content";
import { stampCount, useMyProgress, type MyProgress } from "@/features/explore/progress";
import { content } from "./content";

type EarnedStamp = { id: string; category: CategoryId; station: string; date: string; verify: boolean };

/** Turns real completions and verifications into stamps, newest first. */
function stampsOf(data: MyProgress): EarnedStamp[] {
  const reports = data.submissions
    .filter((s) => s.status === "completed")
    .map((s) => ({
      id: `r-${s.alert_id}`,
      category: categoryOfKind[(s.kind ?? "station") as QuestKind] ?? "station",
      station: s.station_name ?? "",
      date: s.completed_at ?? s.updated_at,
      verify: false,
    }));
  const checks = data.verifications.map((v) => ({
    id: `v-${v.alert_id}`,
    category: "verify" as const,
    station: v.station_name,
    date: v.created_at,
    verify: true,
  }));
  return [...reports, ...checks].sort((a, b) => b.date.localeCompare(a.date));
}

const TILTS = ["rotate-[-10deg]", "rotate-[6deg]", "rotate-[-3deg]", "rotate-[9deg]", "rotate-[-7deg]"];
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** The rider's collection: a token total and a page of stamps, all from GET /api/submissions. */
export function Rewards() {
  const progress = useMyProgress();

  return (
    <article className="rounded-3xl border border-hairline bg-stone p-5 font-ui text-graphite shadow-ticket sm:p-8">
      <header className="space-y-1.5 border-b border-hairline pb-5">
        <p className="font-mono text-[0.65rem] tracking-[0.16em] text-taupe uppercase">{content.eyebrow}</p>
        <h1 className="font-serif text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{content.title}</h1>
      </header>

      {progress.status === "loading" && <p className="pt-6 text-sm text-taupe">{content.loading}</p>}
      {progress.status === "unavailable" && (
        <p role="alert" className="pt-6 text-sm text-taupe">
          {content.unavailable}
        </p>
      )}
      {progress.status === "ready" && <Collection data={progress.data} />}
    </article>
  );
}

function Collection({ data }: { data: MyProgress }) {
  const stamps = stampsOf(data);
  const count = stampCount(data);
  const tally = categories.map((c) => ({ ...c, n: stamps.filter((s) => s.category === c.id).length })).filter((c) => c.n > 0);

  return (
    <div className="space-y-8 pt-6">
      {/* Token total, printed like the fare on a ticket */}
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-hairline bg-ivory p-5 shadow-float">
        <div className="space-y-1">
          <p className="flex items-baseline gap-2">
            <span className="font-serif text-5xl leading-none font-semibold tabular-nums">{data.tokenBalance}</span>
            <span className="font-pixel text-[0.6rem] text-taupe">{content.tokensLabel}</span>
          </p>
          <p className="max-w-md text-xs text-taupe">{content.tokensNote}</p>
        </div>
        <div className="flex items-center gap-2">
          <PixelTrain size={44} body="fill-cat-verify" />
          <span className="font-pixel text-[0.55rem] text-graphite">{content.stampsCount(count)}</span>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold">{content.stampsTitle}</h2>
          {tally.length > 0 && (
            <ul aria-label={content.byCategory} className="flex flex-wrap gap-1.5">
              {tally.map((c) => (
                <li key={c.id} className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium", categoryStyle[c.id].soft, categoryStyle[c.id].text)}>
                  {c.label} <span className="font-mono tabular-nums">{c.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {stamps.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-graphite/20 px-4 py-10 text-center">
            <span className="grid size-24 -rotate-12 place-items-center rounded-full border-2 border-dashed border-graphite/25 font-mono text-[0.6rem] tracking-widest text-taupe uppercase">
              {content.nextTitle}
            </span>
            <h3 className="font-serif text-lg font-semibold">{content.emptyTitle}</h3>
            <p className="max-w-sm text-sm text-taupe">{content.emptyBody}</p>
            <CtaLink />
          </div>
        ) : (
          // A sheet of paper with stamps pressed on at slightly different angles.
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border border-hairline bg-ivory p-5 sm:grid-cols-4 sm:p-7">
            {stamps.map((stamp, i) => {
              const style = categoryStyle[stamp.category];
              return (
                <li key={stamp.id} className="grid place-items-center">
                  <Stamp
                    size="lg"
                    top={categoryInfo(stamp.category).stamp}
                    middle={stamp.station}
                    bottom={shortDate(stamp.date)}
                    tone={cn(style.text, style.border)}
                    className={TILTS[i % TILTS.length]}
                  />
                </li>
              );
            })}
            {/* One open slot, so the sheet always invites the next stamp */}
            <li className="grid place-items-center">
              <Link
                href="/"
                className="grid size-28 rotate-6 place-items-center rounded-full border-2 border-dashed border-graphite/20 p-3 text-center font-mono text-[0.58rem] leading-snug tracking-widest text-taupe uppercase outline-none hover:border-graphite/40 hover:text-graphite focus-visible:ring-4 focus-visible:ring-graphite/20"
              >
                {content.nextTitle}
                <br />
                {content.nextBody}
              </Link>
            </li>
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="max-w-md text-xs text-taupe">{content.honest}</p>
        {stamps.length > 0 && (
          <Link href="/my-challenges" className="inline-flex items-center gap-1 text-xs font-medium underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
            {content.journey} <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}

function CtaLink() {
  return (
    <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-full bg-graphite px-5 text-sm font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25">
      {content.cta} <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}
