"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, MapPin } from "lucide-react";
import { formatDistance, type NearbyPlace } from "@/lib/places";
import { TicketFrame } from "./TicketFrame";
import { content, giftMilestones, nextGift, type GiftState } from "./content";
import type { Gift } from "./gifts";
import type { IslandHandle } from "./IslandScene";
import { Voucher } from "./Voucher";
import { VoucherArt, type ArtKind } from "./VoucherArt";

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
  /** Close this voucher and open the collection gallery. */
  onOpenCollection: () => void;
};

const artOfPlace = (kind: NearbyPlace["kind"]): ArtKind => (kind === "cafe" ? "cafe" : kind === "bakery" ? "bakery" : "restaurant");

/**
 * A gift opens into a small paper voucher that unfolds out of it (picture, name, offer, tear line, stub). Three kinds,
 * never mixed up:
 *  - a REAL nearby place: its picture, name, category, address, distance and a map link. No offer: a listing is not a promotion.
 *  - a DEMO offer: a made-up merchant, stamped "Demo — Not Redeemable", with an example code that works nowhere.
 *  - still LOCKED: a folded voucher that says how many contributions open it.
 * The journey itself lives in the collection gallery, not here.
 */
export function GiftTicket({ gift, index, state, known, place, noPlace, stationName, attribution, handle, onClose, onOpenCollection }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const v = content.voucher;
  const g = content.gift;
  const locked = state === "locked";
  const need = known === null ? null : Math.max(0, giftMilestones[index] - known);
  const next = known === null ? null : nextGift(known);

  const foot = (
    <>
      {next && <p>{v.nextGift(next.need)}</p>}
      <button type="button" onClick={onOpenCollection} className="inline-flex cursor-pointer items-center gap-0.5 font-medium text-graphite underline decoration-graphite/30 underline-offset-4 outline-none hover:decoration-graphite focus-visible:ring-2 focus-visible:ring-graphite/40">
        {v.collection} <ChevronRight className="size-3" aria-hidden />
      </button>
    </>
  );

  let body: React.ReactNode;
  if (locked) {
    body = (
      <Voucher
        art={<VoucherArt kind="sealed" />}
        kicker={v.stillFolded}
        title={v.lockedTitle}
        sub={need === null ? content.journey.unknown : g.locked(need)}
        stub={
          <Link href="/" className="inline-flex h-9 w-full items-center justify-center rounded-full bg-graphite px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25">
            {v.contribute}
          </Link>
        }
        foot={foot}
        closeLabel={g.close}
        onClose={onClose}
      />
    );
  } else if (place) {
    const distance = formatDistance(place.distanceM);
    const showPhoto = place.photo && !photoFailed;
    body = (
      <Voucher
        art={
          showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={place.photo!.src} alt={place.name} loading="lazy" onError={() => setPhotoFailed(true)} className="size-full object-cover" />
          ) : (
            <VoucherArt kind={artOfPlace(place.kind)} />
          )
        }
        chip={content.place.nearby(distance, stationName)}
        kicker={v.kicker}
        title={place.name}
        sub={`${place.category}${place.area ? ` · ${place.area}` : ""}`}
        stub={
          <a href={place.mapsUri} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-cat-station px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25">
            <MapPin className="size-3.5" aria-hidden /> {content.place.viewOnMap} <ExternalLink className="size-3" aria-hidden />
          </a>
        }
        foot={
          <>
            <p>
              {content.place.note(stationName)} {showPhoto ? `${content.place.photoBy(place.photo!.credit)} · ` : ""}
              <a href={attribution.url} target="_blank" rel="noopener noreferrer" className="underline">
                {attribution.text}
              </a>
            </p>
            {foot}
          </>
        }
        closeLabel={g.close}
        onClose={onClose}
      />
    );
  } else {
    body = (
      <Voucher
        art={<VoucherArt kind={gift.art} />}
        stamp={g.kicker}
        kicker={v.kicker}
        title={gift.name}
        sub={noPlace === "no-station" ? content.place.pickStop : noPlace === "unavailable" ? content.place.lookupFailed : noPlace === "loading" ? content.place.looking : v.demoSub}
        offer={{ label: v.exampleOffer, text: gift.benefit.replace(", as an example", "") }}
        stub={
          revealed ? (
            <div>
              <span className="inline-block rounded-lg border border-dashed border-graphite/40 bg-stone px-3 py-1.5 font-mono text-sm tracking-wider">{gift.code}</span>
              <p className="mt-1 text-[0.7rem] text-graphite/70">{v.worksNowhere}</p>
            </div>
          ) : (
            <button type="button" onClick={() => setRevealed(true)} className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-full border border-graphite/35 px-4 text-xs font-medium outline-none hover:border-graphite/60 focus-visible:ring-4 focus-visible:ring-graphite/20">
              {v.revealExample}
            </button>
          )
        }
        foot={
          <>
            <p>{v.smallPrint}</p>
            {foot}
          </>
        }
        closeLabel={g.close}
        onClose={onClose}
      />
    );
  }

  return (
    <TicketFrame id={`gift-${index}`} label={g.title} handle={handle} onClose={onClose} variant="voucher">
      {body}
    </TicketFrame>
  );
}
