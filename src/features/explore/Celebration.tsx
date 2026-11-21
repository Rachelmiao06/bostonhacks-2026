"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ExternalLink } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { PixelTrain } from "@/components/shared/pixel-train";
import { Stamp } from "@/components/shared/stamp";
import { flow } from "@/features/challenge/content";
import { cn } from "@/lib/utils";
import { unlockTiers } from "@/features/island/content";
import { categoryInfo, categoryOf, categoryStyle } from "./category";
import { content } from "./content";
import { stampCount, useMyProgress } from "./progress";
import { AtlasButton } from "./ui";

type Props = {
  quest: Quest;
  /** The server's reward for this contribution. Kept for callers; My World shows island growth, not a balance. */
  tokens?: number;
  /** Finished on an earlier visit: no fanfare, just the stamp. */
  already: boolean;
  /** Report quests can save "opened the MBTA page"; verify quests have nowhere to save it. */
  handedOff?: boolean;
  onHandOff?: () => void;
  extra?: React.ReactNode;
  onDone: () => void;
};

/**
 * After a contribution: a tiny pixel train pulls in along a track, the ticket gets stamped,
 * a few pixel sparks pop. About 1.5 seconds. With Reduced Motion, everything is simply there.
 */
export function Celebration({ quest, already, handedOff, onHandOff, extra, onDone }: Props) {
  const reduce = useReducedMotion() ?? false;
  const animate = !reduce && !already;
  const category = categoryOf(quest);
  const style = categoryStyle[category];
  const info = categoryInfo(category);
  const ref = useRef<HTMLElement>(null);
  // The stamp count comes from the server (the same store the pins and the island read); nothing is counted here.
  const progress = useMyProgress();
  const stamps = progress.status === "ready" ? stampCount(progress.data) : null;
  const piece = !already && stamps !== null && stamps >= 1 && stamps <= unlockTiers.length ? unlockTiers[stamps - 1] : null;

  // The panel may be scrolled down to the buttons: bring the stamp into view.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);

  return (
    <section ref={ref} role="status" aria-live="polite" className="scroll-mt-4 space-y-5 font-ui">
      {/* The scene: track, train, stamp */}
      <div className={cn("relative h-36 overflow-hidden rounded-xl border border-hairline", style.soft)}>
        <span aria-hidden className="absolute inset-x-0 bottom-7 border-t-2 border-dashed border-graphite/20" />
        <motion.div
          aria-hidden
          className="absolute bottom-7"
          initial={animate ? { left: "-20%" } : false}
          animate={{ left: "8%" }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.3, 1] }}
        >
          <motion.div animate={animate ? { y: [0, -1.5, 0] } : undefined} transition={{ duration: 0.25, repeat: 4 }}>
            <PixelTrain size={88} body={style.fill} />
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute top-1/2 right-6 -translate-y-1/2"
          initial={animate ? { scale: 2.4, opacity: 0, rotate: 12 } : false}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: animate ? 0.9 : 0, type: "spring", stiffness: 420, damping: 16 }}
        >
          <Stamp size="lg" top={info.stamp} middle={quest.mode === "verify" ? content.ticket.stampChecked : content.ticket.stampDone} bottom={quest.stationName} tone={cn(style.text, style.border, "bg-ivory/70")} />
        </motion.div>

        {animate &&
          [
            { x: "62%", y: "22%", d: 1.05 },
            { x: "88%", y: "16%", d: 1.12 },
            { x: "70%", y: "78%", d: 1.18 },
            { x: "94%", y: "70%", d: 1.1 },
          ].map((spark) => (
            <motion.span
              key={`${spark.x}${spark.y}`}
              aria-hidden
              className="absolute size-1.5 bg-sun"
              style={{ left: spark.x, top: spark.y }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
              transition={{ delay: spark.d, duration: 0.6 }}
            />
          ))}
      </div>

      <div className="space-y-1.5">
        <h3 className="font-serif text-2xl leading-tight font-semibold tracking-tight">
          {already ? content.celebrate.already : content.celebrate.title}
        </h3>
        {piece && stamps !== null && (
          <p className="flex items-start gap-2 rounded-xl border border-hairline bg-ivory px-3 py-2 text-sm">
            <span aria-hidden className="mt-1 size-2 shrink-0 rotate-45 bg-cat-station" />
            <span className="block font-medium">{content.celebrate.newPiece(piece.name)}</span>
          </p>
        )}
      </div>

      {extra}

      <p className="rounded-xl border border-hairline bg-stone px-3.5 py-2.5 text-sm font-medium">{content.celebrate.honest}</p>

      <div className="space-y-1">
        <a
          href={flow.mbtaUrl}
          target="_blank"
          rel="noreferrer"
          onClick={onHandOff}
          className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite"
        >
          {flow.tellMbta} <ExternalLink className="size-3.5" aria-hidden />
        </a>
        <p className="text-xs text-taupe">{handedOff ? flow.tellMbtaSaved : flow.tellMbtaHelp}</p>
      </div>

      {/* Stays at the bottom of the panel while the rest scrolls, so both choices are always in view. */}
      <div className="sticky bottom-2 z-10 flex flex-wrap gap-2 rounded-xl border border-hairline bg-ivory/95 p-2 shadow-float backdrop-blur-sm">
        <AtlasButton onClick={onDone}>{content.celebrate.another}</AtlasButton>
        <Link
          href="/world"
          className="inline-flex h-10 items-center rounded-full border border-graphite/25 px-4 text-sm font-medium outline-none hover:bg-stone focus-visible:ring-4 focus-visible:ring-graphite/25"
        >
          {content.celebrate.collection}
        </Link>
      </div>
    </section>
  );
}
