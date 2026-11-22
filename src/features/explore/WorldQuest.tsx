"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { text as missionText } from "@/features/missions/content";
import { PixelIcon } from "@/features/missions/PixelIcon";
import { templateFor } from "@/features/missions/templates";
import { cn } from "@/lib/utils";
import { categoryOf, categoryStyle } from "./category";
import { content, world } from "./content";
import { primaryClass, primaryStyle } from "./glass";
import { firstGlow, TicketHint, useFirstTicket } from "./Hints";
import { useMyProgress } from "./progress";
import { prefersReducedMotion } from "./world";

type Props = {
  quests: Quest[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  /** Opens the guided mission in the side panel. */
  onFullForm: (quest: Quest) => void;
};

/**
 * The mission teaser inside the little world: the same small glass card as on the city map.
 * "View mission" opens the guided mission (features/missions) in the side panel.
 */
export function WorldQuest({ quests, index, onIndex, onClose, onFullForm }: Props) {
  const quest = quests[Math.min(index, quests.length - 1)];
  const root = useRef<HTMLElement>(null);
  const progress = useMyProgress();
  const doneIds = progress.status === "ready" ? progress.done : new Set<string>();
  // First ticket ever? Decided once when the bubble opens (a hook, so it sits above the early return).
  const firstTicket = useFirstTicket();

  // Slides up from the bottom of the screen.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    // fromTo (not from) so React's double-run of effects in development cannot leave it half-hidden.
    const tween = gsap.fromTo(
      root.current,
      { y: 48, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" },
    );
    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!quest) return null;
  const category = categoryOf(quest);
  const style = categoryStyle[category];
  const template = templateFor(quest);
  const done = doneIds.has(quest.id);

  return (
    <section
      ref={root}
      aria-label={quest.stationName}
      className="fixed inset-x-2 bottom-2 z-[45] flex max-h-[72dvh] flex-col overflow-hidden rounded-3xl border border-ivory/90 bg-linear-to-b from-ivory/95 via-ivory/88 to-ivory/78 font-ui text-graphite shadow-[inset_0_1px_0_var(--color-ivory),var(--shadow-ticket)] backdrop-blur-2xl backdrop-saturate-150 sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-[min(26rem,calc(100vw-2rem))] sm:-translate-x-1/2"
    >
      <header className="flex shrink-0 items-center gap-2 px-4 pt-3">
        <h3 className="min-w-0 flex-1 truncate font-serif text-base font-semibold">{quest.stationName}</h3>
        {quests.length > 1 && (
          <div className="flex items-center gap-0.5 text-xs text-taupe">
            <button
              type="button"
              aria-label={content.ticket.prev}
              disabled={index === 0}
              onClick={() => onIndex(index - 1)}
              className="grid size-7 cursor-pointer place-items-center rounded-full outline-none hover:bg-stone-deep/60 focus-visible:ring-2 focus-visible:ring-graphite/25 disabled:opacity-30"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="tabular-nums">{content.ticket.number(index + 1, quests.length)}</span>
            <button
              type="button"
              aria-label={content.ticket.next}
              disabled={index >= quests.length - 1}
              onClick={() => onIndex(index + 1)}
              className="grid size-7 cursor-pointer place-items-center rounded-full outline-none hover:bg-stone-deep/60 focus-visible:ring-2 focus-visible:ring-graphite/25 disabled:opacity-30"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        )}
        <button
          type="button"
          aria-label={world.close}
          onClick={onClose}
          className="grid size-8 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/25"
        >
          <X className="size-4" aria-hidden />
        </button>
      </header>

      <div className="space-y-2 px-4 pt-1 pb-4">
        <p className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", style.soft, style.text)}>
          <PixelIcon name={template.icon} className="size-3.5" />
          {template.chip}
        </p>
        <p className="font-serif text-[1.15rem] leading-snug font-semibold">{template.title}</p>
        <p className="text-sm leading-snug text-taupe">{template.task}</p>
        <TicketHint show={firstTicket && !done} />
        <button
          type="button"
          onClick={() => onFullForm(quest)}
          style={primaryStyle}
          className={cn(primaryClass, "mt-1 h-11 w-full px-5 text-[0.95rem]", !done && firstTicket && firstGlow)}
        >
          {done ? missionText.seeYours : missionText.viewMission} <span aria-hidden>→</span>
        </button>
        <p className="text-xs text-taupe">{missionText.community}</p>
      </div>
    </section>
  );
}
