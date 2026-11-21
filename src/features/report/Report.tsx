import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { content } from "./content";

export function Report() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{content.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">{content.blurb}</CardContent>
      </Card>
    </main>
  );
}
