"use client";

import { useEffect, useRef, useState } from "react";

export type IslandHandle = {
  dispose: () => void;
  /** Play the opening (ball and thread) again with the pieces unlocked right now. */
  replay: () => void;
  /** Hide a piece (by stage names) and leave a loose thread that knits it in when pulled. */
  offerGift: (stages: string[], label: string, onKnitted: () => void) => boolean;
  /** New pieces fall onto the island from above, one after another. Returns false if none match. */
  dropIn: (pick: (stage: string, k: number) => boolean, onDone: () => void) => boolean;
  /** Knit the waiting piece in without dragging. */
  acceptGift: () => void;
  /** The three gifts. States: locked, ready or opened. */
  setGiftStates: (states: string[], instant?: boolean) => void;
  /** Open a hotspot (the journal or a gift) with its little animation; returns the state it ends in. */
  openHotspot: (id: string) => string;
  /** Glow a hotspot, e.g. while its page control has keyboard focus. */
  highlightHotspot: (id: string, on: boolean) => void;
  /** Where a hotspot is on screen, in pixels of the scene, so labels and tickets can sit beside it. */
  hotspotScreen: (id: string, out: { x: number; y: number; visible: boolean }) => { x: number; y: number; visible: boolean };
  /** The existing island objects that stand for each journey step, to clone into the collection gallery. */
  getCollectibleSources: () => unknown[][];
  /** Fly the camera toward a hotspot (the journal or a gift), smoothly. */
  focusHotspot: (id: string) => void;
  /** Fly the camera back to the overview it started with. */
  resetCamera: () => void;
  /** Hold the gentle camera sway while a ticket is open, so the camera stays where it is. */
  holdCamera: (hold: boolean) => void;
};

type Props = {
  /** Does piece number k of this stage exist yet? Read when the thread is pulled, so a change shows on the next pull. */
  unlocked: (stage: string, k: number) => boolean;
  /** Start with the finished island instead of the yarn-ball opening (returning visitors). */
  instant?: boolean;
  onReady?: (handle: IslandHandle) => void;
  onPhase?: (phase: string) => void;
  /** A hotspot was poked or tapped in the scene: which one, and the state it is in. */
  onHotspot?: (id: string, state: string) => void;
  /** A pointer moved onto or off a hotspot. */
  onHover?: (id: string, on: boolean) => void;
  /** The scene could not start (no WebGL). */
  onFail?: () => void;
};

// Mounts the three.js island into a div and cleans it up when you leave.
export default function IslandScene({ unlocked, instant = false, onReady, onPhase, onHotspot, onHover, onFail }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const unlockedRef = useRef(unlocked);
  const handle = useRef<IslandHandle | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    import("./yarn-world/mount.js")
      .then(({ mountIsland }) => {
        if (cancelled) return;
        const h = mountIsland(el, {
          isUnlocked: (stage: string, k: number) => unlockedRef.current(stage, k),
          onPhase,
          onHotspot,
          onHover,
          instant,
        }) as IslandHandle;
        handle.current = h;
        onReady?.(h);
      })
      .catch(() => {
        setFailed(true);
        onFail?.();
      });
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
    // The scene is built once per mount; the parent remounts it (key) when the plan changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return null; // the page shows one small status for this
  return <div ref={box} className="absolute inset-0" />;
}
