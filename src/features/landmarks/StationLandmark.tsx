import Image from "next/image";
import { landmarks, landmarkSrc, type LandmarkId, type LandmarkView } from "./catalog";
import styles from "./landmark.module.css";

type ArtProps = {
  id: LandmarkId;
  view?: LandmarkView;
  size?: number;
  decorative?: boolean;
};

export function LandmarkArt({ id, view, size, decorative }: ArtProps) {
  return (
    <Image
      src={landmarkSrc(id, view)}
      alt={decorative ? "" : `${landmarks[id].label}, ${view ?? landmarks[id].view} view`}
      width={40}
      height={40}
      unoptimized
      draggable={false}
      className={styles.art}
      style={size === undefined ? undefined : { width: size }}
    />
  );
}

type MarkerProps = Pick<ArtProps, "id" | "size" | "view"> & {
  stationName: string;
  onSelect?: () => void;
  selected?: boolean;
};

// The parent positions a zero-size anchor at the projected station coordinate.
export function StationLandmark({ stationName, onSelect, selected, ...art }: MarkerProps) {
  const content = <span className={styles.float}><LandmarkArt {...art} decorative={!!onSelect} /></span>;
  if (!onSelect) return <span className={styles.marker}>{content}</span>;
  return (
    <button
      type="button"
      className={styles.marker}
      onClick={onSelect}
      aria-label={`${landmarks[art.id].label} at ${stationName}`}
      aria-pressed={selected}
    >
      {content}
    </button>
  );
}
