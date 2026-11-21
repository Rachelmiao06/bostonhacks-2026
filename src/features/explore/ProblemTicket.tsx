"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { Marker } from "@/lib/map";
import { Stamp } from "@/components/shared/stamp";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryOf, categoryStyle } from "./category";
import { content, kindLabels, type Landmark } from "./content";
import { TicketHint } from "./Hints";
import type { SubwayLine, SubwayStation } from "./types";

type Props = {
  station: SubwayStation;
  lines: SubwayLine[];
  /** Open problems at this stop, most urgent first. Empty for a quiet stop. */
  quests: Quest[];
  index: number;
  onIndex: (index: number) => void;
  done: ReadonlySet<string>;
  landmark?: Landmark;
  /** The map's current landmark scale: a pixel landmark grows with zoom, so the ticket floats above it by the same amount. */
  landmarkScale?: number;
  /** Wide screens pin the ticket above the stop; phones dock it at the bottom. */
  docked: boolean;
  onContribute: (quest: Quest) => void;
  onClose: () => void;
};

/**
 * A printed ticket for one stop: its open MBTA problems, one at a time, and what the rider can do.
 * Pinned above the stop on wide screens, docked at the bottom on phones.
 */
export function ProblemTicket(props: Props) {
  const ticket = <TicketCard {...props} />;
  if (props.docked) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto w-full max-w-md">{ticket}</div>
      </div>
    );
  }
  return (
    // A pixel landmark stands on its stop, so its ticket floats above the building instead of over it.
    <Marker
      longitude={props.station.longitude}
      latitude={props.station.latitude}
      anchor="bottom"
      offset={[0, props.landmark?.pixel ? -Math.round(93 * (props.landmarkScale ?? 1) + 30) : -48]}
      style={{ zIndex: 10 }}
    >
      {ticket}
    </Marker>
  );
}

/** Easing in 9 hard steps, so a reveal moves like a pixel printer instead of a smooth slide. */
const PIXEL_STEPS = (t: number) => Math.ceil(t * 9) / 9;

function TicketCard({ station, lines, quests, index, onIndex, done, landmark, docked, onContribute, onClose }: Props) {
  const quest = quests[index];
  const stationLines = lines.filter((line) => station.lineIds.includes(line.id));
  // PROTOTYPE reveal: on the map, the ticket "prints" upward out of its stop in pixel-sized steps.
  const reduce = useReducedMotion() ?? false;
  const printOut = !docked && !reduce;

  return (
    <motion.article
      key={station.id}
      aria-label={station.name}
      initial={
        printOut
          ? { opacity: 1, clipPath: "inset(100% -40% -40% -40% round 12px)", y: 6 }
          : { opacity: 0, y: docked ? 24 : 10, scale: docked ? 1 : 0.96 }
      }
      animate={printOut ? { opacity: 1, clipPath: "inset(-40% -40% -40% -40% round 12px)", y: 0 } : { opacity: 1, y: 0, scale: 1 }}
      transition={
        printOut
          ? { clipPath: { duration: 0.45, ease: PIXEL_STEPS }, y: { type: "spring", stiffness: 300, damping: 26 } }
          : { type: "spring", stiffness: 300, damping: 26 }
      }
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "relative cursor-default overflow-visible rounded-xl border border-hairline bg-ivory font-ui text-graphite shadow-ticket",
        docked ? "w-full" : "w-[19.5rem]",
      )}
    >
      {/* Stub: issuer, position, close */}
      <header className="flex items-center justify-between gap-2 px-4 pt-3 font-mono text-[0.6rem] tracking-[0.14em] text-taupe uppercase">
        <span>{content.ticket.issuer}</span>
        <span className="flex items-center gap-0.5">
          {quests.length > 1 && (
            <>
              <IconButton label={content.ticket.prev} disabled={index === 0} onClick={() => onIndex(index - 1)}>
                <ChevronLeft className="size-3.5" />
              </IconButton>
              <span className="tabular-nums">{content.ticket.number(index + 1, quests.length)}</span>
              <IconButton label={content.ticket.next} disabled={index === quests.length - 1} onClick={() => onIndex(index + 1)}>
                <ChevronRight className="size-3.5" />
              </IconButton>
            </>
          )}
          <IconButton label={content.close} onClick={onClose}>
            <X className="size-3.5" />
          </IconButton>
        </span>
      </header>

      <div className="px-4 pt-1 pb-3">
        <h2 className="font-serif text-[1.35rem] leading-tight font-semibold tracking-tight">{station.name}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-taupe">
          {stationLines.map((line) => (
            <span key={line.id} className="flex items-center gap-1.5">
              {/* Line colour comes from the MBTA API, not typed in. */}
              <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: line.color }} />
              {line.name}
            </span>
          ))}
          {landmark && <span>· {content.ticket.landmark(landmark.name)}</span>}
        </div>
      </div>

      <Perforation />

      <AnimatePresence mode="wait" initial={false}>
        {quest ? (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <ProblemBody quest={quest} done={done.has(quest.id)} onContribute={onContribute} />
          </motion.div>
        ) : (
          <p className="px-4 pt-3 pb-4 text-sm text-taupe">{content.ticket.nothingHere}</p>
        )}
      </AnimatePresence>

      {/* Tail pointing at the stop (pinned tickets only) */}
      {!docked && (
        <span aria-hidden className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-r border-b border-hairline bg-ivory" />
      )}
    </motion.article>
  );
}

