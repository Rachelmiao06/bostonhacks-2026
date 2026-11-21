# Onboarding friction log

Walked through https://bostonhacks-2026.vercel.app (desktop Chrome, 2026-11-21) as a first-time user.
Not tested: real browser location prompt, photo upload, final "Stamp the ticket" submit (it would write to the live app), phone width.

## Step by step

| # | Step | What happened | Friction | Severity |
|---|------|---------------|----------|----------|
| 1 | Land on `/` | Full-screen Boston map, card "Where are you right now?" | The app never says what T Party is. No headline, no one-line promise. The only hint ("Tap a pin. Type what you see. Get a stamp.") appears two steps later. | High |
| 2 | Location card | "Use my location" / quick-start stops / "Just show the map" | Asks for location before giving a reason to share it. "We drop you into the nearest T stop" is vague. No fallback explained if permission is denied. "Just show the map" is tiny and low-contrast, so it reads as a skip, not a real choice. | High |
| 3 | Pick Park Street | Map flies into a 3D view | No pins for a few seconds, so it looks like an empty city. Pins and the "8 problems within a short walk" hint load late. No loading cue. | Medium |
| 4 | Look at the map | Bus-stop icons, a pixel landmark with a "3", wheelchair icons with "2" | Pins have no legend. A user cannot tell a "problem" from a stop or a landmark. The "3" and "2" counts are not explained. The 3D tilt makes pins small and hard to hit. | High |
| 5 | Tap a pin | Card opens with an elevator-out problem and a typewriter question | Nothing says "this is a real MBTA alert and you are helping verify it". The question types out letter by letter, so it is not readable at once. The "MBTA's alert" line is small all-caps grey. "1 of 2" paging is easy to miss. | Medium |
| 6 | Write an answer | Chips: When? Where exactly? What did you see? | Chips are helpful, but they sit above the box and are cut off at the right edge. Two buttons, "Check my answer" and "Stamp the ticket", look like the same step. | Medium |
| 7 | Check my answer (AI coach) | "Looks good" plus two tips | Works, but the card grows past the screen and the tips are below the fold. "Looks good" next to "add more detail" is mixed. The coach said "stroller", which I typed, so it echoes input. It cannot verify facts, and the full form says so only in small print. | Medium |
| 8 | Add a photo | Only a link: "Add a photo in the full form" | The photo is hidden behind a second screen. Users who just took a photo have to leave the card, then find the camera icon in a side panel. The photo is never shown with the answer on the map. | High |
| 9 | Full form side panel | Same text, camera icon, gallery icon, "Complete quest" | Duplicate step: the user retypes nothing, but sees the same AI coach again. Button names change (Stamp the ticket vs Complete quest). Progress bar of four segments is unlabeled. | Medium |
| 10 | My Journey | Two saved drafts, "Passed the check" and "Coach has suggestions" | Drafts appear even though nothing was submitted. "Continue on the map" sends the user back with no zoom to that pin. | Low |
| 11 | Collection | 0 stamps, "Find a problem" | Clear and friendly. "See your island" appears with no earlier mention of an island. | Low |

## Your ideas, mapped

- **Explain the app first.** Add a short welcome before the location card: what T Party is, three steps (pick a problem, say what you saw, get a stamp), and why location helps.
- **Location.** Explain the benefit and the privacy promise in one line, make "Just show the map" a real button, and handle "denied" gracefully.
- **A live-feed tab after choosing where you are.** A scrolling list of nearby problems (a feed) beside the map would answer "what is this for?" faster than hunting for pins. Worth a prototype: a bottom sheet on phone, a side list on desktop, tapping a row flies to the pin.
- **Photo.** Move the camera button into the first card, and show the photo on the pin or in the island after submitting.
- **AI.** It works and responds in about 4 seconds. Tighten it: keep tips above the fold, show one tip at a time, and say clearly what it can and cannot judge.

## Suggested order to fix

1. Welcome line plus three steps on `/`.
2. Location copy and a clear skip button.
3. Pin legend and a loading cue for pins.
4. Camera in the first card.
5. Problem feed list.
6. AI coach layout.
