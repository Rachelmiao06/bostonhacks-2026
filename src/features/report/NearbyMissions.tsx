"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Quest, QuestFeed } from "@/lib/mbta";
import { content } from "./content";
import { describe, KIND_NAMES, suggestMissions, type MissionPick, type MissionSuggestions, type Place } from "./missions";
import type { CheckResult } from "./types";

/**
 * An extra option under the MBTA result: open community missions near the photo.
 * It never replaces the MBTA link, never picks a mission for the user (they open the one they want),
 * and shows nothing at all when there is nothing nearby or the lists cannot be loaded.
 * The photo is not carried over: the mission opens on its own, where a photo is optional.
 */
export function NearbyMissions({ lat, lng, result }: { lat: number; lng: number; result: CheckResult }) {
  const [found, setFound] = useState<MissionSuggestions | null>(null);

  useEffect(() => {
    const ctl = new AbortController();
    const json = <T,>(url: string) => fetch(url, { signal: ctl.signal }).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))));
    Promise.all([json<QuestFeed>("/api/quests"), json<{ stations: Place[] }>("/api/stations")])
      .then(([feed, { stations }]) => setFound(suggestMissions({ lat, lng, aiText: describe(result), quests: feed.quests, places: stations })))
      .catch(() => {}); // Quiet on failure: the MBTA link above is still all the user needs.
    return () => ctl.abort();
    // The photo and its result do not change while this card is on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!found || (found.matches.length === 0 && found.others.length === 0)) return null;
  const m = content.missions;

  return (
    <section aria-labelledby="missions-title" className="grid gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
      <div>
        <h2 id="missions-title" className="font-serif text-2xl font-semibold">
          {m.title}
        </h2>
        <p className="mt-1 text-sm text-taupe">{m.intro}</p>
      </div>
      {found.matches.length > 0 && <Group title={m.matchesTitle} note={m.matchesNote} picks={found.matches} />}
      {found.others.length > 0 && <Group title={m.othersTitle} picks={found.others} />}
    </section>
  );
}

function Group({ title, note, picks }: { title: string; note?: string; picks: MissionPick[] }) {
  return (
    <div className="grid gap-2">
      <div>
        <h3 className="text-xs font-medium tracking-wide text-taupe uppercase">{title}</h3>
        {note && <p className="text-xs text-taupe">{note}</p>}
      </div>
      <ul className="grid gap-2">
        {picks.map(({ quest }) => (
          <li key={quest.id}>
            <MissionCard quest={quest} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MissionCard({ quest }: { quest: Quest }) {
  return (
    // The map's own deep link: it opens this mission's card on the map, one tap from the guided questions.
    <Link
      href={`/?quest=${encodeURIComponent(quest.id)}`}
      className="group flex min-h-16 items-center gap-3 rounded-2xl border border-hairline bg-ivory p-3 text-left outline-none hover:bg-stone-deep/40 focus-visible:ring-2 focus-visible:ring-graphite/50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-taupe">
          {KIND_NAMES[quest.kind]} · {content.missions.at(quest.stationName)}
        </span>
        <span className="line-clamp-2 font-medium text-balance">{quest.facilityName}</span>
        <span className="block text-xs text-taupe">{content.missions.unofficial}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-cat-verify">
        <span>{content.missions.open}</span>
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}
