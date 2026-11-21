"use client";

import { useEffect, useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { content } from "./content";

/** Secondary explanations, sound, the preview and the credit, tucked behind one small button at the edge. */
export function IslandHelp({ preview, onTogglePreview }: { preview: boolean; onTogglePreview: () => void }) {
  const [open, setOpen] = useState(false);
  const h = content.help;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="absolute right-3 bottom-3 z-10 flex flex-col items-end gap-2 sm:right-4 sm:bottom-4">
      {open && (
        <div role="dialog" aria-label={h.title} className="w-[min(18rem,calc(100vw-1.5rem))] space-y-2 rounded-2xl border border-hairline bg-ivory p-4 font-ui text-xs text-graphite shadow-float">
          <p className="font-serif text-base font-semibold">{h.title}</p>
          <ul className="space-y-1 text-taupe">
            {h.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
            <li>{h.sound}</li>
          </ul>
          {preview && <p className="text-taupe">{h.previewNote}</p>}
          <button
            type="button"
            onClick={onTogglePreview}
            className="inline-flex h-8 cursor-pointer items-center rounded-full border border-graphite/25 px-3 font-medium outline-none hover:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/20"
          >
            {preview ? h.previewOffLabel : h.previewLabel}
          </button>
          <p className="border-t border-hairline pt-2 text-[0.68rem] text-taupe">
            <a className="underline" href={content.creditUrl} target="_blank" rel="noreferrer">
              {content.credit}
            </a>
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? h.close : h.open}
        className="grid size-10 cursor-pointer place-items-center rounded-full border border-hairline bg-ivory/85 text-taupe shadow-float backdrop-blur-md outline-none hover:text-graphite focus-visible:ring-4 focus-visible:ring-graphite/20"
      >
        {open ? <X className="size-4" aria-hidden /> : <CircleHelp className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
