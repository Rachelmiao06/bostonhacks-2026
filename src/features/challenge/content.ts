// Text and settings for the challenge page. Placeholder copy: tune freely.
export const content = {
  pickerTitle: "Pick a quest",
  pickerIntro: "Placeholder list while the live MBTA quests and the map are being built.",
  notFound: "We could not find that quest.",
  backToList: "All quests",

  sampleBadge: "Sample quest",
  communityBadge: "Community mission · unofficial",
  sampleNote: "Sample data for testing. This is not a real MBTA alert.",
  honestyNote:
    "T Party is not the MBTA. Finishing a quest here does not send anything to the MBTA. To report an issue officially, use the MBTA's own channels.",
  officialLabel: "MBTA customer support (opens mbta.com)",
  officialUrl: "https://www.mbta.com/customer-support",

  textLabel: "Your feedback",
  textHint: "What happened, where, and when? Say what you would like to change.",
  textPlaceholder: "Example: The elevator at Park Street was out on Tuesday at 8:30am, so I had to carry my bike up the stairs...",
  addPhoto: "Add photo",
  replacePhoto: "Replace photo",
  takePhoto: "Take photo",
  retakePhoto: "Retake photo",
  cameraHint: "On a phone, Take photo opens the camera. On a computer it opens the file picker.",
  removePhoto: "Remove photo",
  photoHint: "Optional. One photo, JPG, PNG or WebP.",
  needSomething: "Add some text or a photo to unlock the AI check.",
  checkWithAi: "Check with AI",
  checking: "Checking...",
  complete: "Complete quest",
  completeNeedsCheck: "Check with AI after your last edit to unlock Complete.",
  completeNeedsPass: "The AI coach still has suggestions. Revise and check again to unlock Complete.",
  savedIndicator: "Draft saved on this device",
  aiFailed: "The AI coach could not be reached. Your draft is safe. Please try again.",
  aiDisclaimer:
    "The AI coach helps with clarity and detail. It cannot verify facts, and a photo is never treated as proof.",
  practiceNote: "Practice coach (offline stand-in). The real AI coach replaces it later and can read photos.",
  stale: "You changed your draft after this check. Check again to refresh the feedback.",

  completedTitle: "Quest completed in the app",
  completedBody: "This is saved on this device only. Nothing was sent to the MBTA.",
  alreadyRewarded: "Tokens for this quest were already awarded.",

  resetLabel: "Reset my test data",
  resetConfirm: "Delete all drafts, completions and tokens saved on this device?",
};

export const settings = {
  /** Photo size limit: 4 MB, matches the server review route (Vercel rejects request bodies over 4.5 MB). */
  maxPhotoBytes: 4 * 1024 * 1024,
  acceptedPhotoTypes: ["image/jpeg", "image/png", "image/webp"],
  /** [TBD] decision: must the AI coach be satisfied before Complete unlocks? */
  requirePassToComplete: true,
  /** How long the practice reviewer pretends to think. Tests set this to 0. */
  practiceReviewDelayMs: 800,
};

export function instructionsFor(kind: "elevator" | "escalator" | "access") {
  const thing = kind === "access" ? "access issue" : kind;
  return `Tell the MBTA how this ${thing} outage affects you. Be specific: which station, what time, what you had to do instead, and what you would like to see changed. A photo is optional.`;
}

// Text for the live quest page at /challenges/[id].
export const details = {
  loading: "Loading quest...",
  loadFailed: "We could not load quests right now. Please refresh to try again.",
  notFoundTitle: "Quest not found",
  notFoundBody:
    "This quest may have ended, or the link is wrong. MBTA alerts come and go, so pick a fresh one on the map.",
  backToExplore: "Back to Explore",
  communityLabel: "Community Mission · unofficial, not an MBTA request",
  communityNote:
    "T Party builds missions from public MBTA alerts. The MBTA did not ask for this feedback, and completing it here sends nothing to the MBTA.",
  snapshotNote: "MBTA could not be reached, so this shows saved alert data.",
  stationLabel: "Station",
  linesLabel: "Lines",
  kindLabel: "Kind",
  openLabel: "Open for",
  failuresLabel: "Broken in last 90 days",
  rewardLabel: "Reward",
  alertLabel: "MBTA's alert",
  sourceLink: "See this alert on mbta.com",
  noLines: "Bus or commuter rail",
  reportMode: "Report quest",
  verifyMode: "Verify quest",
  resolvedNote: "MBTA marked this fixed. Is it really working again?",
};

