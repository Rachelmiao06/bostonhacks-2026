"use client";

import { useRef } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { content, settings } from "./content";
import type { PhotoState } from "./photo";

type Props = {
  photo: PhotoState | null;
  error: string | null;
  disabled: boolean;
  onPick: (file: File, options?: { fromCamera?: boolean }) => void;
  onRemove: () => void;
};

export function PhotoField({ photo, error, disabled, onPick, onRemove }: Props) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const accept = settings.acceptedPhotoTypes.join(",");

  return (
    <div className="space-y-3">
      {/* Two hidden inputs: the first opens the photo library or file picker, the second opens the phone camera. */}
      <input
        ref={libraryRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-label={content.addPhoto}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = ""; // allow picking the same file again
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept={accept}
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-label={content.takePhoto}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file, { fromCamera: true });
          e.target.value = "";
        }}
      />

      {photo ? (
        <div className="flex items-center gap-4 rounded-2xl border-2 border-ink bg-muted p-3 text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a user file */}
          <img
            src={photo.previewUrl}
            alt="Preview of the photo you added"
            className="size-24 rounded-xl border-2 border-ink object-cover"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-sm font-bold">{photo.meta.fileName}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => cameraRef.current?.click()}>
                <Camera aria-hidden /> {content.retakePhoto}
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => libraryRef.current?.click()}>
                <ImagePlus aria-hidden /> {content.replacePhoto}
              </Button>
              <Button type="button" variant="destructive" size="sm" disabled={disabled} onClick={onRemove}>
                <Trash2 aria-hidden /> {content.removePhoto}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" disabled={disabled} onClick={() => cameraRef.current?.click()}>
              <Camera aria-hidden /> {content.takePhoto}
            </Button>
            <Button type="button" variant="secondary" disabled={disabled} onClick={() => libraryRef.current?.click()}>
              <ImagePlus aria-hidden /> {content.addPhoto}
            </Button>
          </div>
          <p className="text-sm opacity-80">
            {content.photoHint} {content.cameraHint}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border-2 border-ink bg-cherry px-3 py-2 text-sm font-bold text-paper">
          {error}
        </p>
      )}
    </div>
  );
}
