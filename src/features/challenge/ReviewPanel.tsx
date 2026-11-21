import { Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { content } from "./content";
import type { Check as CheckResult, ReviewResult } from "./review";

function Row({ label, check }: { label: string; check: CheckResult }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 border-ink",
          check.ok ? "bg-leaf" : "bg-sun",
        )}
      >
        {check.ok ? <Check className="size-3.5" aria-label="Looks good" /> : <TriangleAlert className="size-3.5" aria-label="Needs work" />}
      </span>
      <span>
        <span className="font-bold">{label}</span>
        <span className="block text-sm text-muted-foreground">{check.note}</span>
      </span>
    </li>
  );
}

export function ReviewPanel({ result, isCurrent }: { result: ReviewResult; isCurrent: boolean }) {
  return (
    <section aria-label="AI coach feedback" className="space-y-4 rounded-2xl border-2 border-ink bg-paper p-4 text-ink shadow-chip">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-heading text-lg font-bold">AI coach</h3>
        <span
          className={cn(
            "rounded-full border-2 border-ink px-3 py-0.5 text-xs font-bold",
            result.status === "reviewed" ? "bg-leaf" : "bg-sun",
          )}
        >
          {result.status === "reviewed" ? "Looks good" : "Needs revision"}
        </span>
      </div>

      {!isCurrent && (
        <p role="status" className="rounded-xl border-2 border-ink bg-sun px-3 py-2 text-sm font-bold">
          {content.stale}
        </p>
      )}

      <ul className={cn("space-y-3", !isCurrent && "opacity-50")}>
        <Row label="Relevance" check={result.relevance} />
        <Row label="Specificity" check={result.specificity} />
        <Row label="Completeness" check={result.completeness} />
        {result.photo && <Row label="Photo" check={result.photo} />}
      </ul>

      <p className="text-xs text-muted-foreground">
        {result.source === "practice" && <>{content.practiceNote} </>}
        {content.aiDisclaimer}
      </p>
    </section>
  );
}
