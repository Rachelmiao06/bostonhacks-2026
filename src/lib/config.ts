// Site settings and feature flags in one place. Rename the project here.
export const site = {
  name: "T Party",
  tagline: "Make every ride count",
  description:
    "T Party turns feedback on Boston's public transit into a game. Explore a pixel-art MBTA map, take on real transit challenges, and get rewarded for feedback worth reading.",
  // The map is the home page. `short` is the label on phone screens.
  nav: [
    { href: "/", label: "Explore", short: "Explore" },
    { href: "/my-challenges", label: "My Journey", short: "Journey" },
    { href: "/rewards", label: "Collection", short: "Collection" },
  ],
  /** Quieter pages, in the "more" menu. */
  moreNav: [{ href: "/about", label: "About" }],
};