function ProblemBody({ quest, done, onContribute }: { quest: Quest; done: boolean; onContribute: (quest: Quest) => void }) {
  const category = categoryOf(quest);
  const style = categoryStyle[category];
  const Icon = style.icon;
  const verify = quest.mode === "verify";
  // MBTA headers often start with the unit name; only print it separately when they do not.
  const showFacility = quest.facilityName && !quest.header.startsWith(quest.facilityName);

  return (
    <div className="px-4 pt-3 pb-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", style.soft, style.text)}>
            <Icon className="size-3.5" aria-hidden />
            {verify ? categoryInfo("verify").label : kindLabels[quest.kind]}
          </p>
          {showFacility && <p className="text-sm leading-snug font-semibold">{quest.facilityName}</p>}
          <p className="line-clamp-3 text-sm leading-snug text-graphite/85">{quest.header}</p>
        </div>
        {done ? (
          <Stamp
            size="sm"
            top={categoryInfo(category).stamp}
            middle={verify ? content.ticket.stampChecked : content.ticket.stampDone}
            tone={cn(style.text, style.border)}
            className="mt-1"
          />
        ) : (
          <span
            aria-hidden
            className={cn(
              "mt-1 grid size-14 shrink-0 -rotate-12 place-items-center rounded-full border-2 border-dashed font-mono text-[0.6rem] font-semibold opacity-70",
              style.text,
              style.border,
            )}
          >
            +{quest.rewardTokens}
          </span>
        )}
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.62rem] tracking-wide text-taupe uppercase">
        <div>
          <dt className="sr-only">Status</dt>
          <dd>{verify ? content.ticket.fixedAgo : content.ticket.openFor(quest.daysOpen)}</dd>
        </div>
        {quest.failuresLast90Days !== undefined && (
          <div>
            <dt className="sr-only">History</dt>
            <dd>{content.ticket.failures(quest.failuresLast90Days)}</dd>
          </div>
        )}
        <div>
          <dt className="sr-only">Reward</dt>
          <dd>{content.ticket.reward(quest.rewardTokens)}</dd>
        </div>
      </dl>

      {!done && <TicketHint verify={verify} className="mt-3.5" />}

      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => onContribute(quest)}
          className="cursor-pointer rounded-full bg-graphite px-4 py-2 text-sm font-medium text-ivory outline-none transition-opacity hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/30"
        >
          {done ? content.ticket.seeYours : verify ? content.ticket.verify : content.ticket.report}
        </button>
        <a
          href={quest.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-taupe underline decoration-hairline underline-offset-4 hover:text-graphite"
        >
          {content.ticket.source} <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>

      <p className="mt-3 text-[0.68rem] text-taupe">{content.ticket.unofficial}</p>
    </div>
  );
}

/** Dashed tear line with a notch punched from each edge. */
function Perforation() {
  return (
    <div aria-hidden className="relative border-t border-dashed border-graphite/20">
      <span className="absolute top-0 -left-2 size-4 -translate-y-1/2 rounded-full border-r border-hairline bg-stone" />
      <span className="absolute top-0 -right-2 size-4 -translate-y-1/2 rounded-full border-l border-hairline bg-stone" />
    </div>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-6 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
