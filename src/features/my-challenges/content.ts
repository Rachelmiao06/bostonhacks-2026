export const content = {
  eyebrow: "My Journey",
  title: "Your contributions",
  summary: (reports: number, checks: number, tokens: number) =>
    `${reports} ${reports === 1 ? "report" : "reports"} completed · ${checks} ${checks === 1 ? "fix" : "fixes"} checked · ${tokens} tokens`,
  loading: "Loading your journey…",
  unavailable: "Your contributions could not load right now. Please try again in a moment.",

  inProgress: "In progress",
  inProgressNote: "Saved drafts. Finish them on the map.",
  completed: "Completed reports",
  checked: "Fixes you checked",

  continue: "Continue on the map",
  viewOnMap: "View on the map",
  draft: "Draft",
  needsRevision: "Coach has suggestions",
  passed: "Passed the check",
  completedInApp: "Completed in Tada",
  handedOff: "You also opened the MBTA’s page",
  nowFixed: "MBTA has since marked this fixed",
  working: "You said it is working again",
  stillBroken: "You said it is still broken",
  on: (date: string) => `on ${date}`,

  honest: "Completing a mission here does not send anything to the MBTA. To report officially, use the MBTA’s own channels.",

  emptyTitle: "Your journey starts on the map",
  emptyBody: "Pick a problem pin, read its ticket, and add what you see. Every finished mission lands here.",
  emptyCta: "Open the map",
};
