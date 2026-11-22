// All the words of the mission flow. Placeholder copy: tune freely.
export const text = {
  back: "Back",
  close: "Close mission",
  backToMap: "Back to map",
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  steps: "Mission progress",

  // Map card
  viewMission: "View mission",
  seeYours: "See your update",
  doneStamp: "Shared",
  community: "Community mission · not an MBTA request",

  // Overview
  whereToCheck: "Where to check",
  task: "Your task",
  start: "Start mission",
  officialAlert: "View official alert",
  notOfficial: "This is a Tada community observation. It is not an official MBTA report and nothing is sent to the MBTA.",

  // Step 1
  whenTitle: (thing: string) => `When did you check ${thing}?`,
  whenNow: { label: "I’m at the station now", hint: "Checking it as I go" },
  whenEarlier: { label: "I checked earlier", hint: "Today or this week" },
  whenNot: { label: "I haven’t checked it yet", hint: "I’ll come back later" },
  earlierAsk: "About when?",
  notYetTitle: "Come back after you’ve looked",
  notYetBody:
    "Tada only shares what riders saw with their own eyes. Take a look when you’re at the station, then return to this mission. Your place is saved.",

  // Step 3
  noteTitle: "Anything else you’d like to share?",
  noteOptional: "Optional",
  noteLabel: "A short note",
  addPhoto: "Add a photo",
  takePhoto: "Take a photo",
  replacePhoto: "Replace photo",
  removePhoto: "Remove photo",
  photoHelp: "Photos are optional. Keep faces, license plates and screens out of the shot. Tada shrinks your photo on your device, looks at it once, and does not store it.",
  photoNotProof: "A photo helps explain what you saw, but it is never treated as proof.",
  review: "Review my update",

  // Review
  reviewTitle: "Your community update",
  reviewIntro: "Tada put this together from your answers. Nothing is added.",
  checking: "Tidying up your update…",
  place: "Place",
  observed: "Observed",
  when: "When",
  note: "Your note",
  extra: "Extra detail",
  photoAttached: "Photo attached",
  aiNote: "Tada’s AI helper only organises what you wrote. It can’t verify facts, and it never treats a photo as proof.",
  followUpTitle: "One quick question",
  followUpAnswer: "Your answer",
  followUpSend: "Add and check again",
  stuck: "Tada couldn’t finish checking this update yet. Your answers are saved, so you can edit them or come back later.",
  share: "Share community update",
  sharing: "Sharing…",
  edit: "Edit answers",
  retry: "Try again",
  shareWho: "This will be shared with the Tada community.",
  noVerifyUnsure:
    "For this kind of mission Tada can only save a clear “working” or “still broken”. Nothing was saved, and your answer is kept if you want to change it.",

  // Done
  doneTitle: "You helped your community today.",
  doneBody: "Your observation has been shared with the Tada community.",
  alreadyTitle: "You already shared this update.",
  alreadyBody: "Thank you. Here is what you shared.",
  mission: "Mission",
  status: "Status",
  statusShared: "Shared with the Tada community",
  statusSaved: "Saved",
  myWorld: "My World",
  progressAdded: (n: number) => `+1 contribution · ${n} so far`,
  progressTotal: (n: number) => `${n} contribution${n === 1 ? "" : "s"} so far`,
  newPiece: (name: string) => `Next time you visit, your island gets ${name}.`,
  keepGoing: "Your little world is waiting. There are more problems to check on the map too.",
  exploreWorld: "Visit My Little World",
  another: "Explore another mission",

  errors: {
    network: "We couldn’t reach Tada. Check your connection. Your answers are saved here, so you can try again.",
    ai: "Tada’s AI helper couldn’t answer just now. Your answers are saved here. Try again in a moment, or come back to this mission later.",
    save: "That didn’t save. Your answers are still here, so you can try again.",
  },
};

// Words for the "depth" parts: the story of the problem, MBTA's way around it, what the rider's check did,
// and progress along the line.
export const depth = {
  storyTitle: "The story so far",
  fromMbta: "From the MBTA",
  today: "Today",
  days: (n: number) => (n === 1 ? "1 day" : `${n} days`),
  months: (n: number) => `${n} months`,
  years: (n: string) => (n === "1" ? "1 year" : `${n} years`),
  outLabel: "out of service",
  ongoingLabel: "since it began",
  fixedLabel: "marked fixed by the MBTA",
  nthTime: (nth: string) => `${nth} time`,
  in90Days: "out in 90 days",
  plannedEnd: "MBTA’s planned end",
  minutesAgo: (n: number) => (n === 1 ? "1 minute ago" : `${n} minutes ago`),
  hoursAgo: (n: number) => (n === 1 ? "1 hour ago" : `${n} hours ago`),
  daysAgo: (n: number) => (n === 1 ? "1 day ago" : `${n} days ago`),

  wayTitle: "A way around, from the MBTA",
  wayMore: (n: number) => (n === 1 ? "Show 1 more direction" : `Show ${n} more directions`),
  wayNote: "These directions are the MBTA’s own words. Check signs at the station too.",

  impactTitle: "What your check did",
  first: "You’re the first Tada rider to check this.",
  firstDetail: "Your check is now the latest one for this problem.",
  joined: (n: number) => (n === 1 ? "You and 1 other rider have checked this." : `You and ${n} other riders have checked this.`),
  lastCheck: (when: string) => `The last check before yours was ${when}.`,
  verdicts: (working: number, broken: number) => `${working} said it works, ${broken} said it’s still broken.`,

  lineTitle: (line: string, done: number, total: number) => `${line} Line · ${done} of ${total} checked`,
  lineProgress: (line: string, done: number, total: number) => `${done} of ${total} missions checked on the ${line} Line`,
  lineMore: (n: number) => (n === 1 ? "1 more to check on this line today." : `${n} more to check on this line today.`),
  lineDone: (line: string) => `You’ve checked every mission on the ${line} Line today.`,
};
