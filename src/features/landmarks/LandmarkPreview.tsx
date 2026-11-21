"use client";

import Link from "next/link";
import { useState } from "react";
import { LandmarkDetail } from "./LandmarkDetail";
import { landmarks, type LandmarkId } from "./catalog";
import { StationLandmark } from "./StationLandmark";

export function LandmarkPreview() {
  const [id, setId] = useState<LandmarkId>("boston-swan-boat");
  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Station landmarks</h1>
      <Link className="inline-block underline" href="/explore?sample=green-b">Explore the Green Line B sample</Link>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(landmarks) as LandmarkId[]).map((key) => (
          <div key={key} className="grid justify-items-center rounded-lg bg-card px-2 pb-2 pt-20 text-card-foreground">
            <div className="relative size-0">
              <StationLandmark id={key} stationName="preview station" selected={id === key} onSelect={() => setId(key)} />
            </div>
            <span className="size-2 rounded-full bg-ink" aria-hidden />
            <span className="mt-1 text-center text-sm">{landmarks[key].label}</span>
          </div>
        ))}
      </div>
      <LandmarkDetail id={id} />
    </section>
  );
}
