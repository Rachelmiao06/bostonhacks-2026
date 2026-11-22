// All the words of the first-visit coach. Change text here, not in the component.

export const coach = {
  /** Step 0: shown before anything else, over the map, so a new rider knows what Tada is. */
  intro: {
    eyebrow: "Welcome to Tada",
    title: "Tada turns real T problems into tiny missions.",
    body: "The MBTA lists broken elevators, closed stops and shuttle buses. Tada puts them on a map. Pick one, tell us what you see in about a minute, and your own little world grows.",
    honest: "Tada is a rider project. Finishing a mission here does not send anything to the MBTA.",
    start: "Show me around",
    skip: "Skip, I'll explore",
  },

  /** The walkthrough that starts once the rider has chosen where to begin. `visual` picks the picture. */
  steps: [
    {
      id: "map",
      title: "This is your map",
      body: "The coloured lines are the T. Little trains move in real time. Drag to look around, pinch or use + and − to zoom, and tilt the map if you like.",
      visual: "map",
    },
    {
      id: "kinds",
      title: "Four kinds of problems",
      body: "Every problem comes from a real MBTA alert and belongs to one kind. The chips at the top of the map show or hide each kind.",
      visual: "kinds",
    },
    {
      id: "marks",
      title: "What the marks on the map mean",
      body: "You will see three things on the map besides lines:",
      visual: "marks",
    },
    {
      id: "challenge",
      title: "Every pin is a challenge",
      body: "Tap a pin to open it. You see what the MBTA says, then choose: report what you see on the ground, or check whether a fixed thing really works again.",
      visual: "ticket",
    },
    {
      id: "world",
      title: "Finish one, grow your world",
      body: "Each finished challenge adds a piece to My World, your own knitted island. Open it from the top bar any time. Need help? Trolley, the round button at the bottom right, answers questions.",
      visual: "world",
    },
  ],
  kinds: [
    { id: "service", label: "Service changes", text: "Closed stops, shuttle buses, suspended service." },
    { id: "access", label: "Accessibility", text: "Elevators out and other access problems." },
    { id: "station", label: "Escalators & station", text: "Escalators and changes inside a station." },
    { id: "verify", label: "Check if it’s working", text: "The MBTA says it is fixed. Go look and confirm." },
  ] as const,
  marks: [
    { kind: "number", label: "A number", text: "How many problems are at that stop. Tap to open them." },
    { kind: "landmark", label: "A pixel building", text: "A local landmark with a bit of history. Tap it to see problems near it." },
    { kind: "ring", label: "A ring on a line", text: "A T stop with nothing to report right now." },
  ],
  ticket: {
    station: "Andrew · Red Line",
    alert: "Elevator out",
    report: "Report what you see",
    verify: "Check it’s working",
  },

  next: "Next",
  back: "Back",
  done: "Got it, let me explore",
  skip: "Skip tour",
  step: (n: number, total: number) => `Step ${n} of ${total}`,
  label: "Tada tour",
  replayHint: "You can replay this tour any time by adding ?tour=1 to the address.",
};
