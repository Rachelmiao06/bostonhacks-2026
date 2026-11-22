// All the words of the first-visit coach. Change text here, not in the component.

export const coach = {
  /** Step 0: one punchy card before anything else. Names the three things Tada does. */
  intro: {
    eyebrow: "Tada",
    title: "Tiny missions for a better T.",
    body: "Real MBTA problems, on a map. You help in about a minute.",
    features: [
      { id: "explore", label: "Explore", text: "A live map of real problems. Every pin is a mission." },
      { id: "report", label: "Report", text: "Snap a photo of something wrong. We help you say it clearly." },
      { id: "world", label: "My World", text: "Each mission you finish grows your own knitted island." },
    ],
    start: "Let’s go",
    skip: "Skip",
  },

  /** One card at the top left, after the map has zoomed to the rider's start. */
  guide: {
    label: "Tada guide",
    title: "Every pin is a challenge",
    text: "Tap one and tell us what you see there. It takes about a minute.",
    kindsTitle: "Four kinds of problems",
    done: "Got it",
  },

  /** One line per problem kind, shown in the "Four kinds" tip. */
  kinds: {
    service: "Closed stops, shuttle buses",
    access: "Elevators out. Can everyone get around?",
    station: "Broken escalators, station changes",
    verify: "MBTA says it's fixed. Go confirm.",
  },

};
