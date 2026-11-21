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
  /** Photo size limit. [TBD] decision, 5 MB for now. */
  maxPhotoBytes: 5 * 1024 * 1024,
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
