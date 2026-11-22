# Coach (first-visit guide)

Explains Tada to a new rider in three beats instead of one long tour.

1. **Intro**: one punchy card ("Tiny missions for a better T") with the three features: Explore, Report, My World. Shown before the welcome.
2. **Welcome + zoom** (Explore's own): the rider picks a start and the map zooms to it.
3. **Tada Live**: a live-stream style feed at the top right. Chat messages from Trolley arrive one by one and explain the four problem kinds (with their icons and colours), the pin numbers, the landmarks, "every pin is a challenge", My World, Report and Trolley. It starts when the zoom has finished and the welcome is gone, and puts itself away after the last message.

- Words live in `content.ts` (`intro`, `live`, `messages`). Seen-state is `localStorage` key `tada.coach` (bump `VERSION` in `storage.ts` to show it to everyone again).
- Replay: open `/?tour=1`, or `window.dispatchEvent(new Event("tada:coach:start"))`.
- Mounted from `src/app/page.tsx`. It only reads from `features/explore` (`category`, `content`, `glass`, `onboarding`); it edits nothing there.
- Escape, "Skip" or the X ends it for good. The feed never blocks the map (only its header buttons take clicks).
- Known overlap: Explore's own one-time "Every pin is a challenge" hint can show at the same time and says the same thing.
