import { site } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted-foreground">
        {site.name} · built at BostonHacks 2026
      </div>
    </footer>
  );
}
