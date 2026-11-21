"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { markLeftForIsland } from "@/features/explore/viewMemory";
import { refreshProgress, stampCount, useMyProgress, type ProgressState } from "@/features/explore/progress";
import { allowedFor, content, giftMilestones, giftStatesFor, isIn, unlockSteps, type GiftState } from "./content";
import { demoGifts } from "./gifts";
import { GiftTicket } from "./GiftTicket";
import { IslandHelp } from "./IslandHelp";
import { IslandScene } from "./IslandLoader";
import type { IslandHandle } from "./IslandScene";
import { readParcelOpened, readSeen, writeParcelOpened, writeSeen } from "./seen";

const total = unlockSteps.length;

/** What this visit shows: the opening, or the island as it was plus the pieces earned since last time dropping in. */
type Plan = { mode: "first" | "return"; known: number; earned: number; progressKnown: boolean };

function makePlan(progress: ProgressState, preview: boolean): Plan {
  // The preview shows everything, including every (demo) gift, without touching the rider's real progress.
  if (preview) return { mode: "first", known: total, earned: total, progressKnown: true };
  const seen = readSeen();
  const ready = progress.status === "ready";
  // The server's count is the truth. If it cannot be reached, show only what this browser last saw:
  // an unknown count is never treated as zero, and nothing new is granted (no new piece, no new gift).
  const earned = ready ? Math.min(stampCount(progress.data), total) : (seen ?? 0);
  if (seen === null) return { mode: "first", known: earned, earned, progressKnown: ready };
  return { mode: "return", known: Math.min(seen, earned), earned, progressKnown: ready };
}

/**
 * My World: the rider's knitted island, grown from their real contributions (the server's count, via useMyProgress),
 * and the whole screen. First visit: the yarn-ball opening. Later visits: the island is simply there, and a piece
 * earned since the last visit drops onto the island from above. Three little gifts hang from the clouds, one more
 * opening as the journey grows. Everything else is a few quiet controls at the edges.
 */
export function Island() {
  const progress = useMyProgress();
  const [preview, setPreview] = useState(false);
  // Next keeps a page mounted (hidden) after you leave it, and runs its effects again when you come back.
  // So every visit starts here: fetch the latest progress from the server, then plan the visit.
  const [visit, setVisit] = useState(0);
  const [sceneFailed, setSceneFailed] = useState(false);
  const mounted = useRef(true);

  const visitAgain = useCallback(() => {
    void refreshProgress().finally(() => mounted.current && setVisit((n) => n + 1));
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Tell the map the rider is on the island, so coming back resumes the map instead of replaying the gate.
    markLeftForIsland();
    visitAgain();
    return () => {
      mounted.current = false;
    };
  }, [visitAgain]);

  const loading = progress.status === "loading" || visit === 0;
  // The plan is made once per visit (and when the preview is toggled), not on every refresh,
  // so the scene is not rebuilt under the rider's hands.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const plan = useMemo(() => (loading ? null : makePlan(progress, preview)), [loading, preview, visit]);

  if (!plan) {
    return (
      <section className="fixed inset-0 z-30 grid place-items-center bg-stone font-pixel text-[0.6rem] text-graphite">
        {content.loading}
      </section>
    );
  }
  return (
    <IslandView
      key={`${preview}-${visit}`}
      plan={plan}
      preview={preview}
      unavailable={progress.status === "unavailable"}
      sceneFailed={sceneFailed}
      onSceneFailed={() => setSceneFailed(true)}
      onRetry={visitAgain}
      onTogglePreview={() => setPreview((p) => !p)}
    />
  );
}

