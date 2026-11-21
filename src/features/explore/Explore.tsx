import { content } from "./content";
import { ExploreLoader } from "./ExploreLoader";

export function Explore() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="font-pixel text-xl sm:text-2xl">{content.title}</h1>
        <p className="text-lg text-foreground/80">{content.blurb}</p>
      </header>
      <ExploreLoader />
    </div>
  );
}
