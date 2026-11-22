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
  newPiece: (name: string) => `Next time you visit, ${name} lands on your island.`,
  exploreWorld: "Explore My World",

  errors: {
    saveLost: "That didn’t save. Your answers are still here, so you can try again.",
  },
};
