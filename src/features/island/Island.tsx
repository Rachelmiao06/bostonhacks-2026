"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { markLeftForIsland } from "@/features/explore/viewMemory";
import { refreshProgress, stampCount, useMyProgress, type ProgressState } from "@/features/explore/progress";
import { content, stagesFor, unlockTiers } from "./content";
import { IslandScene } from "./IslandLoader";
import type { IslandHandle } from "./IslandScene";
import { perk, perkReady } from "./perk";
import { PerkTicket } from "./PerkTicket";
import { readSeen, writeSeen } from "./seen";

const total = unlockTiers.length;

/** What this visit shows: the opening, or the finished island plus a thread for each stamp earned since last time. */
type Plan = { mode: "first" | "return"; known: number; earned: number };

function makePlan(progress: ProgressState, preview: boolean): Plan {
  if (preview) return { mode: "first", known: total, earned: total };
  const seen = readSeen();
  // The server's stamp count is the truth. If it cannot be reached, show what this browser last saw.
  const earned = progress.status === "ready" ? Math.min(stampCount(progress.data), total) : (seen ?? 0);
  if (seen === null) return { mode: "first", known: earned, earned };
  return { mode: "return", known: Math.min(seen, earned), earned };
}

/**
 * The rider's knitted island, grown from their real stamps (the server's count, via useMyProgress).
 * First visit: the yarn-ball opening. Later visits: the island is simply there, and a stamp earned since
 * the last visit leaves one loose thread on the quilt that knits its piece in. Full screen under the nav, like the map.
 */
export function Island() {
  const progress = useMyProgress();
  const [preview, setPreview] = useState(false);
  // Next keeps a page mounted (hidden) after you leave it, and runs its effects again when you come back.
  // So every visit starts here: fetch the latest stamps from the server, then plan the visit.
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    // Tell the map the rider is on the island, so coming back resumes the map instead of replaying the gate.
    markLeftForIsland();
    let live = true;
    void refreshProgress().finally(() => live && setVisit((n) => n + 1));
    return () => {
      live = false;
    };
  }, []);
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
      onTogglePreview={() => setPreview((p) => !p)}
    />
  );
}

