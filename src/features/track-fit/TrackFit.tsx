import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { content, type Fit } from "./content";

const tone: Record<Fit, string> = {
  covered: "bg-leaf/25 text-ink",
  partly: "bg-sun/30 text-ink",
  gap: "bg-cherry/20 text-ink",
};

export function TrackFit() {
  const counts = content.items.reduce((n, i) => ({ ...n, [i.fit]: (n[i.fit] ?? 0) + 1 }), {} as Partial<Record<Fit, number>>);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{content.trackName}</p>
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <p className="text-muted-foreground">{content.prompt}</p>
        <p className="text-sm">
          {content.intro} {counts.covered ?? 0} {content.labels.covered.toLowerCase()}, {counts.partly ?? 0}{" "}
          {content.labels.partly.toLowerCase()}, {counts.gap ?? 0} {content.labels.gap.toLowerCase()}.
        </p>
      </header>
      <ol className="flex flex-col gap-3">
        {content.items.map((item, i) => (
          <li key={item.question}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-3 text-base">
                  <span>
                    {i + 1}. {item.question}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tone[item.fit]}`}>
                    {content.labels[item.fit]}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <p>{item.evidence}</p>
                <p className="text-muted-foreground">
                  <strong>{content.nextLabel}:</strong> {item.next}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </main>
  );
}
