// Site settings and feature flags in one place. Rename the project here.
export const site = {
  name: "T Party",
  tagline: "Make every ride count",
  description:
    "T Party turns feedback on Boston's public transit into a game. Explore a pixel-art MBTA map, take on real transit challenges, and get rewarded for feedback worth reading.",
  // The map is the home page. `short` is the label on phone screens.
  nav: [
    { href: "/", label: "Explore", short: "Explore" },
    { href: "/world", label: "My World", short: "My World" },
  ],
  /** Quieter pages, in the "more" menu. Quests is the list of every quest; Stats are the team's KPIs. */
  moreNav: [
    { href: "/challenge", label: "Quests" },
    { href: "/stats", label: "Stats" },
    { href: "/about", label: "About" },
  ],
};
