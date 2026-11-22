# Coach (first-visit guide)

Explains Tada to a new rider in three beats instead of one long tour.

1. **Intro**: one punchy card ("Tiny missions for a better T") with the three features: Explore, Report, My World. Shown before the welcome.
2. **Welcome + zoom** (Explore's own): the rider picks a start and the map zooms to it.
3. **One guide card** at the top left, once the zoom has finished and the welcome is gone: "Every pin is a challenge" and the four kinds of problems (icon + one line each). Stays until "Got it" (or Escape).

- Words live in `content.ts` (`intro`, `guide`, `kinds`). Seen-state is `localStorage` key `tada.coach` (bump `VERSION` in `storage.ts` to show it to everyone again).
- Replay: open `/?tour=1` (also resets Explore's welcome so the "Where should we start?" step shows again, then reloads once), or `window.dispatchEvent(new Event("tada:coach:start"))`.
- The intro hero is `TrolleyHero.tsx`: the knitted trolley (a transparent animated WebP made from the designer GIF, `public/assets/coach/trolley-bounce.webp`, still frame `trolley-still.png` under Reduced Motion) bouncing over a hand-drawn wavy line that draws itself, with four station dots lighting in turn. `variant="pixel"` switches to the SVG voxel trolley.
- Mounted from `src/app/page.tsx`. It only reads from `features/explore` (`category`, `content`, `glass`, `onboarding`); it edits nothing there.
- Escape or "Got it" ends it for good. The card never blocks the map.
- Explore's own one-time "Every pin is a challenge" map hint is switched off (`hintAllowed` in `ExploreMap.tsx`) because the guide card says the same thing.
