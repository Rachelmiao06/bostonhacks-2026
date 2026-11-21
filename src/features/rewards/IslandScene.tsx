"use client";

import { useEffect, useRef, useState } from "react";
import { content } from "./content";

type Handle = { dispose: () => void; replay: () => void };

// Mounts the three.js island into a div. `stages` is the set of pieces that may knit in.
// The scene is built once; a change in `stages` shows the next time the thread is pulled.
export default function IslandScene({ stages, onReady }: { stages: Set<string>; onReady?: (replay: () => void) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const stagesRef = useRef(stages);
  const handle = useRef<Handle | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    stagesRef.current = stages;
  }, [stages]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    import("./island/mount.js")
      .then(({ mountIsland }) => {
        if (cancelled) return;
        const h = mountIsland(el, { isUnlocked: (stage: string) => stagesRef.current.has(stage) }) as Handle;
        handle.current = h;
        onReady?.(h.replay);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return <p className="p-6 text-ink">{content.error}</p>;
  return <div ref={box} className="absolute inset-0" />;
}
