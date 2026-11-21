"use client";

import Image from "next/image";
import Link from "next/link";
import { Castle, Map as MapIcon, Pencil } from "lucide-react";
import { Coin } from "@/components/shared/coin";
import { Tilt } from "@/components/shared/tilt";
import { cn } from "@/lib/utils";
import { categoryStyle } from "@/features/explore/category";
import { landmarkSrc } from "@/features/landmarks/catalog";
import { content } from "./content";
import { albumOf, albumOrder, draftsOf, extraStamps, stampsOf, type AlbumSlot } from "./model";
import { usePassport } from "./usePassport";

/**
 * My Journey and Collection as one picture page. Each finished contribution earns a stamp,
 * and each stamp unlocks the next Boston landmark in the album. Words are for screen readers only.
 */
export function Passport() {
  const state = usePassport();

  if (state.status === "loading") {
    return (
      <div role="status" aria-label={content.loading} className="mx-auto max-w-3xl space-y-8">
        <div className="h-16 w-48 animate-pulse rounded-2xl bg-stone" />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {albumOrder.map((id) => (
            <li key={id} className="aspect-square animate-pulse rounded-3xl bg-stone" />
          ))}
        </ul>
      </div>
    );
  }

  // Offline still draws an empty album: the page is never blank, and no number is invented.
  const stamps = state.status === "ready" ? stampsOf(state.data) : [];
  const drafts = state.status === "ready" ? draftsOf(state.data) : [];
  const tokens = state.status === "ready" ? state.data.tokenBalance : 0;
  const album = albumOf(stamps);
  const have = Math.min(stamps.length, album.length);
  const extra = extraStamps(stamps);
  const nextIndex = stamps.length < album.length ? stamps.length : -1;

  return (
    <article className="mx-auto max-w-3xl space-y-8 font-ui text-graphite">
      <h1 className="sr-only">{content.title}</h1>
      {state.status === "offline" && (
        <p role="status" className="sr-only">
          {content.offline}
        </p>
      )}

      {/* Tokens and progress, as a coin and a row of dots */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-hairline bg-ivory px-5 py-4 shadow-float">
        <p className="flex items-center gap-3" aria-label={content.tokens(tokens)}>
          <Coin size={44} />
          <span className="font-serif text-5xl leading-none font-semibold tabular-nums">{tokens}</span>
        </p>
        <div role="img" aria-label={content.progress(have, album.length)} className="flex items-center gap-1.5">
          {album.map((slot) => (
            <span key={slot.id} className={cn("size-3 rounded-full border border-graphite/25", slot.stamp ? "border-graphite bg-graphite" : "bg-transparent")} />
          ))}
          {extra > 0 && (
            <span className="ml-1 font-mono text-xs text-taupe tabular-nums" aria-label={content.extra(extra)}>
              +{extra}
            </span>
          )}
        </div>
      </header>

      {/* The album: one tile per landmark, a silhouette until a stamp unlocks it */}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {album.map((slot, i) => (
          <li key={slot.id}>{slot.stamp ? <Collected slot={slot} /> : <Locked slot={slot} next={i === nextIndex} />}</li>
        ))}
      </ul>

      {/* Drafts waiting to be finished, and the way to the island */}
      <footer className="flex flex-wrap items-center justify-between gap-4">
        <ul className="flex flex-wrap items-center gap-3">
          {drafts.map((d) => (
            <li key={d.id}>
              <Link
                href={`/?quest=${encodeURIComponent(d.alertId)}`}
                aria-label={content.draft(d.station)}
                title={content.draft(d.station)}
                className="grid size-12 place-items-center rounded-full border-2 border-dashed border-graphite/35 text-graphite outline-none hover:border-graphite focus-visible:ring-4 focus-visible:ring-graphite/25"
              >
                <Pencil className="size-5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/island"
          aria-label={content.island}
          title={content.island}
          className="grid size-12 place-items-center rounded-full bg-graphite text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25"
        >
          <Castle className="size-5" aria-hidden />
        </Link>
      </footer>
    </article>
  );
}

function Collected({ slot }: { slot: AlbumSlot }) {
  const stamp = slot.stamp!;
  const style = categoryStyle[stamp.category];
  const Icon = style.icon;
  return (
    <Tilt>
      <figure className="relative grid aspect-square place-items-center rounded-3xl border border-hairline bg-ivory p-4 shadow-ticket">
        <Image src={landmarkSrc(slot.id)} alt={slot.label} width={512} height={512} unoptimized draggable={false} className="size-full object-contain drop-shadow-md" />
        {/* The stamp that earned it: a small coloured badge, with the details in its tooltip */}
        <span
          title={content.stamp(stamp.kind, stamp.station)}
          aria-label={content.stamp(stamp.kind, stamp.station)}
          role="img"
          className={cn("absolute -top-2 -right-2 grid size-9 rotate-6 place-items-center rounded-full border-[3px] border-double bg-ivory", style.border, style.text)}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </figure>
    </Tilt>
  );
}

function Locked({ slot, next }: { slot: AlbumSlot; next: boolean }) {
  const tile = (
    <span
      className={cn(
        "relative grid aspect-square w-full place-items-center rounded-3xl border border-dashed bg-stone/60 p-4",
        next ? "border-graphite/50" : "border-graphite/20",
      )}
    >
      <Image src={landmarkSrc(slot.id)} alt="" width={512} height={512} unoptimized draggable={false} className="size-full object-contain opacity-15 brightness-0" />
      {next && <MapIcon className="absolute size-7 animate-pulse text-graphite" aria-hidden />}
    </span>
  );
  // Only the next slot is a way forward: it leads to the map, where the next stamp is earned.
  if (!next) return <span role="img" aria-label={`${slot.label}. ${content.locked}`} className="block">{tile}</span>;
  return (
    <Link href="/" aria-label={`${slot.label}. ${content.nextOnMap}`} title={content.nextOnMap} className="block rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-graphite/25">
      {tile}
    </Link>
  );
}
