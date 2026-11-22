"use client";

import { useRef } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { settings } from "@/features/challenge/content";
import { glassClass, glassStyle, primaryClass, primaryStyle } from "@/features/explore/glass";
import { cn } from "@/lib/utils";
import type { Summary } from "./compose";
import { PixelIcon, type PixelName } from "./PixelIcon";
import { text } from "./content";

/** The one primary action of a screen: pressed olive-green glass, full width. */
export function Primary({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} style={primaryStyle} className={cn(primaryClass, "h-12 w-full px-5 text-base", className)} />;
}

export function Secondary({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} style={glassStyle} className={cn(glassClass, "h-11 w-full px-5 text-[0.95rem]", className)} />;
}

export { glassClass, glassStyle, primaryClass, primaryStyle };

/** A big tappable answer. A real radio underneath, so arrow keys and screen readers work. */
export function Choice({
  name, value, checked, onChange, label, hint, icon, lucide,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  icon?: PixelName;
  lucide?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "relative flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors focus-within:ring-4 focus-within:ring-graphite/25",
        checked ? "border-cat-verify/70 bg-cat-verify/12" : "border-graphite/12 bg-ivory/60 hover:bg-ivory/90",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", checked ? "border-cat-verify" : "border-graphite/40")}
      >
        {checked && <span className="size-2.5 rounded-full bg-cat-verify" />}
      </span>
      {icon && <PixelIcon name={icon} className={cn("size-7", checked ? "text-cat-verify" : "text-taupe")} />}
      {lucide}
      <span className="min-w-0 leading-snug">
        <span className="block text-base font-semibold text-graphite">{label}</span>
        {hint && <span className="block text-sm text-taupe">{hint}</span>}
      </span>
    </label>
  );
}

/** The summary of one update: place, what was observed, when, the note. Only the rider's own answers. */
export function SummaryCard({ summary }: { summary: Summary }) {
  const rows: [string, React.ReactNode][] = [
    [text.place, summary.unit ? `${summary.place} · ${summary.unit}` : summary.place],
    [
      text.observed,
      <span key="o" className="inline-flex items-center gap-1.5">
        <PixelIcon name={summary.tone === "ok" ? "check" : summary.tone === "problem" ? "barrier" : "question"} className="size-4 text-cat-verify" />
        {summary.status}
      </span>,
    ],
    [text.when, summary.when],
  ];
  if (summary.note) rows.push([text.note, `“${summary.note}”`]);
  if (summary.extra) rows.push([text.extra, `“${summary.extra}”`]);
  if (summary.hasPhoto) rows.push([text.photoAttached, "Yes"]);
  return (
    <dl className="divide-y divide-graphite/10 rounded-2xl border border-graphite/12 bg-ivory/70 px-4 py-1">
      {rows.map(([label, value]) => (
        <div key={label} className="py-2.5">
          <dt className="text-xs font-medium tracking-wide text-taupe uppercase">{label}</dt>
          <dd className="mt-0.5 text-base leading-snug text-graphite">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Add or change one photo. Two hidden file inputs: the library and the camera (phones). */
export function PhotoField({
  photo, error, onPick, onRemove,
}: {
  photo: { file: File; previewUrl: string } | null;
  error: string | null;
  onPick: (file: File, fromCamera: boolean) => void;
  onRemove: () => void;
}) {
  const library = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const accept = settings.acceptedPhotoTypes.join(",");
  const change = (fromCamera: boolean) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(file, fromCamera);
    e.target.value = "";
  };
  return (
    <div className="space-y-2.5">
      <input ref={library} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-label={text.addPhoto} onChange={change(false)} />
      <input ref={camera} type="file" accept={accept} capture="environment" className="sr-only" tabIndex={-1} aria-label={text.takePhoto} onChange={change(true)} />
      {photo ? (
        <div className="flex items-center gap-3 rounded-2xl border border-graphite/12 bg-ivory/70 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview from the rider's device */}
          <img src={photo.previewUrl} alt="Your photo" className="size-14 rounded-xl object-cover" />
          <span className="min-w-0 flex-1 truncate text-sm text-taupe">{photo.file.name}</span>
          <button type="button" aria-label={text.replacePhoto} onClick={() => library.current?.click()} className="grid size-11 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 focus-visible:ring-4 focus-visible:ring-graphite/25">
            <ImagePlus className="size-5" aria-hidden />
          </button>
          <button type="button" aria-label={text.removePhoto} onClick={onRemove} className="grid size-11 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 focus-visible:ring-4 focus-visible:ring-graphite/25">
            <X className="size-5" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => library.current?.click()} style={glassStyle} className={cn(glassClass, "h-12 px-3 text-sm")}>
            <ImagePlus className="size-4" aria-hidden /> {text.addPhoto}
          </button>
          <button type="button" onClick={() => camera.current?.click()} style={glassStyle} className={cn(glassClass, "h-12 px-3 text-sm")}>
            <Camera className="size-4" aria-hidden /> {text.takePhoto}
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-cat-service">{error}</p>}
      <p className="text-sm leading-snug text-taupe">{text.photoHelp}</p>
    </div>
  );
}
