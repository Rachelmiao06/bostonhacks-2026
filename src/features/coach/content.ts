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
    honest: "A rider project. Finishing a mission does not send anything to the MBTA.",
    start: "Let’s go",
    skip: "Skip",
  },

  /** The live feed that plays once the map has zoomed to the rider's start. */
  live: {
    label: "Tada live guide",
    title: "Tada Live",
    sub: "A quick guide to the map",
    skip: "Skip",
    close: "Close guide",
    author: "Trolley",
  },

  /** Chat-style messages, in order. A `kind` adds that problem category's icon and colour as a tag. */
  messages: [
    { text: "You made it! This is the area around your stop." },
    { text: "Every pin on the map is a real MBTA problem." },
    { text: "Tap a pin, because every pin is a challenge. Tell us what you see there, it takes about a minute." },
    { kind: "service", text: "Service changes: a stop is closed, shuttle buses replace trains, or a line is suspended." },
    { kind: "access", text: "Accessibility: can everyone get in and around? Think elevators, for wheelchairs, strollers and tired legs. This pin means one is out." },
    { kind: "station", text: "Escalators & station: a broken escalator, or a change inside a station." },
    { kind: "verify", text: "Check if it’s working: the MBTA says it’s fixed. Go look and confirm. Easy win." },
    { text: "The number on a pin is how many problems are at that stop." },
    { text: "Little pixel buildings are Boston landmarks. Tap one for its story and the problems nearby." },
    { text: "Finish a challenge and your island grows in My World. Find it in the top bar." },
    { text: "Report, also in the top bar, lets you snap a photo of anything wrong." },
    { text: "Stuck? Tap me, the round button at the bottom right. Now pick a pin and solve one!" },
  ] satisfies { text: string; kind?: "service" | "access" | "station" | "verify" }[],
};
