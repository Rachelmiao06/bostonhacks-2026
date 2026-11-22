"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { Marker } from "@/lib/map";
import { Stamp } from "@/components/shared/stamp";
import { cn } from "@/lib/utils";
import { PixelIcon } from "@/features/missions/PixelIcon";
import { templateFor } from "@/features/missions/templates";
import { text as missionText } from "@/features/missions/content";
import { categoryInfo, categoryOf, categoryStyle } from "./category";
import { content, type Landmark } from "./content";
import { firstGlow, TicketHint, useFirstTicket } from "./Hints";
import { primaryClass, primaryStyle } from "./glass";
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
    <Marker
      longitude={props.station.longitude}
      latitude={props.station.latitude}
      anchor="bottom"
      offset={[0, -48]}
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
  // PROTOTYPE reveal: on the map, the card "prints" upward out of its stop in pixel-sized steps.
  const reduce = useReducedMotion() ?? false;
  const printOut = !docked && !reduce;

  return (
    <motion.article
      key={station.id}
      aria-label={station.name}
      initial={
        printOut
          ? { opacity: 1, clipPath: "inset(100% -40% -40% -40% round 24px)", y: 6 }
          : { opacity: 0, y: docked ? 24 : 10, scale: docked ? 1 : 0.96 }
      }
      animate={printOut ? { opacity: 1, clipPath: "inset(-40% -40% -40% -40% round 24px)", y: 0 } : { opacity: 1, y: 0, scale: 1 }}
      transition={
        printOut
          ? { clipPath: { duration: 0.45, ease: PIXEL_STEPS }, y: { type: "spring", stiffness: 300, damping: 26 } }
          : { type: "spring", stiffness: 300, damping: 26 }
      }
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "relative cursor-default overflow-hidden rounded-3xl border border-ivory/90 bg-linear-to-b from-ivory/95 via-ivory/88 to-ivory/78 font-ui text-graphite shadow-[inset_0_1px_0_var(--color-ivory),var(--shadow-ticket)] backdrop-blur-2xl backdrop-saturate-150",
        docked ? "w-full" : "w-[19.5rem]",
      )}
    >
      <header className="flex items-center justify-between gap-2 px-4 pt-3">
        <h2 className="min-w-0 truncate font-serif text-[1.2rem] leading-tight font-semibold tracking-tight">{station.name}</h2>
        <span className="flex shrink-0 items-center gap-0.5 text-xs text-taupe">
          {quests.length > 1 && (
            <>
              <IconButton label={content.ticket.prev} disabled={index === 0} onClick={() => onIndex(index - 1)}>
                <ChevronLeft className="size-4" />
              </IconButton>
              <span className="tabular-nums">{content.ticket.number(index + 1, quests.length)}</span>
              <IconButton label={content.ticket.next} disabled={index === quests.length - 1} onClick={() => onIndex(index + 1)}>
                <ChevronRight className="size-4" />
              </IconButton>
            </>
          )}
          <IconButton label={content.close} onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-1 text-xs text-taupe">
        {stationLines.map((line) => (
          <span key={line.id} className="flex items-center gap-1.5">
            {/* Line colour comes from the MBTA API, not typed in. */}
            <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: line.color }} />
            {line.name}
          </span>
        ))}
        {landmark && <span>· {content.ticket.landmark(landmark.name)}</span>}
      </div>

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
          <p className="px-4 pt-2 pb-4 text-sm text-taupe">{content.ticket.nothingHere}</p>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/** One problem as a mission teaser: what to check, in one line. The full alert stays one tap away in the mission. */
function ProblemBody({ quest, done, onContribute }: { quest: Quest; done: boolean; onContribute: (quest: Quest) => void }) {
  const category = categoryOf(quest);
  const style = categoryStyle[category];
  const template = templateFor(quest);
  const firstTicket = useFirstTicket();

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", style.soft, style.text)}>
            <PixelIcon name={template.icon} className="size-3.5" />
            {template.chip}
          </p>
          <p className="font-serif text-[1.05rem] leading-snug font-semibold">{template.title}</p>
          <p className="text-sm leading-snug text-taupe">{template.task}</p>
        </div>
        {done ? (
          <Stamp size="sm" top={categoryInfo(category).stamp} middle={quest.mode === "verify" ? content.ticket.stampChecked : content.ticket.stampDone} tone={cn(style.text, style.border)} className="mt-1" />
        ) : null}
      </div>

      {!done && <TicketHint show={firstTicket} className="mt-3" />}

      <button
        type="button"
        onClick={() => onContribute(quest)}
        style={primaryStyle}
        className={cn(primaryClass, "mt-3.5 h-11 w-full px-5 text-[0.95rem]", !done && firstTicket && firstGlow)}
      >
        {done ? missionText.seeYours : missionText.viewMission} <span aria-hidden>→</span>
      </button>
      <p className="mt-2.5 text-xs text-taupe">{missionText.community}</p>
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
      className="grid size-8 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
