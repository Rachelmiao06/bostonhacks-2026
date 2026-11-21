"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { content, unlockSteps } from "./content";
import { glass } from "./glass";
import type { IslandHandle } from "./IslandScene";
import { readCollectionSeen, writeCollectionSeen } from "./seen";

type Controller = {
  setActive: (i: number) => void;
  setHover: (i: number | null) => void;
  resize: (w: number, h: number) => void;
  slots: () => { x: number; y: number; size: number; shown: boolean }[];
  spacingPx: () => number;
  dispose: () => void;
};

const total = unlockSteps.length;

/**
 * "Unlock more of your island": a row of the island's own knitted pieces floating above the island, one detail line and
 * one progress bar. The pieces are clones of the island's real objects drawn by ONE extra renderer
 * (yarn-world/collection.js); the island behind it is only dimmed. Nothing here moves the island's camera.
 * Unlocked and locked come only from the server-confirmed count (`known`); if it is null nothing shows as unlocked.
 */
export function Collection({ known, handle, onClose }: { known: number | null; handle: React.RefObject<IslandHandle | null>; onClose: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const ctrl = useRef<Controller | null>(null);
  const [active, setActive] = useState(() => (known && known > 0 ? Math.min(known, total) - 1 : 0));
  const [failed, setFailed] = useState(false);
  const c = content.collection;

  // Start the 3D row. A piece earned since this browser last looked rises into view once (and is not replayed later).
  useEffect(() => {
    const canvasEl = canvas.current;
    const stageEl = stage.current;
    const sources = handle.current?.getCollectibleSources();
    if (!canvasEl || !stageEl || !sources) return;
    let dead = false;
    let raf = 0;
    const seen = readCollectionSeen();
    const reveal = new Set<number>();
    if (known !== null && seen !== null) for (let i = seen; i < known; i++) reveal.add(i);
    if (known !== null) writeCollectionSeen(known);
    const states = sources.map((_, i) => (known !== null && i < known ? "unlocked" : "locked"));
    let ro: ResizeObserver | null = null;

    import("./yarn-world/collection.js")
      .then(({ createCollection }) => {
        if (dead) return;
        const ctl = createCollection(canvasEl, { sources, states, reveal }) as Controller;
        ctrl.current = ctl;
        ctl.setActive(active);
        const fit = () => ctl.resize(stageEl.clientWidth, stageEl.clientHeight);
        fit();
        ro = new ResizeObserver(fit);
        ro.observe(stageEl);
        // keep the labels under their pieces, written straight to the elements
        const tick = () => {
          ctl.slots().forEach((s, i) => {
            const el = labels.current[i];
            if (!el) return;
            const show = s.shown && Math.abs(s.x - stageEl.clientWidth / 2) < stageEl.clientWidth / 2 + 10;
            el.style.transform = `translate3d(${Math.round(s.x)}px, ${Math.round(s.y + s.size * 0.62 + 12)}px, 0) translateX(-50%)`;
            el.style.opacity = show ? "1" : "0";
            el.style.pointerEvents = show ? "auto" : "none";
          });
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch(() => !dead && setFailed(true));

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      ctrl.current?.dispose();
      ctrl.current = null;
    };
    // The row is built once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ctrl.current?.setActive(active);
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setActive((a) => Math.min(total - 1, a + 1));
      else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, a - 1));
      else if (e.key === "Home") setActive(0);
      else if (e.key === "End") setActive(total - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Pointer: hover lifts a piece; a short press selects it; a horizontal swipe moves along the row.
  const down = useRef<{ x: number; y: number } | null>(null);
  const nearest = (x: number, y: number): number | null => {
    const ctl = ctrl.current;
    if (!ctl) return null;
    const half = ctl.spacingPx() / 2;
    let best: number | null = null;
    let bestD = Infinity;
    ctl.slots().forEach((s, i) => {
      const dx = Math.abs(s.x - x);
      if (s.shown && dx < half && Math.abs(s.y - y) < s.size * 0.8 && dx < bestD) {
        best = i;
        bestD = dx;
      }
    });
    return best;
  };
  const local = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const unlockedHere = known !== null && active < known;
  const next = known !== null && known < total ? unlockSteps[known] : null;
  const step = unlockSteps[active];
  const need = known === null ? null : Math.max(0, active + 1 - known);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-linear-to-b from-ivory/75 via-ivory/62 to-ivory/75 px-4 pt-20 pb-20 font-ui text-graphite backdrop-blur-[5px]" role="dialog" aria-label={c.title}>
      <button
        type="button"
        onClick={onClose}
        aria-label={c.close}
        data-autofocus
        className="absolute top-[4.6rem] right-3 z-10 grid size-10 cursor-pointer place-items-center rounded-full border border-hairline bg-ivory/90 text-taupe shadow-float outline-none hover:text-graphite focus-visible:ring-4 focus-visible:ring-graphite/20 sm:top-24 sm:right-6"
      >
        <X className="size-4" aria-hidden />
      </button>

      <header className="max-w-xl px-10 text-center sm:px-0">
        <h2 className="font-serif text-xl leading-tight font-semibold tracking-tight sm:text-3xl">{c.title}</h2>
        <p className="mt-1 text-sm text-graphite/80">{c.subtitle}</p>
      </header>

      {/* The floating row. One canvas for all pieces; the labels below are real buttons (roving focus, arrow keys). */}
      <div
        ref={stage}
        className="relative mt-3 h-[min(40svh,20rem)] w-full max-w-5xl flex-none touch-pan-y select-none sm:h-[min(44svh,22rem)]"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const p = local(e);
          ctrl.current?.setHover(nearest(p.x, p.y));
        }}
        onPointerLeave={() => ctrl.current?.setHover(null)}
        onPointerDown={(e) => {
          down.current = local(e);
        }}
        onPointerUp={(e) => {
          const d = down.current;
          down.current = null;
          if (!d) return;
          const p = local(e);
          const dx = p.x - d.x;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(p.y - d.y)) setActive((a) => Math.max(0, Math.min(total - 1, a + (dx < 0 ? 1 : -1))));
          else {
            const hit = nearest(p.x, p.y);
            if (hit !== null) setActive(hit);
          }
        }}
      >
        {/* the pieces are graded to look richer and more colourful than the island's soft palette: more saturation and a little contrast */}
        <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full [filter:saturate(1.55)_contrast(1.08)]" />
        {failed && <p role="alert" className="absolute inset-0 grid place-items-center text-sm text-taupe">{c.noScene}</p>}

        <div className="pointer-events-none absolute inset-0">
          {unlockSteps.map((st, i) => {
            const isUnlocked = known !== null && i < known;
            return (
              <button
                key={st.label}
                ref={(el) => {
                  labels.current[i] = el;
                }}
                type="button"
                tabIndex={active === i ? 0 : -1}
                aria-current={active === i}
                onClick={() => setActive(i)}
                onMouseEnter={() => ctrl.current?.setHover(i)}
                onMouseLeave={() => ctrl.current?.setHover(null)}
                onFocus={() => ctrl.current?.setHover(i)}
                onBlur={() => ctrl.current?.setHover(null)}
                style={{ opacity: 0 }}
                className={cn(
                  "absolute top-0 left-0 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.92rem] whitespace-nowrap outline-none transition-[color,font-weight] focus-visible:ring-2 focus-visible:ring-graphite/40",
                  active === i ? "font-semibold text-graphite" : "text-graphite/75 hover:text-graphite",
                  active === i && glass,
                )}
              >
                <span className="relative">{st.label}</span>
                {isUnlocked ? <Check className="relative size-3.5 text-cat-verify" aria-label={c.unlocked} /> : <Lock className="relative size-3.5" aria-label={c.locked} />}
              </button>
            );
          })}
        </div>

        <button type="button" onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0} aria-label={c.prev} className="absolute top-1/2 left-0 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/40 disabled:opacity-30">
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button type="button" onClick={() => setActive((a) => Math.min(total - 1, a + 1))} disabled={active === total - 1} aria-label={c.next} className="absolute top-1/2 right-0 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/40 disabled:opacity-30">
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      {/* One concise detail for the selected piece */}
      <p aria-live="polite" className="mt-3 min-h-[2.6rem] max-w-md text-center text-sm">
        <span className="font-serif text-lg font-semibold">{step.label}</span>
        <span className="block text-graphite/80">
          {known === null ? c.unavailableDetail : unlockedHere ? step.blurb : `${c.lockedDetail} ${need ? c.lockedNeed(need) + "." : ""}`}
        </span>
      </p>

      {/* One understated progress indicator, from the server-confirmed count */}
      <div className="mt-3 w-full max-w-sm text-center">
        {known === null ? (
          <p role="alert" className="text-xs text-taupe">
            {c.unknown}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium">{c.progress(known, total)}</p>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={known} aria-label={c.progress(known, total)} className="mx-auto mt-2 h-1.5 w-full overflow-hidden rounded-full bg-graphite/15">
              <div className="h-full rounded-full bg-graphite transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${(known / total) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-graphite/75">{next ? c.nextUnlock(next.label) : c.allDone}</p>
          </>
        )}
      </div>
    </div>
  );
}
