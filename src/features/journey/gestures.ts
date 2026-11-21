"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/**
 * The two gestures that replace buttons. Both are headless: they return handlers to spread on any element
 * and say nothing about how it looks. Each also has a keyboard path, because a gesture alone shuts out
 * people who cannot do it.
 */

/**
 * Press and hold to confirm. A deliberate hold means a stray tap cannot send anything.
 * Spread `bind` on the target. `holding` is true while the finger is down (drive a ring or fill from it,
 * for example with a CSS animation lasting `ms`). Keyboard: Enter confirms straight away.
 */
export function usePressHold({ ms, enabled, onComplete }: { ms: number; enabled: boolean; onComplete: () => void }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);

  useEffect(() => cancel, [cancel]); // clear on unmount

  // The gesture went away mid-hold: drop the visual state right away, and stop the timer below.
  if (!enabled && holding) setHolding(false);
  useEffect(() => {
    if (!enabled && timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, [enabled]);

  const bind = {
    onPointerDown: (event: ReactPointerEvent) => {
      if (!enabled || event.button > 0) return;
      setHolding(true);
      timer.current = setTimeout(() => {
        timer.current = null;
        setHolding(false);
        onComplete();
      }, ms);
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(), // long-press menu on touch
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (enabled && event.key === "Enter") {
        event.preventDefault();
        onComplete();
      }
    },
  };

  return { holding, bind };
}

/**
 * Close by dragging down, or by pressing Escape. Spread `bind` on the handle or header of the sheet.
 * `dragY` is how far the sheet has been pulled (0 when idle) so the screen can follow the finger.
 */
export function useDismiss({ px, enabled, onDismiss }: { px: number; enabled: boolean; onDismiss: () => void }) {
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onDismiss]);

  const bind = {
    onPointerDown: (event: ReactPointerEvent) => {
      if (!enabled) return;
      startY.current = event.clientY;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event: ReactPointerEvent) => {
      if (startY.current === null) return;
      setDragY(Math.max(0, event.clientY - startY.current));
    },
    onPointerUp: (event: ReactPointerEvent) => {
      if (startY.current === null) return;
      const moved = event.clientY - startY.current;
      startY.current = null;
      setDragY(0);
      if (moved >= px) onDismiss();
    },
    onPointerCancel: () => {
      startY.current = null;
      setDragY(0);
    },
  };

  return { dragY, bind };
}
