// Site settings and feature flags in one place. Rename the project here.
export const site = {
  name: "T Party",
  tagline: "Make every ride count",
  description:
    "T Party turns feedback on Boston's public transit into a game. Explore a pixel-art MBTA map, take on real transit challenges, and get rewarded for feedback worth reading.",
  // Three tabs. `also` lists other routes that keep the tab lit (My Challenges lives under Explore, Rewards under My World).
  nav: [
    { href: "/", label: "Explore", short: "Explore", also: ["/explore", "/my-challenges"] },
    { href: "/island", label: "My World", short: "My World", also: ["/rewards"] },
    { href: "/report", label: "Report", short: "Report" },
  ],
  /** Quieter pages, in the "more" menu. Quests is the list of every quest; Stats are the team's KPIs. */
  moreNav: [
    { href: "/challenge", label: "Quests" },
    { href: "/stats", label: "Stats" },
    { href: "/about", label: "About" },
  ],
};