function IslandView({
  plan,
  preview,
  unavailable,
  sceneFailed,
  onSceneFailed,
  onRetry,
  onTogglePreview,
}: {
  plan: Plan;
  preview: boolean;
  unavailable: boolean;
  sceneFailed: boolean;
  onSceneFailed: () => void;
  onRetry: () => void;
  onTogglePreview: () => void;
}) {
  const [phase, setPhase] = useState("ball");
  const [known, setKnown] = useState(plan.known); // journey steps on the island right now
  const [note, setNote] = useState("");
  const [ticket, setTicket] = useState<number | null>(null); // the gift whose ticket is open
  const [opened, setOpened] = useState<boolean[]>(() => demoGifts.map((g) => readParcelOpened(g.id)));
  const openedRef = useRef(opened);
  useEffect(() => {
    openedRef.current = opened;
  }, [opened]);
  const handle = useRef<IslandHandle | null>(null);
  const dropRef = useRef<(h: IslandHandle, index: number) => void>(() => {});

  // Drops the pieces of journey step `index` onto the island; when they have landed it is remembered,
  // and the next waiting step follows a moment later.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    dropRef.current = (h, index) => {
      const step = unlockSteps[index];
      if (!step || !alive.current) return;
      const before = allowedFor(index);
      const after = allowedFor(index + 1);
      const wasThere = isIn(before);
      const isThere = isIn(after);
      const landed = () => {
        if (!alive.current) return;
        writeSeen(index + 1); // remembered only once the pieces have really landed
        setKnown(index + 1);
        setNote(giftMilestones.includes(index + 1) ? `${content.grew(step.name)} ${content.giftUnlocked}` : content.grew(step.name));
        if (index + 1 < plan.earned) window.setTimeout(() => dropRef.current(h, index + 1), 1100);
      };
      // nothing new to show for this step (all its pieces are already there): move on
      if (!h.dropIn((stage, k) => isThere(stage, k) && !wasThere(stage, k), landed)) landed();
    };
  }, [plan.earned]);

  // "Your little world just grew: ..." is a passing message
  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(""), 5000);
    return () => window.clearTimeout(id);
  }, [note]);

  const onReady = useCallback(
    (h: IslandHandle) => {
      handle.current = h;
      h.setGiftStates(giftStatesFor(plan.known, openedRef.current), true);
      // pieces earned since the last visit fall onto the island, a beat after it appears
      if (!preview && plan.mode === "return" && plan.earned > plan.known) window.setTimeout(() => dropRef.current(h, plan.known), 1200);
    },
    [preview, plan],
  );

  const onPhase = useCallback(
    (p: string) => {
      setPhase(p);
      // Never record what was shown while the server could not be reached.
      if (unavailable || preview) return;
      // Unravelling folds the island into the ball; the next knit-in includes everything earned so far,
      // so a waiting piece is not lost.
      if (p === "unravel") {
        writeSeen(plan.earned);
        setKnown(plan.earned);
        setNote("");
      }
      // The first full opening has been seen: later visits skip it.
      if (p === "idle" && plan.mode === "first") writeSeen(plan.earned);
    },
    [plan, preview, unavailable],
  );

  // A gift was poked in the scene (or opened with the keyboard): show its ticket, camera held where it is.
  const onGift = useCallback((index: number, state: string) => {
    if (state === "opened") {
      writeParcelOpened(demoGifts[index].id);
      setOpened((o) => o.map((v, i) => v || i === index));
    }
    handle.current?.holdCamera(true);
    setTicket(index);
  }, []);
  const closeTicket = useCallback(() => {
    handle.current?.holdCamera(false);
    setTicket(null);
  }, []);

  // As the journey grows (a piece has landed), the gifts it unlocks wake up.
  useEffect(() => {
    handle.current?.setGiftStates(giftStatesFor(known, openedRef.current));
  }, [known]);

  const unlocked = useMemo(() => isIn(allowedFor(known)), [known]);
  const canKnit = phase === "ball" && plan.mode === "first";
  const giftStates: GiftState[] = giftStatesFor(known, opened);
  const status = sceneFailed ? { text: content.sceneFailed } : unavailable ? { text: content.progressFailed, retry: onRetry } : null;

  return (
    <section className="fixed inset-0 z-30 bg-stone font-ui text-graphite">
      <IslandScene unlocked={unlocked} instant={plan.mode === "return"} onReady={onReady} onPhase={onPhase} onGift={onGift} onFail={onSceneFailed} />

      <header className="pointer-events-none absolute top-20 left-4 max-w-[min(20rem,calc(100%-2rem))] sm:left-6">
        <h1 className="font-serif text-2xl leading-tight font-semibold tracking-tight">{content.title}</h1>
        <p className="text-xs text-taupe sm:text-sm">{preview ? content.help.previewNote : content.subtitle}</p>
      </header>

      {/* One small status at a time, never a wall of errors */}
      {status && (
        <p
          role="status"
          className="absolute top-32 left-4 z-10 flex items-center gap-2 rounded-full border border-hairline bg-ivory/90 py-1.5 pr-1.5 pl-3 text-xs text-taupe shadow-float backdrop-blur-md sm:top-20 sm:right-6 sm:left-auto"
        >
          {status.text}
          {"retry" in status && (
            <button
              type="button"
              onClick={status.retry}
              className="cursor-pointer rounded-full bg-graphite px-3 py-1 font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25"
            >
              {content.retry}
            </button>
          )}
        </p>
      )}

      {/* The knit button and the passing note, low and centred, away from the thread guide */}
      <div className="pointer-events-none absolute inset-x-16 bottom-4 flex flex-wrap items-center justify-center gap-2 sm:bottom-5">
        {note && (
          <p className="pointer-events-auto rounded-full border border-hairline bg-ivory/90 px-3.5 py-1.5 text-xs shadow-float backdrop-blur-md">{note}</p>
        )}
        {canKnit && (
          <button type="button" onClick={() => handle.current?.replay()} className={pill}>
            {content.knitButton}
          </button>
        )}
      </div>

      {/* Keyboard and screen-reader way to each gift; they show when focused */}
      {phase === "idle" && ticket === null && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-10 flex flex-col items-center gap-1 not-focus-within:sr-only">
          {demoGifts.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onGift(i, handle.current?.openGift(i) ?? "locked")}
              className="pointer-events-auto cursor-pointer rounded-full bg-graphite px-4 py-2 text-xs font-medium text-ivory shadow-float outline-none focus-visible:ring-4 focus-visible:ring-graphite/25"
            >
              {content.gift.label(i + 1, giftStates[i] === "locked")}
            </button>
          ))}
        </div>
      )}

      {ticket !== null && (
        <GiftTicket gift={demoGifts[ticket]} index={ticket} state={giftStates[ticket]} known={plan.progressKnown ? known : null} handle={handle} onClose={closeTicket} />
      )}

      <IslandHelp preview={preview} onTogglePreview={onTogglePreview} />

      <p role="status" aria-live="polite" className="sr-only">
        {note || (phase === "ball" ? content.waiting : phase === "intro" ? content.knitting : phase === "idle" ? content.knitted : "")}
      </p>
    </section>
  );
}

const pill =
  "pointer-events-auto inline-flex h-9 cursor-pointer items-center rounded-full border border-hairline bg-ivory/90 px-4 text-xs font-medium text-graphite shadow-float backdrop-blur-md outline-none hover:bg-ivory focus-visible:ring-4 focus-visible:ring-graphite/25";
