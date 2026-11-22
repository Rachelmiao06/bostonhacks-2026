# Coach (first-visit guide)

Explains Tada to a new rider in three beats instead of one long tour.

1. **Intro**: one punchy card ("Tiny missions for a better T") with the three features: Explore, Report, My World. Shown before the welcome.
2. **Welcome + zoom** (Explore's own): the rider picks a start and the map zooms to it.
3. **Notification feed + the nearest pin**: once the zoom has finished and the welcome is gone, Apple-style banners slide in at the top right one at a time (about 3.4s apart): Service changes, Accessibility, Escalators & station, Check if it's working, each one line. Kind banners slide away after a few seconds. The last banner, "Every pin is a challenge", stays, and a pulsing ring plus a flowing dotted line lead from it to the problem pin nearest the middle of the screen, labelled "Tap this pin". Each kind banner also POINTS at its own chip in the filter row at the top of the map: a ring around the chip and a dotted line flowing to it from the banner (the bar scrolls sideways on a phone to bring the chip into view). Tapping a pin (it opens its mission as usual), the X or Escape ends the guide for good.

- Words live in `content.ts` (`intro`, `feed`, `kinds`). Seen-state is `localStorage` key `tada.coach` (bump `VERSION` in `storage.ts` to show it to everyone again).
- Demo mode (`FRESH_EACH_VISIT` in `CoachTour.tsx`, on): every NEW visit (a new tab or window, or the browser reopened) starts from the intro again; a reload in the same visit does not. Set it to `false` to show the coach once per browser.
- Replay: open `/?tour=1` (also resets Explore's welcome so the "Where should we start?" step shows again, then reloads once), or `window.dispatchEvent(new Event("tada:coach:start"))`.
- The intro hero is `TrolleyHero.tsx`: the knitted trolley (a transparent animated WebP made from the designer GIF, `public/assets/coach/trolley-bounce.webp`, still frame `trolley-still.png` under Reduced Motion) bouncing over a hand-drawn wavy line that draws itself, with four station dots lighting in turn. `variant="pixel"` switches to the SVG voxel trolley.
- The intro card's "Tada" is the knitted logo that bounces (`public/assets/coach/tada-bounce.webp`, a transparent animated WebP made from the designer GIF) and "Let's go" has an animated green glass skin with a light sweep (`lets-go-skin.webp`; the label is real text on top). Reduced Motion gets still frames (`tada-still.webp`, `lets-go-skin.png`).
- Mounted from `src/app/page.tsx`. It only reads from `features/explore` (`category`, `content`, `glass`, `onboarding`); it edits nothing there.
- Pins are found by reading the map markers' labels (`".maplibregl-marker button[aria-label]"`, "<stop>: N problems"); if none is on screen the last banner just says "Tap any pin".
- Explore's own one-time "Every pin is a challenge" map hint is switched off (`hintAllowed` in `ExploreMap.tsx`) because the guide card says the same thing.
