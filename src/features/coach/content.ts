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

  /** Notification-style banners at the top right, after the map has zoomed to the rider's start. */
  feed: {
    label: "Tada tips",
    app: "Tada",
    heading: "What you will find",
    firstDelayMs: 900,
    close: "Close",
    /** The last banner: it stays, and points at the nearest problem pin. */
    pin: {
      title: "Every pin is a challenge",
      text: "Tap the glowing pin to try one. It takes about a minute.",
      textNoPin: "Tap any pin on the map to try one. It takes about a minute.",
      tag: "Tap this pin",
    },
  },

  /** One line per problem kind, shown in the "Four kinds" tip. */
  kinds: {
    service: "Closed stops, shuttle buses",
    access: "Elevators out. Can everyone get around?",
    station: "Broken escalators, station changes",
    verify: "MBTA says it's fixed. Go confirm.",
  },

};
