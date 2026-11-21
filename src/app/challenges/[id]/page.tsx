import { Suspense } from "react";
import { QuestPage } from "@/features/challenge/QuestPage";
import { details } from "@/features/challenge/content";

// Quest ids are live MBTA alert ids, unknown at build time, so params are read inside Suspense
// (generateStaticParams would need at least one real id at build time).
// instant = false: the shared nav reads usePathname() outside Suspense, which blocks prerendering
// on any dynamic route. Remove this line once NavLinks is wrapped in Suspense in site-nav.tsx.
export const instant = false;

export default function Page({ params }: PageProps<"/challenges/[id]">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl font-pixel text-xs text-foreground/80">{details.loading}</p>}>
      {params.then(({ id }) => (
        <QuestPage id={id} />
      ))}
    </Suspense>
  );
}
