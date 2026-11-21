"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Gift as GiftIcon, Lock, MapPin, Utensils } from "lucide-react";
import { formatDistance, type NearbyPlace } from "@/lib/places";
import { cn } from "@/lib/utils";
import { TicketFrame, closeButtonClass } from "./TicketFrame";
import { content, giftMilestones, nextGift, unlockSteps, type GiftState } from "./content";
import type { Gift } from "./gifts";
import type { IslandHandle } from "./IslandScene";

type Props = {
  gift: Gift;
  /** Which gift this is (0-based). */
  index: number;
  state: GiftState;
  /** Journey steps on the island now. Null when the server could not be reached: nothing is claimed about progress. */
  known: number | null;
  /** A real nearby place for this gift, when the lookup found one. */
  place: NearbyPlace | null;
  /** Why there is no place (so the demo can say so): the rider has not picked a stop, the lookup failed, or it is still running. */
  noPlace: "no-station" | "unavailable" | "loading" | null;
  stationName: string;
  /** The credit the places source requires (OpenStreetMap or Google Maps). */
  attribution: { text: string; url: string };
  handle: React.RefObject<IslandHandle | null>;
  onClose: () => void;
};

/**
 * The gift's ticket: the offer on one side, your journey on the other, so you can see what you have and what opens next.
 * Demo gifts are labelled, and their code works nowhere. A real, server-issued offer would show its real code and status.
 */
