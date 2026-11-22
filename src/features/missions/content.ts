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

// Words for the overview and the "depth" parts: the status of the problem, MBTA's own directions,
// what the rider's check did, and progress along the line.
export const depth = {
  chip: "Community mission",
  helpCheck: (thing: string) => `Help check this ${thing}`,
  helpConfirm: (thing: string) => `Help confirm this ${thing} works`,
  reportsOut: (unit: string) => `MBTA reports ${unit} is out of service.`,
  reportsFixed: (unit: string) => `MBTA says ${unit} is working again.`,

  // Status block: one headline, one line on who has checked, one optional line of extra facts.
  outFor: (time: string) => `Out of service for ${time}`,
  outToday: "Out of service since today",
  ongoingFor: (time: string) => `Ongoing for ${time}`,
  startedToday: "Started today",
  fixedAgo: (when: string) => `Marked fixed ${when}`,
  official: "Reported by the MBTA.",
  officialFixed: "The MBTA says it’s fixed.",
  noChecks: "No Tada rider has checked it yet.",
  someChecks: (n: number, when: string | null) =>
    `${n === 1 ? "1 Tada rider has" : `${n} Tada riders have`} checked it${when ? `, most recently ${when}` : ""}.`,
  repeat: (nth: string) => `${nth} time out in 90 days`,
  plannedEnd: (date: string) => `MBTA plans to finish ${date}`,
  days: (n: number) => (n === 1 ? "1 day" : `${n} days`),
  months: (n: number) => `${n} months`,
  years: (n: string) => (n === "1" ? "1 year" : `${n} years`),
  minutesAgo: (n: number) => (n === 1 ? "1 minute ago" : `${n} minutes ago`),
  hoursAgo: (n: number) => (n === 1 ? "1 hour ago" : `${n} hours ago`),
  daysAgo: (n: number) => (n === 1 ? "1 day ago" : `${n} days ago`),

  todoTitle: "What you’ll do",
  goToUnit: (unit: string, station: string) => `Go to ${unit} at ${station}.`,
  goTo: (station: string) => `Go to ${station}.`,
  checkUnit: "Check whether it’s working, if it’s safe and easy for you to get to.",
  shareStep: "Share what you found to help other riders.",
  startUnit: (thing: string) => `Check this ${thing}`,
  reassure: "No repair needed · Just report what you see",

  routeAsk: "Need another accessible route?",
  routeShow: "View MBTA directions",
  routeHide: "Hide directions",
  routeNote: "These directions are the MBTA’s own words. Check signs at the station too.",
  fromMbta: "From the MBTA",

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
