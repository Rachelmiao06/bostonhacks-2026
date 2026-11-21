export const landmarkViews = ["front", "side", "back"] as const;
export type LandmarkView = (typeof landmarkViews)[number];

export const landmarks = {
  "boston-swan-boat": { label: "Boston Swan Boat", view: "side" },
  "mbta-green-line-trolley": { label: "Green Line trolley", view: "side" },
  "duck-boat": { label: "Duck boat", view: "front" },
  "red-sox-b-cap": { label: "Red Sox cap", view: "front" },
  "make-way-for-ducklings-statue": { label: "Make Way for Ducklings", view: "side" },
  "golden-grasshopper": { label: "Golden grasshopper", view: "side" },
  "boston-cream-pie-slice": { label: "Boston cream pie", view: "front" },
  "chowder-bowl": { label: "Chowder bowl", view: "front" },
} as const satisfies Record<string, { label: string; view: LandmarkView }>;

export type LandmarkId = keyof typeof landmarks;

// Demo placements. Keys match /api/stations; move a piece here to change its station.
export const stationLandmarks: Readonly<Partial<Record<string, LandmarkId>>> = {
  "place-lake": "boston-swan-boat",
  "place-buest": "mbta-green-line-trolley",
  "place-wascm": "duck-boat",
  "place-kencl": "red-sox-b-cap",
  "place-amory": "make-way-for-ducklings-statue",
  "place-brico": "golden-grasshopper",
  "place-harvd": "boston-cream-pie-slice",
  "place-sthld": "chowder-bowl",
};

export function landmarkSrc(id: LandmarkId, view: LandmarkView = landmarks[id].view) {
  return `/assets/landmarks/${id}-${view}.webp`;
}
