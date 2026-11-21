"use client";

import { useEffect, useRef, useState } from "react";
import { content } from "./content";

export type IslandHandle = {
  dispose: () => void;
  /** Play the opening (ball and thread) again with the pieces unlocked right now. */
  replay: () => void;
  /** Hide a piece (by stage names) and leave a loose thread that knits it in when pulled. */
  offerGift: (stages: string[], label: string, onKnitted: () => void) => boolean;
  /** Knit the waiting piece in without dragging. */
  acceptGift: () => void;
  /** Hide pieces (by stage names) and drop them one by one through a purple portal. Calls back when the last has landed. */
  dropIn: (stages: string[], onLanded?: () => void) => boolean;
};

type Props = {
  /** The pieces that may knit in. Read when the thread is pulled, so a change shows on the next pull. */
  stages: Set<string>;
  /** Start with the finished island instead of the yarn-ball opening (returning visitors). */
  instant?: boolean;
  onReady?: (handle: IslandHandle) => void;
  onPhase?: (phase: string) => void;
};

// Mounts the three.js island into a div and cleans it up when you leave.
export default function IslandScene({ stages, instant = false, onReady, onPhase }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const stagesRef = useRef(stages);
  const handle = useRef<IslandHandle | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    stagesRef.current = stages;
  }, [stages]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    import("./yarn-world/mount.js")
      .then(({ mountIsland }) => {
        if (cancelled) return;
        const h = mountIsland(el, {
          isUnlocked: (stage: string) => stagesRef.current.has(stage),
          onPhase,
          instant,
        }) as IslandHandle;
        handle.current = h;
        onReady?.(h);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
    // The scene is built once per mount; the parent remounts it (key) when the plan changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return <p className="p-6 text-graphite">{content.error}</p>;
  return <div ref={box} className="absolute inset-0" />;
}
