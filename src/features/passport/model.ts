import type { QuestKind } from "@/lib/mbta";
import { landmarks, type LandmarkId } from "@/features/landmarks/catalog";
import { categoryOfKind, kindLabels, categories, type CategoryId } from "@/features/explore/content";
import type { MyProgress } from "@/features/explore/progress";

/** One finished contribution: a completed report or a checked fix. */
export type PassportStamp = {
  id: string;
  alertId: string;
  category: CategoryId;
  kind: string;
  station: string;
  date: string;
};

/** A report the rider started and has not finished. */
export type PassportDraft = { id: string; alertId: string; station: string };

/** One slot in the album. `stamp` is the contribution that earned it, or null while it is still locked. */
export type AlbumSlot = { id: LandmarkId; label: string; stamp: PassportStamp | null };

/** Album order. Each new stamp unlocks the next landmark. (Placeholder rule: see README.) */
export const albumOrder = Object.keys(landmarks) as LandmarkId[];

/** All finished contributions, oldest first, so a landmark never changes the stamp that earned it. */
export function stampsOf(data: MyProgress): PassportStamp[] {
  const reports = data.submissions
    .filter((s) => s.status === "completed")
    .map((s): PassportStamp => {
      const category = categoryOfKind[(s.kind ?? "station") as QuestKind] ?? "station";
      return {
        id: `r-${s.alert_id}`,
        alertId: s.alert_id,
        category,
        kind: s.kind ? (kindLabels[s.kind as QuestKind] ?? categories.find((c) => c.id === category)!.label) : categories.find((c) => c.id === category)!.label,
        station: s.station_name ?? "",
        date: s.completed_at ?? s.updated_at,
      };
    });
  const checks = data.verifications.map(
    (v): PassportStamp => ({
      id: `v-${v.alert_id}`,
      alertId: v.alert_id,
      category: "verify",
      kind: categories.find((c) => c.id === "verify")!.label,
      station: v.station_name,
      date: v.created_at,
    }),
  );
  return [...reports, ...checks].sort((a, b) => a.date.localeCompare(b.date));
}

export function draftsOf(data: MyProgress): PassportDraft[] {
  return data.submissions
    .filter((s) => s.status !== "completed")
    .map((s) => ({ id: s.id, alertId: s.alert_id, station: s.station_name ?? "" }));
}

export function albumOf(stamps: PassportStamp[]): AlbumSlot[] {
  return albumOrder.map((id, i) => ({ id, label: landmarks[id].label, stamp: stamps[i] ?? null }));
}

/** Stamps earned past the last landmark. */
export const extraStamps = (stamps: PassportStamp[]) => Math.max(0, stamps.length - albumOrder.length);
