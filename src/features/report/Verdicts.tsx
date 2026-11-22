"use client";

import { useState } from "react";
import { AlertTriangle, CircleHelp, ChevronRight, ExternalLink, MessageCircle, Phone } from "lucide-react";
import { AskTada } from "./AskTada";
import type { Shot } from "./Camera";
import { content, MBTA_REPORT, OFFICIAL_311 } from "./content";
import { KnittedBuilding, KnittedIcon } from "./Knitted";
import { NearbyMissions } from "./NearbyMissions";
import { Disclosure, PrimaryButton, SecondaryButton } from "./ui";
import type { CheckResult } from "./types";

const shell = "mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-hairline bg-ivory shadow-float motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200";
const linkBtn =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-cat-verify px-5 py-2 text-center text-[0.95rem] font-medium text-ivory outline-none hover:bg-cat-verify/90 focus-visible:ring-2 focus-visible:ring-graphite/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

/** Everything that is not a Boston 311 report: private or unclear photos (D), emergencies (E), and problems for another authority (C). Nothing is ever sent from here. */
export function Verdict({ shot, result, onRetake, onCancel }: { shot: Shot; result: CheckResult; onRetake: () => void; onCancel: () => void }) {
  const [asking, setAsking] = useState(false);

  if (result.verdict === "emergency") {
    return (
      <article className={`${shell} border-cherry/50`} role="alert">
        <div className="grid gap-4 p-5">
          <h1 className="flex items-center gap-2 font-serif text-3xl leading-tight font-semibold">
            <AlertTriangle className="size-6 shrink-0 text-cherry" aria-hidden /> {content.verdict.emergency.title}
          </h1>
          <p>{content.verdict.emergency.body}</p>
          <a href="tel:911" className={linkBtn}>
            <Phone className="size-4" aria-hidden /> {content.verdict.emergency.call}
          </a>
          <button type="button" onClick={onCancel} className="justify-self-start text-sm text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50">
            {content.startOver}
          </button>
        </div>
      </article>
    );
  }

  const photo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={shot.dataUrl} alt="Your photo" className="aspect-[16/10] max-h-48 w-full bg-stone-deep object-cover sm:aspect-[4/3] sm:max-h-64" />
  );

  if (result.verdict === "other_authority") {
    const mbta = result.authority === "MBTA";
    return (
      <article className={shell}>
        {photo}
        <div className="grid gap-5 p-5">
          <div>
            <p className="text-sm font-medium text-cat-verify">{content.result.found}</p>
            <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold text-balance sm:text-4xl">{result.headline || content.verdict.otherTitle}</h1>
            {result.explanation && <p className="mt-2 text-taupe">{result.explanation}</p>}
          </div>

          <section className="grid gap-3 rounded-2xl bg-sage p-4" aria-label={content.result.helpLabel}>
            <div className="flex items-start gap-3">
              {mbta ? <KnittedIcon name="bank" className="size-12 shrink-0" /> : <KnittedBuilding className="size-14 shrink-0" />}
              <div>
                <p className="text-xs font-medium tracking-wide text-taupe uppercase">{content.result.helpLabel}</p>
                <p className="font-serif text-2xl font-semibold">{mbta ? content.verdict.mbta.name : content.verdict.otherTitle}</p>
                {mbta && <p className="text-sm text-taupe">{content.verdict.mbta.full}</p>}
                {!mbta && result.authorityName && (
                  <p className="text-sm text-taupe">
                    {content.verdict.other.label}: {result.authorityName} ({content.verdict.other.unverified})
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm">{mbta ? content.verdict.mbta.body : content.verdict.other.limit}</p>
            <a href={mbta ? MBTA_REPORT : OFFICIAL_311} target="_blank" rel="noopener noreferrer" className={linkBtn}>
              {mbta ? content.verdict.mbta.cta : content.verdict.other.cta} <ExternalLink className="size-4" aria-hidden />
            </a>
            <p className="text-xs text-taupe">{mbta ? content.verdict.mbta.note : content.verdict.other.note}</p>
          </section>

          {/* An extra option, never a replacement for the MBTA link above. */}
          {mbta && <NearbyMissions lat={shot.lat} lng={shot.lng} result={result} />}

          <ul className="grid divide-y divide-hairline border-y border-hairline">
            <li>
              <button type="button" onClick={() => setAsking(true)} className="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-graphite/50">
                <MessageCircle className="size-4 text-taupe" aria-hidden />
                <span className="flex-1 font-medium">{content.result.rowAsk}</span>
                <ChevronRight className="size-4 text-taupe" aria-hidden />
              </button>
            </li>
          </ul>
          <div className="flex items-center justify-between">
            <button type="button" onClick={onRetake} className="text-sm text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50">
              {content.verdict.retakeCta}
            </button>
            <button type="button" onClick={onCancel} className="text-sm text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50">
              {content.startOver}
            </button>
          </div>
        </div>
        {asking && <AskTada result={result} service="" nearby={null} onClose={() => setAsking(false)} />}
      </article>
    );
  }

  // Case D: private property, or a photo we cannot work from.
  return (
    <article className={shell}>
      {photo}
      <div className="grid gap-4 p-5">
        <div>
          <h1 className="font-serif text-3xl leading-tight font-semibold text-balance">{result.verdict === "private" ? content.verdict.private : content.verdict.unclear}</h1>
          <p className="mt-2">{result.reason}</p>
          <p className="mt-1 text-sm text-taupe">{content.nothingSent}</p>
        </div>
        <PrimaryButton autoFocus className="h-12 w-full" onClick={onRetake}>
          {content.verdict.retakeCta}
        </PrimaryButton>
        <Disclosure
          summary={
            <span className="inline-flex items-center gap-1.5">
              <CircleHelp className="size-4" aria-hidden /> {content.verdict.wrongSummary}
            </span>
          }
        >
          <p>{content.verdict.wrongBody}</p>
          <a href={OFFICIAL_311} target="_blank" rel="noopener noreferrer" className="w-fit text-graphite underline underline-offset-4">
            Open Boston 311
          </a>
        </Disclosure>
        <SecondaryButton className="justify-self-start" onClick={onCancel}>
          {content.startOver}
        </SecondaryButton>
      </div>
    </article>
  );
}
