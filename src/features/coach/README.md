# Coach (first-visit guide)

Explains Tada to a new rider in three beats instead of one long tour.

1. **Intro**: one punchy card ("Tiny missions for a better T") with the three features: Explore, Report, My World. Shown before the welcome.
2. **Welcome + zoom** (Explore's own): the rider picks a start and the map zooms to it.
3. **Four short tips**: notification-style cards that pop up one at a time (about 25 seconds in all), each beside the thing it explains, then go away: top right "Every pin is a challenge", top left the four problem kinds (icon + one line each), under the My World button "Finish one, grow your island", above Trolley "Stuck? Ask Trolley". They start when the zoom has finished and the welcome is gone.

- Words live in `content.ts` (`intro`, `tips`, `kinds`). Seen-state is `localStorage` key `tada.coach` (bump `VERSION` in `storage.ts` to show it to everyone again).
- Replay: open `/?tour=1`, or `window.dispatchEvent(new Event("tada:coach:start"))`.
- Mounted from `src/app/page.tsx`. It only reads from `features/explore` (`category`, `content`, `glass`, `onboarding`); it edits nothing there.
- Escape or "Skip tips" (bottom centre) ends it for good. The tips never block the map (only the skip button takes clicks). The My World and Trolley tips find their button on screen and point at it; if it is missing they fall back to a corner.
- Known overlap: Explore's own one-time "Every pin is a challenge" hint can show at the same time and says the same thing.
