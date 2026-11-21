import { site } from "@/lib/config";
import { Coin } from "./coin";

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-ink bg-ink/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <p className="font-pixel text-[0.6rem] leading-relaxed text-paper/90">
          {site.name} · Nov 21-22
        </p>
        <span className="flex items-center gap-2 font-pixel text-[0.6rem] text-sun">
          <Coin size={20} />
          <span className="max-sm:sr-only">Insert coin</span>
        </span>
      </div>
    </footer>
  );
}
