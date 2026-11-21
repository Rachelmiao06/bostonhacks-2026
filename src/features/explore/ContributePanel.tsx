"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, ChevronDown, Clock, ExternalLink, Info, RotateCcw, TriangleAlert } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { challengeHref } from "@/features/challenge/links";
import { categoryInfo, categoryOf, categoryStyle } from "./category";
import { content, kindLabels } from "./content";
import { ReportFlow } from "./ReportFlow";
import { VerifyFlow } from "./VerifyFlow";

type Props = {
  quest: Quest | null;
  onClose: () => void;
};

/**
 * Contribute without leaving the map: a panel on the right on wide screens, a bottom sheet on phones.
 * The map stays visible behind it. Report quests go through the AI check; verify quests are one tap.
 */
export function ContributePanel({ quest, onClose }: Props) {
  return (
    <Dialog.Root open={quest !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-graphite/20 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 sm:bg-graphite/5" />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl border border-hairline bg-ivory text-graphite shadow-ticket outline-none",
            "transition-transform duration-300 ease-out data-ending-style:translate-y-full data-starting-style:translate-y-full",
            "sm:inset-x-auto sm:top-2 sm:right-2 sm:bottom-2 sm:max-h-none sm:w-[27rem] sm:rounded-2xl",
            "sm:data-ending-style:translate-x-[110%] sm:data-ending-style:translate-y-0 sm:data-starting-style:translate-x-[110%] sm:data-starting-style:translate-y-0",
          )}
        >
          {quest && <PanelBody key={quest.id} quest={quest} onClose={onClose} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PanelBody({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const category = categoryOf(quest);
  const style = categoryStyle[category];
  const Icon = style.icon;
  const verify = quest.mode === "verify";
  const kind = verify ? categoryInfo("verify").label : kindLabels[quest.kind];

  return (
    <>
      {/* Grab handle on phones */}
      <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-stone-deep sm:hidden" />
      {/* Two quiet icons. Their words are kept for screen readers. */}
      <div className="flex shrink-0 items-center justify-between px-2 pt-1 font-ui">
        <Dialog.Close
          aria-label={content.panel.back}
          className="grid size-10 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/40"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Dialog.Close>
        {/* The same quest on its own page, so it can be shared. */}
        <Link
          href={challengeHref(quest.id)}
          aria-label={content.panel.fullPage}
          className="grid size-10 place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/40"
        >
          <ExternalLink className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* What this problem is: an icon, the place, and one short line */}
        <header className="space-y-3 px-5 pt-1 pb-4 font-ui">
          <div className="flex items-start gap-3">
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", style.soft, style.text)}>
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <Dialog.Title className="font-serif text-[1.6rem] leading-tight font-semibold tracking-tight">{quest.stationName}</Dialog.Title>
              <p className="text-xs text-taupe">
                {kind}
                {quest.lines.length > 0 && <> · {content.panel.lines(quest.lines)}</>}
              </p>
            </div>
          </div>

          {/* The MBTA's own words, two lines. Tap for the whole alert, the source and the longer note. */}
          <details className="group rounded-xl border border-hairline bg-stone">
            <summary className="flex cursor-pointer list-none items-start gap-2.5 p-3 outline-none focus-visible:ring-2 focus-visible:ring-graphite/40 [&::-webkit-details-marker]:hidden">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-taupe" aria-hidden />
              <Dialog.Description render={<span />} className="line-clamp-2 flex-1 text-sm leading-snug group-open:line-clamp-none">
                {quest.header}
              </Dialog.Description>
              <ChevronDown className="mt-0.5 size-4 shrink-0 text-taupe transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="space-y-2 border-t border-hairline px-3 py-2.5 text-xs leading-relaxed text-taupe">
              <p>{content.panel.community}</p>
              <a
                href={quest.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium underline decoration-hairline underline-offset-4 hover:text-graphite"
              >
                {content.ticket.source} <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
          </details>

          {/* Days open, repeat count: icons and numbers. The full phrases are for screen readers. */}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.72rem] text-taupe">
            {!verify && (
              <li className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                <span aria-hidden>{quest.daysOpen < 1 ? "0d" : `${quest.daysOpen}d`}</span>
                <span className="sr-only">{content.ticket.openFor(quest.daysOpen)}</span>
              </li>
            )}
            {quest.failuresLast90Days !== undefined && quest.failuresLast90Days > 1 && (
              <li className="inline-flex items-center gap-1">
                <RotateCcw className="size-3.5" aria-hidden />
                <span aria-hidden>{quest.failuresLast90Days}×</span>
                <span className="sr-only">{content.ticket.failures(quest.failuresLast90Days)}</span>
              </li>
            )}
          </ul>

          {/* Kept visible and short: this is not an MBTA request. */}
          <p className="flex items-center gap-1.5 text-[0.7rem] text-taupe">
            <Info className="size-3 shrink-0" aria-hidden /> {content.ticket.unofficial}
          </p>
        </header>

        <div className="relative border-t border-dashed border-graphite/20" aria-hidden>
          <span className="absolute top-0 -left-2 size-4 -translate-y-1/2 rounded-full border-r border-hairline bg-stone" />
          <span className="absolute top-0 -right-2 size-4 -translate-y-1/2 rounded-full border-l border-hairline bg-stone" />
        </div>

        <div className="px-5 pt-4 pb-8">
          {verify ? <VerifyFlow quest={quest} onDone={onClose} /> : <ReportFlow quest={quest} onDone={onClose} />}
        </div>
      </div>
    </>
  );
}
