"use client";

import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Coin } from "@/components/shared/coin";
import { flow } from "./content";

type Props = {
  tokens: number;
  already: boolean;
  /** Report quests save "opened the MBTA page"; verify quests have nowhere to save it. */
  handedOff?: boolean;
  onHandOff?: () => void;
  extra?: React.ReactNode;
};

// Shown after a quest is done. Movement only with motion allowed; Reduced Motion gets a still card.
export function RewardCard({ tokens, already, handedOff, onHandOff, extra }: Props) {
  return (
    <section role="status" className="space-y-4 rounded-2xl border-2 border-ink bg-leaf p-5 text-ink shadow-tile">
      <div className="flex items-center gap-4">
        <span className="relative grid place-items-center">
          <span aria-hidden className="absolute size-16 rounded-full bg-sun/60 motion-safe:animate-ping motion-safe:[animation-iteration-count:3] motion-reduce:hidden" />
          <Coin size={56} className="relative motion-reduce:animate-none" />
        </span>
        <div>
          <h2 className="flex items-center gap-2 font-heading text-2xl font-bold">
            {already ? flow.alreadyDone : flow.doneTitle}
            <Sparkles aria-hidden className="size-5 motion-safe:animate-pulse" />
          </h2>
          {!already && <p className="font-pixel text-sm leading-relaxed">{flow.tokensEarned(tokens)}</p>}
        </div>
      </div>

      {extra}
      <p className="font-bold">{flow.doneBody}</p>

      <div className="space-y-2">
        <a
          href={flow.mbtaUrl}
          target="_blank"
          rel="noreferrer"
          onClick={onHandOff}
          className="inline-flex items-center gap-1.5 font-bold underline underline-offset-4"
        >
          {flow.tellMbta} <ExternalLink className="size-4" aria-hidden />
        </a>
        <p className="text-sm">{handedOff ? flow.tellMbtaSaved : flow.tellMbtaHelp}</p>
      </div>

      <Button render={<Link href="/explore" />} nativeButton={false} variant="outline">
        {flow.backToExplore}
      </Button>
    </section>
  );
}