export function GiftTicket({ gift, index, state, known, place, noPlace, stationName, attribution, handle, onClose }: Props) {
  const [revealed, setRevealed] = useState(false);

  const g = content.gift;
  const locked = state === "locked";
  const need = known === null ? null : Math.max(0, giftMilestones[index] - known);
  const rows: [string, string][] = [
    [g.merchant, gift.merchant],
    [g.benefit, gift.benefit],
    [g.expires, gift.expires],
    [g.conditions, gift.conditions],
    [g.status, gift.status],
    ...(gift.instructions ? ([["How to redeem", gift.instructions]] as [string, string][]) : []),
  ];

  return (
    <TicketFrame id={`gift-${index}`} label={g.title} handle={handle} onClose={onClose} wide>
        <div className="grid gap-0 sm:grid-cols-[1.15fr_1fr]">
          {/* The offer */}
          <section className="p-4">
            <p className="font-mono text-[0.6rem] tracking-[0.14em] text-cat-station uppercase">{place && !locked ? content.place.title : gift.demo ? g.kicker : g.realKicker}</p>
            <h2 className="mt-1 font-serif text-xl leading-tight font-semibold">{place && !locked ? place.name : g.title}</h2>
            <p className="text-sm text-taupe">{place && !locked ? content.place.subtitle : g.subtitle}</p>

            {locked ? (
              <p className="mt-3 flex items-start gap-2 border-t border-dashed border-graphite/20 pt-3 text-sm">
                <Lock className="mt-0.5 size-4 shrink-0 text-taupe" aria-hidden />
                <span>{need === null ? content.journey.unknown : g.locked(need)}</span>
              </p>
            ) : (
              place ? (
                <PlaceCard place={place} stationName={stationName} attribution={attribution} />
              ) : (
                <>
                  {noPlace && <p className="mt-3 text-[0.72rem] text-taupe">{noPlace === "no-station" ? content.place.pickStop : noPlace === "unavailable" ? content.place.lookupFailed : content.place.looking}</p>}
                  <dl className="mt-3 space-y-2 border-t border-dashed border-graphite/20 pt-3 text-[0.8rem] leading-snug">
                    {rows.map(([label, value]) => (
                      <div key={label}>
                        <dt className="font-mono text-[0.58rem] tracking-[0.12em] text-taupe uppercase">{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                    <div>
                      <dt className="font-mono text-[0.58rem] tracking-[0.12em] text-taupe uppercase">{g.code}</dt>
                      <dd>
                        {revealed ? (
                          <span className="inline-block rounded-lg border border-dashed border-graphite/40 bg-stone px-2.5 py-1 font-mono text-sm tracking-wider">{gift.code}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRevealed(true)}
                            className="inline-flex h-8 cursor-pointer items-center rounded-full border border-graphite/30 px-3 text-xs font-medium outline-none hover:border-graphite/60 focus-visible:ring-4 focus-visible:ring-graphite/20"
                          >
                            {g.reveal}
                          </button>
                        )}
                        {revealed && gift.demo && <span className="mt-1 block text-[0.7rem] text-taupe">{g.codeNote}</span>}
                      </dd>
                    </div>
                  </dl>
                </>
              )
            )}

            <button data-autofocus type="button" onClick={onClose} className={cn("mt-4", closeButtonClass)}>
              {g.close}
            </button>
          </section>

          {/* The journey */}
          <Journey known={known} highlight={index} />
        </div>
    </TicketFrame>
  );
}

/** Where you are on the island's journey, and when the next gift opens. Nothing is claimed if progress is unknown. */
function Journey({ known, highlight }: { known: number | null; highlight: number }) {
  const j = content.journey;
  const total = unlockSteps.length;
  const next = known === null ? null : nextGift(known);
  const giftAt = (step: number) => giftMilestones.findIndex((m) => m === step);

  return (
    <section className="border-t border-dashed border-graphite/20 bg-stone/50 p-4 sm:border-t-0 sm:border-l">
      <h3 className="font-serif text-base font-semibold">{j.title}</h3>
      <p className="mt-0.5 text-xs text-taupe">
        {known === null ? j.unknown : j.summary(known, total)}
        {known !== null && known < total && <span className="block">{j.nextPiece(unlockSteps[known].name)}</span>}
        {known !== null && (next ? <span className="block font-medium text-graphite">{j.next(next.need)}</span> : <span className="block font-medium text-graphite">{j.allGifts}</span>)}
      </p>

      <Link href="/" className="mt-2 inline-flex h-8 items-center rounded-full border border-graphite/30 px-3 text-xs font-medium outline-none hover:border-graphite/60 focus-visible:ring-4 focus-visible:ring-graphite/20">
        {j.contribute}
      </Link>

      <ol className="mt-3 max-h-60 space-y-1.5 overflow-y-auto pr-1 text-xs sm:max-h-[17rem]">
        <Row done label={j.start} gift={giftAt(0)} highlight={highlight} known={known} />
        {unlockSteps.map((step, i) => (
          <Row key={step.name} done={known !== null && i < known} current={known !== null && i === known} label={step.name} gift={giftAt(i + 1)} highlight={highlight} known={known} />
        ))}
      </ol>
      {known !== null && known >= total && <p className="mt-2 text-[0.68rem] text-taupe">{j.more}</p>}
    </section>
  );
}

function Row({ done, current, label, gift, highlight, known }: { done?: boolean; current?: boolean; label: string; gift: number; highlight: number; known: number | null }) {
  return (
    <li className={cn("flex items-start gap-2", !done && !current && "text-taupe")}>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
          done ? "border-cat-verify bg-cat-verify text-ivory" : current ? "border-graphite" : "border-dashed border-graphite/30",
        )}
      >
        {done && <Check className="size-2.5" />}
      </span>
      <span className={cn("min-w-0 flex-1", current && "font-medium text-graphite")}>
        {label}
        {gift >= 0 && (
          <span
            className={cn(
              "ml-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.62rem] font-medium",
              known !== null && giftMilestones[gift] <= known ? "bg-cat-verify/10 text-cat-verify" : "bg-graphite/8 text-taupe",
              gift === highlight && "ring-1 ring-graphite/40",
            )}
          >
            <GiftIcon className="size-2.5" aria-hidden /> {content.journey.gift(gift + 1)}
          </span>
        )}
      </span>
    </li>
  );
}

/** A real nearby business: photo (with its credit), where it is, how far, and a link to Google Maps. No offer. */
function PlaceCard({ place, stationName, attribution }: { place: NearbyPlace; stationName: string; attribution: { text: string; url: string } }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const p = content.place;
  const distance = formatDistance(place.distanceM);
  const showPhoto = place.photo && !photoFailed;
  return (
    <div className="mt-3 space-y-2.5 border-t border-dashed border-graphite/20 pt-3">
      <div className="relative aspect-[21/9] overflow-hidden rounded-xl bg-stone sm:aspect-[16/9]">
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.photo!.src} alt={place.name} loading="lazy" onError={() => setPhotoFailed(true)} className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-taupe">
            <Utensils className="size-7" aria-hidden />
          </span>
        )}
        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full border border-ivory/70 bg-ivory/70 px-2 py-0.5 text-[0.68rem] font-medium backdrop-blur-md">
          <MapPin className="size-3" aria-hidden /> {p.nearby(distance, stationName)}
        </span>
      </div>
      <p className="text-[0.8rem] leading-snug">
        <span className="font-medium">{place.category}</span>
        {place.area && <span className="text-taupe"> · {place.area}</span>}
      </p>
      <a
        href={place.mapsUri}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-cat-station px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25"
      >
        {p.viewOnMap} <ExternalLink className="size-3" aria-hidden />
      </a>
      <p className="text-[0.66rem] leading-snug text-taupe">
        {p.note(stationName)} {place.photo && !photoFailed ? `${p.photoBy(place.photo.credit)} · ` : ""}
        <a href={attribution.url} target="_blank" rel="noopener noreferrer" className="underline">
          {attribution.text}
        </a>
      </p>
    </div>
  );
}