export const kindLabels = {
  elevator: "Elevator",
  escalator: "Escalator",
  access: "Accessibility",
  station: "Station change",
  closure: "Station closure",
  shuttle: "Shuttle buses",
  suspension: "Service suspended",
} as const;

export function daysOpenText(days: number) {
  if (days < 1) return "Less than a day";
  return days === 1 ? "1 day" : `${days} days`;
}

export function failuresText(n: number) {
  return n === 1 ? "1 time" : `${n} times`;
}

// Text for what the rider does on /challenges/[id].
export const flow = {
  steps: ["Write", "Check with AI", "Revise", "Complete"],
  stepsLabel: "Your progress",
  stepHelp: [
    "Tell us what you see. Tap a question below for a sentence starter.",
    "Ready? The AI coach scores clarity and detail. It cannot verify facts.",
    "The coach has suggestions. Edit your report, then check again.",
    "Your report passed. Complete it to earn tokens.",
  ],
  promptsTitle: "Need ideas? Tap a question to add a starter",
  prompts: [
    { label: "When?", starter: "I was here on [day] at about [time]." },
    { label: "Where exactly?", starter: "It is the one at [platform / entrance / lobby]." },
    { label: "What did you see?", starter: "I saw that " },
    { label: "How did it affect you?", starter: "Because of this I had to " },
    { label: "What would help?", starter: "It would help if " },
  ],
  textLabel: "Your report",
  textPlaceholder: "Example: The escalator to the Alewife platform was stopped on Friday at 8:30am, so I carried my stroller down the stairs...",
  charCount: (n: number) => `${n} / 2000`,
  draftSaved: "Your words are saved on this device.",
  check: "Check with AI",
  checking: "Checking...",
  complete: "Complete quest",
  completing: "Completing...",
  hintEmpty: "Write something or add a photo to unlock the AI check.",
  hintNeedsCheck: "Run the AI check on this version to unlock Complete.",
  hintNeedsPass: "Revise using the suggestions, then check again to unlock Complete.",
  notChecked: "Not checked: you changed your report after this check. Check again to unlock Complete.",
  reviewTitle: "AI coach",
  passed: "Looks good",
  needsRevision: "Needs revision",
  suggestionsTitle: "Try this",
  scoreNames: { relevance: "Relevance", specificity: "Specificity", completeness: "Completeness", photoRelevance: "Photo fit" },
  aiDisclaimer: "The AI coach helps with clarity and detail. It cannot verify facts, and a photo is never proof.",
  photoNote: "Photos are shrunk on your device, sent once for the AI check, and not stored.",

  verifyTitle: "Is it working again?",
  verifyHelp: "Go and look, then tap what you see. One tap earns tokens.",
  working: "Working again",
  stillBroken: "Still broken",
  noteLabel: "Note (optional)",
  notePlaceholder: "Anything worth adding, like which level you checked.",
  sending: "Sending...",
  verifiedWorking: "You said it is working again.",
  verifiedBroken: "You said it is still broken.",

  doneTitle: "Quest complete!",
  tokensEarned: (n: number) => `+${n} tokens`,
  doneBody: "Completed in T Party. This does not send anything to the MBTA.",
  alreadyDone: "You already finished this quest.",
  tellMbta: "Also tell the MBTA",
  tellMbtaHelp: "Optional. Opens the MBTA's official feedback page in a new tab. T Party does not send anything for you.",
  tellMbtaSaved: "Noted: you opened the MBTA's page.",
  mbtaUrl: "https://www.mbta.com/customer-support",
  backToExplore: "Find another quest",

  errors: {
    network: "We could not reach T Party. Check your connection and try again. Your report is still here.",
    ai: "The AI coach could not answer just now. Your report is safe here. Please try again in a moment.",
    fallback: "Something went wrong. Your report is still here. Please try again.",
  },
};
