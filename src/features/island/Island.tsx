"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { markLeftForIsland } from "@/features/explore/viewMemory";
import { refreshProgress, stampCount, useMyProgress, type ProgressState } from "@/features/explore/progress";
import { content, stagesFor, unlockTiers } from "./content";
import { demoGift } from "./gifts";
import { GiftTicket } from "./GiftTicket";
import { IslandHelp } from "./IslandHelp";
import { IslandScene } from "./IslandLoader";
import type { IslandHandle } from "./IslandScene";
import { readParcelOpened, readSeen, writeParcelOpened, writeSeen } from "./seen";

const total = unlockTiers.length;

/** What this visit shows: the opening, or the finished island plus a thread for each piece earned since last time. */
type Plan = { mode: "first" | "return"; known: number; earned: number; parcel: boolean };

function makePlan(progress: ProgressState, preview: boolean): Plan {
  if (preview) return { mode: "first", known: total, earned: total, parcel: false };
  const seen = readSeen();
  const ready = progress.status === "ready";
  // The server's count is the truth. If it cannot be reached, show only what this browser last saw:
  // an unknown count is never treated as zero, and nothing new is granted.
  const earned = ready ? Math.min(stampCount(progress.data), total) : (seen ?? 0);
  // The little gift is only there when the server has confirmed at least one contribution.
  const parcel = ready && stampCount(progress.data) >= 1;
  if (seen === null) return { mode: "first", known: earned, earned, parcel };
  return { mode: "return", known: Math.min(seen, earned), earned, parcel };
}

/**
 * My World: the rider's knitted island, grown from their real contributions (the server's count, via useMyProgress),
 * and the whole screen. First visit: the yarn-ball opening. Later visits: the island is simply there, and a piece
 * earned since the last visit leaves one loose thread on the quilt that knits it in. A small gift can wait
 * somewhere on the island. Everything else is a few quiet controls at the edges.
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
  const [known, setKnown] = useState(plan.known); // tiers knitted in right now
  const [waiting, setWaiting] = useState<number | null>(null); // tier whose thread lies on the quilt
  const [note, setNote] = useState("");
  const [ticket, setTicket] = useState(false);
  const handle = useRef<IslandHandle | null>(null);
  const offerRef = useRef<(h: IslandHandle, index: number, more: boolean) => void>(() => {});

  // Leaves a loose thread for tier `index`; when it is pulled the piece knits in and is remembered.
  useEffect(() => {
    offerRef.current = (h, index, more) => {
      const tier = unlockTiers[index];
      if (!tier) return;
      const ok = h.offerGift(tier.stages, tier.name, () => {
        writeSeen(index + 1); // remembered only once the piece has really knitted in
        setKnown(index + 1);
        setWaiting(null);
        setNote(content.giftKnitted);
        if (index + 1 < plan.earned) window.setTimeout(() => offerRef.current(h, index + 1, true), 1600);
      });
      if (ok) {
        setWaiting(index);
        setNote(more ? content.giftMore : content.giftReady);
      }
    };
  }, [plan.earned]);

  // "Your little world just grew!" is a passing message; a waiting thread keeps its own.
  useEffect(() => {
    if (!note || waiting !== null) return;
    const id = window.setTimeout(() => setNote(""), 5000);
    return () => window.clearTimeout(id);
  }, [note, waiting]);

  const onReady = useCallback(
    (h: IslandHandle) => {
      handle.current = h;
      if (plan.parcel) h.setParcelOpened(readParcelOpened(demoGift.id));
      if (!preview && plan.mode === "return" && plan.earned > plan.known) offerRef.current(h, plan.known, false);
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
        setWaiting(null);
        setNote("");
      }
      // The first full opening has been seen: later visits skip it.
      if (p === "idle" && plan.mode === "first") writeSeen(plan.earned);
    },
    [plan, preview, unavailable],
  );

  const openTicket = useCallback(() => {
    writeParcelOpened(demoGift.id);
    handle.current?.holdCamera(true);
    setTicket(true);
  }, []);
  const closeTicket = useCallback(() => {
    handle.current?.holdCamera(false);
    setTicket(false);
  }, []);

  const stages = useMemo(() => stagesFor(known, plan.parcel), [known, plan.parcel]);
  const canKnit = phase === "ball" && plan.mode === "first";
  const parcelReady = plan.parcel && phase === "idle";
  const status = sceneFailed ? { text: content.sceneFailed } : unavailable ? { text: content.progressFailed, retry: onRetry } : null;

  return (
    <section className="fixed inset-0 z-30 bg-stone font-ui text-graphite">
      <IslandScene stages={stages} instant={plan.mode === "return"} onReady={onReady} onPhase={onPhase} onParcel={openTicket} onFail={onSceneFailed} />

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
        {waiting !== null && !preview && (
          <button type="button" onClick={() => handle.current?.acceptGift()} className={pill}>
            {content.giftButton}
          </button>
        )}
      </div>

      {/* Keyboard and screen-reader way to the little gift; it shows when focused */}
      {parcelReady && !ticket && (
        <button
          type="button"
          onClick={() => {
            handle.current?.openParcel();
            openTicket();
          }}
          className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 cursor-pointer rounded-full bg-graphite px-4 py-2 text-xs font-medium text-ivory shadow-float outline-none not-focus-visible:sr-only focus-visible:ring-4 focus-visible:ring-graphite/25"
        >
          {content.parcel.label}
        </button>
      )}

      {ticket && <GiftTicket gift={demoGift} handle={handle} onClose={closeTicket} />}

      <IslandHelp preview={preview} onTogglePreview={onTogglePreview} />

      <p role="status" aria-live="polite" className="sr-only">
        {note || (phase === "ball" ? content.waiting : phase === "intro" ? content.knitting : phase === "idle" ? content.knitted : "")}
      </p>
    </section>
  );
}

const pill =
  "pointer-events-auto inline-flex h-9 cursor-pointer items-center rounded-full border border-hairline bg-ivory/90 px-4 text-xs font-medium text-graphite shadow-float backdrop-blur-md outline-none hover:bg-ivory focus-visible:ring-4 focus-visible:ring-graphite/25";
