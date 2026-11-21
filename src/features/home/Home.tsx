import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { content } from "./content";

export function Home() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">{content.blurb}</CardContent>
    </Card>
  );
}
