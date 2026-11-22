"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticker slots for the journal. Each slot looks for a picture at `/assets/island/stickers/<id>.png` (a transparent PNG,
 * about 256 px square is plenty). Until that file exists the built-in drawn sticker (`fallback`) is shown, so the page always works.
 */
export type StickerId = "star" | "folder" | "heart" | "check" | "broken" | "deco-1" | "deco-2" | "deco-3";

export const stickerIds: StickerId[] = ["star", "folder", "heart", "check", "broken", "deco-1", "deco-2", "deco-3"];

export function Sticker({ id, className, fallback }: { id: StickerId; className?: string; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a user-supplied sticker picture: loaded as is, and falls back to a drawing if it is missing
    <img
      src={`/assets/island/stickers/${id}.png`}
      alt=""
      aria-hidden
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("pointer-events-none object-contain drop-shadow-[0_1px_1px_var(--shade-soft)] select-none", className)}
    />
  );
}
