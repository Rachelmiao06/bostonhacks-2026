"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryOf, categoryStyle } from "./category";
import { content, kindLabels } from "./content";
import { ReportFlow } from "./ReportFlow";
import { Eyebrow } from "./ui";
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

  return (
    <>
      {/* Grab handle on phones, then the top bar */}
      <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-stone-deep sm:hidden" />
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-hairline px-3 py-2 font-ui">
        <Dialog.Close className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/25">
          <ArrowLeft className="size-3.5" aria-hidden /> {content.panel.back}
        </Dialog.Close>
        {/* The same quest on its own page, so it can be shared. Swap for challengeHref() once PR #12 lands. */}
        <Link
          href={`/challenges/${encodeURIComponent(quest.id)}`}
          className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/25"
        >
          {content.panel.fullPage} <ExternalLink className="size-3" aria-hidden />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* The ticket header: what this problem is */}
        <header className="space-y-3 px-5 pt-5 pb-4 font-ui">
          <p className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", style.soft, style.text)}>
            <Icon className="size-3.5" aria-hidden />
            {verify ? categoryInfo("verify").label : kindLabels[quest.kind]}
          </p>
          <Dialog.Title className="font-serif text-[1.65rem] leading-tight font-semibold tracking-tight">{quest.stationName}</Dialog.Title>
          <p className="text-xs text-taupe">{content.panel.lines(quest.lines)}</p>

          <div className="space-y-1.5 rounded-xl border border-hairline bg-stone p-3.5">
            <Eyebrow>{content.panel.alert}</Eyebrow>
            <Dialog.Description className="text-sm leading-relaxed">{quest.header}</Dialog.Description>
            <a
              href={quest.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-taupe underline decoration-hairline underline-offset-4 hover:text-graphite"
            >
              {content.ticket.source} <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>

          <dl className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.62rem] tracking-wide text-taupe uppercase">
            <dd>{verify ? content.ticket.fixedAgo : content.ticket.openFor(quest.daysOpen)}</dd>
            {quest.failuresLast90Days !== undefined && <dd>{content.ticket.failures(quest.failuresLast90Days)}</dd>}
            <dd>{content.ticket.reward(quest.rewardTokens)}</dd>
          </dl>
          <p className="text-xs leading-relaxed text-taupe">{content.panel.community}</p>
        </header>

        <div className="relative border-t border-dashed border-graphite/20" aria-hidden>
          <span className="absolute top-0 -left-2 size-4 -translate-y-1/2 rounded-full border-r border-hairline bg-stone" />
          <span className="absolute top-0 -right-2 size-4 -translate-y-1/2 rounded-full border-l border-hairline bg-stone" />
        </div>

        <div className="px-5 pt-5 pb-8">
          {verify ? <VerifyFlow quest={quest} onDone={onClose} /> : <ReportFlow quest={quest} onDone={onClose} />}
        </div>
      </div>
    </>
  );
}
