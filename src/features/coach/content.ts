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

  /** Short tips that pop up one at a time, each next to the thing it explains, then go away. */
  tips: [
    {
      id: "pin",
      place: "right",
      title: "Every pin is a challenge",
      text: "Tap one, tell us what you see there. It takes about a minute.",
      ms: 5000,
    },
    {
      id: "kinds",
      place: "left",
      title: "Four kinds of problems",
      text: "",
      ms: 8000,
    },
    {
      id: "world",
      place: "world",
      title: "Finish one, grow your island",
      text: "Every challenge you complete adds to My World.",
      ms: 5000,
    },
    {
      id: "trolley",
      place: "trolley",
      title: "Stuck? Ask Trolley",
      text: "Questions about the map or a mission, any time.",
      ms: 5000,
    },
  ] as const,

  /** One line per problem kind, shown in the "Four kinds" tip. */
  kinds: {
    service: "Closed stops, shuttle buses",
    access: "Elevators out. Can everyone get around?",
    station: "Broken escalators, station changes",
    verify: "MBTA says it's fixed. Go confirm.",
  },

  skip: "Skip tips",
};
