import { content } from "./content";
import { ExploreLoader } from "./ExploreLoader";

/** The map stands alone and fills the screen. The title is kept for screen readers only. */
export function Explore() {
  return (
    <>
      <h1 className="sr-only">{content.title}</h1>
      <ExploreLoader />
    </>
  );
}
