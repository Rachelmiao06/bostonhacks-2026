"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { landmarks, landmarkViews, type LandmarkId, type LandmarkView } from "./catalog";
import { LandmarkArt } from "./StationLandmark";

export function LandmarkDetail({ id, size = 224 }: { id: LandmarkId; size?: number }) {
  return <ViewPicker key={id} id={id} size={size} />;
}

function ViewPicker({ id, size }: { id: LandmarkId; size: number }) {
  const [view, setView] = useState<LandmarkView>(landmarks[id].view);
  return (
    <section className="flex flex-col items-center gap-3" aria-label="Enlarged landmark">
      <h2 className="text-xl font-bold">{landmarks[id].label}</h2>
      <LandmarkArt id={id} view={view} size={size} />
      <div className="flex gap-2">
        {landmarkViews.map((angle) => (
          <Button key={angle} variant={view === angle ? "default" : "outline"}
            aria-pressed={view === angle} onClick={() => setView(angle)} className="capitalize">
            {angle}
          </Button>
        ))}
      </div>
    </section>
  );
}
