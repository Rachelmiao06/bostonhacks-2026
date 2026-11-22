# Coach (first-visit walkthrough)

Explains Tada to a new rider, step by step, on the home map.

1. **Intro** ("Tada turns real T problems into tiny missions"): a centered card with a small drawn map, shown before the welcome card.
2. **Walkthrough** (5 steps): the map, the four kinds of problems, the marks (number, pixel building, ring), how a pin opens a challenge, My World.
   It starts by itself once the rider has chosen where to start and the welcome card is gone.

- Words live in `content.ts`. Seen-state is `localStorage` key `tada.coach` (bump `VERSION` in `storage.ts` to show it to everyone again).
- Replay: open `/?tour=1`, or `window.dispatchEvent(new Event("tada:coach:start"))` (a button or Trolley can use this).
- Mounted from `src/app/page.tsx`. It only reads from `features/explore` (`category`, `glass`, `onboarding`); it edits nothing there.
- Escape or "Skip tour" ends it for good.
