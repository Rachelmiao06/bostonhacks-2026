"use client";

import { useRef } from "react";
import { Camera, Check, Coins, LoaderCircle, Plus, RotateCw, X } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { words } from "../content";
import { useDismiss, usePressHold } from "../gestures";
import type { Layers } from "../layers";
import { policy } from "../policy";
import type { JourneyApi } from "../useJourney";
import { glyphsFor } from "../vocab";
import { ICONS, LINE_DOT, TONE } from "./glyphs";

type Props = {
  journey: JourneyApi;
  quest: Quest;
  text: string;
  photoUrl: string | null;
  onText: (value: string) => void;
  onPhoto: (file: File | null) => void;
};

const RING = 2 * Math.PI * 30; // circumference of the status ring (r = 30)

// How full the ring is per status, so the state reads from shape alone: empty, half, full.
const RING_FILL: Record<Layers["status"], number> = { none: 0, pending: 0.25, needs_work: 0.5, passed: 1, failed: 1, sending: 1 };

const STATUS_STYLE: Record<Layers["status"], string> = {
  none: "text-muted-foreground",
  pending: "text-muted-foreground",
  needs_work: "text-cat-station",
  passed: "text-cat-verify",
  failed: "text-destructive",
  sending: "text-muted-foreground",
};

/**
 * PLACEHOLDER SHEET. No words, no labelled buttons. Everything the rider does here is a gesture or an icon:
 *  - write or add a photo (the check starts by itself when they pause)
 *  - press and hold the ring to send (tap it to retry a failed check)
 *  - drag down or press Escape to close
 */
export function Sheet({ journey, quest, text, photoUrl, onText, onPhoto }: Props) {
  const { layers } = journey;
  const g = glyphsFor(quest);
  const Icon = ICONS[g.icon];
  const files = useRef<HTMLInputElement>(null);

  const { holding, bind: holdBind } = usePressHold({
    ms: policy.commitHoldMs,
    enabled: layers.gestures.commit,
    onComplete: journey.commit,
  });
  const { dragY, bind: dismissBind } = useDismiss({
    px: policy.dismissSwipePx,
    enabled: layers.gestures.dismiss,
    onDismiss: journey.dismiss,
  });

  const spinning = layers.status === "pending" || layers.status === "sending";
  const StatusIcon =
    layers.status === "passed" ? Check : layers.status === "needs_work" ? Plus : layers.status === "failed" ? RotateCw : spinning ? LoaderCircle : Icon;

  return (
    <div
      style={{ transform: dragY ? `translateY(${dragY}px)` : undefined }}
      className="mx-auto w-full max-w-xl rounded-t-3xl border border-b-0 border-border bg-card px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-card-foreground shadow-2xl"
    >
      {/* Drag here to close. The ring in the middle is the one control: hold to send, tap to retry. */}
      <div {...dismissBind} aria-description={words.gesture.dismiss} className="flex touch-none flex-col items-center gap-2 pt-1 pb-3">
        <span aria-hidden className="h-1.5 w-12 rounded-full bg-border" />
        <div
          {...holdBind}
          role={layers.gestures.commit || layers.gestures.retry ? "button" : "img"}
          tabIndex={layers.gestures.commit || layers.gestures.retry ? 0 : -1}
          aria-label={layers.status === "none" ? undefined : words.status[layers.status]}
          aria-description={layers.gestures.commit ? words.gesture.commit : layers.gestures.retry ? words.gesture.retry : undefined}
          onClick={() => layers.gestures.retry && journey.reviewStarted()}
          className={cn(
            "relative grid size-20 select-none place-items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring",
            STATUS_STYLE[layers.status],
            (layers.gestures.commit || layers.gestures.retry) && "cursor-pointer",
          )}
        >
          <svg viewBox="0 0 72 72" className="absolute inset-0 size-full -rotate-90" aria-hidden>
            <circle cx="36" cy="36" r="30" fill="none" strokeWidth="5" className="stroke-border" />
            <circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              stroke="currentColor"
              strokeDasharray={RING}
              strokeDashoffset={holding ? 0 : RING * (1 - RING_FILL[layers.status])}
              style={{ transition: holding ? `stroke-dashoffset ${policy.commitHoldMs}ms linear` : "stroke-dashoffset 300ms ease-out" }}
            />
          </svg>
          <StatusIcon className={cn("size-8", spinning && "animate-spin motion-reduce:animate-none")} aria-hidden />
        </div>
      </div>

      {/* What this problem is, as glyphs only */}
      <div className="flex items-center justify-center gap-4 pb-4">
        <span className={cn("grid size-10 place-items-center rounded-full text-background", TONE[g.tone].bg)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="flex gap-1.5" aria-hidden>
          {g.lines.map((l) => (
            <span key={l} className={cn("size-3.5 rounded-full", LINE_DOT[l])} />
          ))}
        </span>
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn("h-3 w-1.5 rounded-full", i < g.urgency ? "bg-foreground" : "bg-border")} />
          ))}
        </span>
        <span className="flex items-center gap-1 text-foreground" aria-hidden>
          <Coins className="size-5" />
          <span className="font-mono text-sm tabular-nums">{g.reward}</span>
        </span>
      </div>

      {layers.input !== "none" && (
        <div className="flex items-start gap-3">
          <textarea
            value={text}
            onChange={(event) => onText(event.target.value)}
            disabled={layers.input === "locked"}
            aria-label={words.input.text}
            rows={3}
            className="min-h-24 flex-1 resize-none rounded-2xl border border-border bg-background p-3 text-base outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-60"
          />
          <div className="flex flex-col items-center gap-2">
            <input
              ref={files}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              aria-label={words.input.camera}
              onChange={(event) => {
                onPhoto(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            {photoUrl ? (
              <button
                type="button"
                aria-label={words.input.removePhoto}
                onClick={() => onPhoto(null)}
                className="relative size-14 overflow-hidden rounded-xl border border-border outline-none focus-visible:ring-4 focus-visible:ring-ring"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a user photo */}
                <img src={photoUrl} alt="" className="size-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-foreground/40 text-background opacity-0 hover:opacity-100 focus-visible:opacity-100">
                  <X className="size-5" aria-hidden />
                </span>
              </button>
            ) : (
              <button
                type="button"
                aria-label={words.input.camera}
                disabled={layers.input === "locked"}
                onClick={() => files.current?.click()}
                className="grid size-14 place-items-center rounded-xl border border-border text-muted-foreground outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-50"
              >
                <Camera className="size-6" aria-hidden />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
