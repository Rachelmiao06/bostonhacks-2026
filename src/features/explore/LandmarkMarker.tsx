import { LandmarkArt } from "@/features/landmarks/StationLandmark";
import type { LandmarkId } from "@/features/landmarks/catalog";
import styles from "@/features/landmarks/landmark.module.css";

/** The station button owns position, keyboard focus and selection for both parts. */
export function LandmarkMarker({ id, size }: { id: LandmarkId; size: number }) {
  return (
    <span aria-hidden className={styles.mapSprite} data-landmark={id}>
      <span className={styles.float}><LandmarkArt id={id} size={size} decorative /></span>
    </span>
  );
}