function IslandView({
  plan,
  preview,
  unavailable,
  onTogglePreview,
}: {
  plan: Plan;
  preview: boolean;
  unavailable: boolean;
  onTogglePreview: () => void;
}) {
  const [phase, setPhase] = useState("ball");
  const [known, setKnown] = useState(plan.known); // tiers knitted in right now
  const [waiting, setWaiting] = useState<number | null>(null); // tier whose thread lies on the quilt
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [ticket, setTicket] = useState(false);
  const handle = useRef<IslandHandle | null>(null);
  const offerRef = useRef<(h: IslandHandle, index: number, more: boolean) => void>(() => {});

  // Leaves a loose thread for tier `index`; when it is pulled the piece knits in and is remembered.
  useEffect(() => {
    offerRef.current = (h, index, more) => {
      const tier = unlockTiers[index];
      if (!tier) return;
      const ok = h.offerGift(tier.stages, tier.name, () => {
        writeSeen(index + 1); // remembered only once the piece has really been knitted in
        setKnown(index + 1);
        setWaiting(null);
        setNote(content.giftKnitted(tier.name));
        if (index + 1 < plan.earned) window.setTimeout(() => offerRef.current(h, index + 1, true), 1600);
      });
      if (ok) {
        setWaiting(index);
        setNote(more ? content.giftMore : content.giftReady(tier.name));
      }
    };
  }, [plan.earned]);

  const onReady = useCallback(
    (h: IslandHandle) => {
      handle.current = h;
      setReady(true);
      if (!preview && plan.mode === "return" && plan.earned > plan.known) offerRef.current(h, plan.known, false);
    },
    [preview, plan],
  );

  const onPhase = useCallback(
    (p: string) => {
      setPhase(p);
      // Unravelling folds the island into the ball; the next knit-in includes everything earned so far,
      // so a waiting piece is not lost.
      if (p === "unravel" && !preview) {
        writeSeen(plan.earned);
        setKnown(plan.earned);
        setWaiting(null);
        setNote("");
      }
      // The first full opening has been seen: later visits skip it.
      if (p === "idle" && plan.mode === "first" && !preview) writeSeen(plan.earned);
    },
    [plan, preview],
  );

  // The parcel appears once the island is fully knitted and a perk is available to this rider.
  // The server's count decides (plan.earned); the parcel stays on the island so the perk can be seen again.
  const parcelOn = perk !== null && perkReady(plan.earned) && ready && phase === "idle" && waiting === null;
  useEffect(() => {
    const h = handle.current;
    if (!h || !ready) return;
    if (parcelOn) h.showParcel(() => setTicket(true));
    else h.hideParcel();
  }, [parcelOn, ready]);

  const next = unlockTiers[Math.min(known, total - 1)];
  const waitingTier = waiting !== null ? unlockTiers[waiting] : null;
  const allKnown = known >= total;
  const opening = phase === "ball" || phase === "intro";
  const line = preview
    ? content.previewNote
    : waitingTier
      ? content.giftReady(waitingTier.name)
      : note ||
        (parcelOn
          ? content.parcelWaiting
          : plan.mode === "return"
            ? content.welcomeBack
            : allKnown
              ? opening
                ? content.allReady
                : content.allUnlocked
              : content.nextUnlock(next.name));

  return (
    <section className="fixed inset-0 z-30 bg-stone font-ui text-graphite">
      <IslandScene stages={stagesFor(known)} instant={plan.mode === "return"} onReady={onReady} onPhase={onPhase} />

      <div className="pointer-events-none absolute top-20 left-3 max-w-[18rem] sm:left-4">
        <div className="pointer-events-auto space-y-1 rounded-2xl border border-hairline bg-ivory/92 p-4 shadow-float backdrop-blur-md">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-taupe uppercase">{content.eyebrow}</p>
          <h1 className="font-serif text-xl leading-tight font-semibold">{content.title}</h1>
          <p className="text-xs text-taupe">{line}</p>
          {unavailable && <p className="text-xs text-taupe">{content.unavailable}</p>}

          {/* Keyboard and no-drag alternatives to pulling a thread */}
          {phase === "ball" && plan.mode === "first" && (
            <button type="button" onClick={() => handle.current?.replay()} className={primary}>
              {content.knitButton}
            </button>
          )}
          {waiting !== null && !preview && (
            <button type="button" onClick={() => handle.current?.acceptGift()} className={primary}>
              {content.giftButton}
            </button>
          )}
          {parcelOn && (
            <button type="button" onClick={() => handle.current?.openParcel()} className={primary}>
              {content.parcelButton}
            </button>
          )}
          <button
            type="button"
            onClick={onTogglePreview}
            className="mt-2 inline-flex h-9 items-center rounded-full border border-graphite/25 px-4 text-xs font-medium outline-none hover:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/20"
          >
            {preview ? content.previewOffLabel : content.previewLabel}
          </button>
        </div>
      </div>

      {ticket && perk && <PerkTicket perk={perk} onClose={() => setTicket(false)} />}

      {phase === "ball" && plan.mode === "first" && (
        <p className="pointer-events-none absolute inset-x-0 bottom-28 text-center font-serif text-lg text-graphite/85 italic sm:bottom-14">
          {content.pullInstruction}
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {note || (phase === "ball" ? content.waiting : phase === "intro" ? content.knitting : phase === "idle" ? content.knitted : "")}
      </p>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 px-4 text-center text-xs text-graphite/70">
        {opening && plan.mode === "first" ? content.hintOpening : content.hint} {content.soundHint}{" "}
        <a className="pointer-events-auto underline" href={content.creditUrl} target="_blank" rel="noreferrer">
          {content.credit}
        </a>
      </p>
    </section>
  );
}

const primary =
  "mt-2 mr-2 inline-flex h-9 items-center rounded-full bg-graphite px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25";
