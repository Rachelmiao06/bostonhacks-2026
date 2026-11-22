"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { askTada, type AskAnswer } from "./api";
import { content } from "./content";
import { KnittedMascot } from "./Knitted";
import { PrimaryButton, Sheet, field } from "./ui";
import type { CheckResult, NearbyCase } from "./types";

type Turn = { q: string; a?: AskAnswer; err?: string };

/** A small contextual helper, not a chatbot: it only sees what the photo analysis found, and answers from that or from verified pages. */
export function AskTada({ result, service, nearby, onClose }: { result: CheckResult; service: string; nearby: NearbyCase[] | "failed" | null; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const mbta = result.authority === "MBTA";
  const chips = mbta ? content.ask.suggestionsMbta : content.ask.suggestions;

  async function ask(question: string) {
    const text = question.trim();
    if (text.length < 3 || busy) return;
    setBusy(true);
    setQ("");
    setTurns((t) => [...t, { q: text }]);
    try {
      const a = await askTada({
        question: text,
        context: {
          headline: result.headline,
          explanation: result.explanation,
          serviceName: result.verdict === "fixable" ? service : "",
          authority: result.authority,
          authorityName: result.authorityName,
          nearby: Array.isArray(nearby) ? nearby.map((n) => ({ serviceName: n.serviceName, status: n.status, distanceM: n.distanceM, team: n.team })) : [],
        },
      });
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a } : x)));
    } catch (e) {
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, err: e instanceof Error ? e.message : content.ask.failed } : x)));
    }
    setBusy(false);
  }

  return (
    <Sheet title={content.ask.title} icon={<KnittedMascot className="size-11" />} onClose={onClose}>
      <div className="grid gap-4">
        <p className="text-sm text-taupe">{content.ask.note}</p>
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => ask(c)}
                className="rounded-full border border-hairline bg-ivory px-3 py-1.5 text-sm outline-none hover:bg-stone-deep/50 focus-visible:ring-2 focus-visible:ring-graphite/50"
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="grid gap-3" aria-live="polite">
          {turns.map((t, i) => (
            <div key={i} className="grid gap-1.5 text-sm">
              <p className="justify-self-end rounded-2xl bg-stone-deep/60 px-3 py-2">{t.q}</p>
              {t.a ? (
                <div className="grid gap-1.5 rounded-2xl border border-hairline p-3">
                  <p>{t.a.answer}</p>
                  {t.a.source && (
                    <a href={t.a.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1 text-cat-verify underline underline-offset-4">
                      {content.ask.sourceLead}: {t.a.source.label} <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  )}
                </div>
              ) : t.err ? (
                <p role="alert" className="rounded-2xl bg-stone-deep/50 px-3 py-2 text-taupe">
                  {t.err}
                </p>
              ) : (
                <p className="text-taupe">{content.ask.thinking}</p>
              )}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(q);
          }}
          className="flex gap-2"
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={280} placeholder={content.ask.placeholder} aria-label={content.ask.placeholder} className={field} />
          <PrimaryButton type="submit" disabled={busy || q.trim().length < 3} className="px-4">
            {content.ask.send}
          </PrimaryButton>
        </form>
      </div>
    </Sheet>
  );
}
