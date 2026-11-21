"use client";

import { useEffect, useRef, useState } from "react";
import { content } from "./content";

export type Status = { phase: "ball" | "knitting" | "ready" | "unraveling" | ""; progress: number };
type Handle = { dispose: () => void; replay: () => void; knit: () => void };

// Mounts the three.js island into a div. `stages` is the set of pieces that may knit in.
// The scene is built once; a change in `stages` shows the next time the thread is pulled.
export default function IslandScene({
  stages,
  onReady,
  onStatus,
}: {
  stages: Set<string>;
  onReady?: (controls: { replay: () => void; knit: () => void }) => void;
  onStatus?: (status: Status) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const stagesRef = useRef(stages);
  const statusRef = useRef(onStatus);
  const handle = useRef<Handle | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    stagesRef.current = stages;
    statusRef.current = onStatus;
  }, [stages, onStatus]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    import("./yarn-world/mount.js")
      .then(({ mountIsland }) => {
        if (cancelled) return;
        const h = mountIsland(el, {
          isUnlocked: (stage: string) => stagesRef.current.has(stage),
          onStatus: (st: { phase: string; progress: number }) => statusRef.current?.(st as Status),
        }) as Handle;
        handle.current = h;
        onReady?.({ replay: h.replay, knit: h.knit });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return <p className="p-6 text-graphite">{content.error}</p>;
  return <div ref={box} className="absolute inset-0" />;
}
