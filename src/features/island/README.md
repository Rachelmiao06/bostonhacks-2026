# Island

What: a knitted island you can play with that grows as the rider earns stamps. Route `/island`, linked from Rewards.
Owner: Rachel. Only the owner edits this folder.

## How it fits together
- `Island.tsx`: the page. Full screen under the nav (like the map). Reads stamps with `stampCount(useMyProgress())` from `features/explore/progress`.
- `content.ts`: all text and `rewards` (also exported as `unlockTiers`): what each stamp brings (4 world pieces, then trophies and sheep; 12 stamps in all).
- `IslandLoader.tsx` / `IslandScene.tsx`: load the three.js scene in the browser only, and clean it up when you leave.
- `yarn-world/`: **Yarn World by Kris Yang** (https://github.com/krisyangdev/yarn-world, MIT, see `yarn-world/LICENSE-yarn-world`).
  Our changes: `mount.js` (replaces `main.js`: sized to its container, cleaned up on leave), `weave.js` + `world.js` (`isUnlocked` keeps locked pieces hidden; `scrub` makes the pull drive the knit-in; palette `P` retuned to warm stone, ivory, sage and sandstone with MBTA accents),
  `guide.js`, `sound.js`, `ambience.js` (mount and dispose). Sounds are CC0, in `public/assets/island/sfx/`.

## Opening: pull the thread
- Drag the loose thread (mouse or touch). The distance you drag sets how far the knit-in has gone (about half the window height = the whole island). It only moves forward; let go and the rest knits by itself.
- "Knit the island for me" starts the same knit-in without dragging (keyboard and screen-reader alternative; progress is announced).
- Code: `scrub` in `yarn-world/weave.js` (`pullSpan` is set from the camera distance in `mount.js`).

## The journey: Explore -> stamp -> island
- **Source of truth:** the server. A completed report or verification is stored by `/api/submissions` and `/api/verifications` (one row per rider per quest, so no duplicates). Stamps = `stampCount(useMyProgress())` in `features/explore/progress.ts`. Nothing on the island awards or counts points.
- **Explore:** after a successful submission `Celebration` shows the server's `tokensAwarded`, the stamp, and which island piece the new stamp unlocks. Two buttons: "Continue exploring" (stays on the map, nothing moves) and "Visit my world" (`/island`). Reopening a finished quest shows "Already in your collection" with no fanfare.
- **Map memory:** `features/explore/viewMemory.ts` keeps the camera and selected stop for the browser tab (sessionStorage). Next keeps pages mounted but hidden (`cacheComponents`), and a hidden map loses its camera, so `ExploreMap` puts it back when the page is shown again.
- **Island visits:** `seen.ts` remembers how many tiers this browser has seen knitted (display memory only). First visit: the yarn-pull opening. Later visits: the island is simply there (`instant`). A stamp earned since the last visit leaves one red loose thread on the quilt (`offerGift` in `weave.js`); pulling it, or pressing "Knit it in for me", springs that tier's pieces into place. The tier is remembered only once it has really knitted in. If the server cannot be reached, the island shows what this browser last saw.
- Every visit re-fetches stamps (`refreshProgress`) and re-plans, because the page stays mounted between visits.

## Notes
- The yarn ball, the quilt and the river are always there. The unlock set is read when the thread is pulled.
- Sheep and trophies (T Party additions, `rewards` in `content.ts`): one sheep arrives with the first stamp (stage `sheep`, knitted in with the grass). Sheep 2, 3 and 4 fall through a purple portal at 3, 6 and 9 stamps (stages `sheep2..4`); four is the most. Every stamp also drops one trophy (stages `trophy1..12`: cup, medal and star in turn) through the portal, up to 12.
- Portal drop: `dropIn` in `yarn-world/weave.js` hides the pieces, then for each one opens `yarn-world/portal.js` above its place, drops it through, squashes it on landing and closes the portal. `trophies.js` builds and places the trophies (open ground nearest the camera; the sheep walk around them).
- On a return visit, each new stamp first knits its world piece from a loose thread (stamps 1 to 4), then the portal drops its trophy (and sheep). The first visit shows everything earned during the knit-in, with no portal.
- Playing with trophies (`yarn-world/trophyplay.js`): click one for a small hard hop, a ringing wobble and a metal clink (no squash, unlike the wool things). Drag one with the same gesture as lifting a sheep: it hangs from the hand, lags and tilts behind it, and on release falls with heavy gravity, bounces once and settles on the nearest free dry ground (the sheep's blocker for it moves too). Stiffer springs, higher gravity and a low bounce are the "tougher" feel; the numbers are the constants at the top of the file.
- "Open the portal" (preview mode only) replays the drops one reward at a time, so the demo shows the portal without earning stamps.
- "Preview the full island" shows everything without touching real stamps (good for the demo).
- Keys: `M` mutes. Sound starts after the first touch on the scene (browsers require it).
- The scene is about 480 KB of JavaScript, loaded only on `/island`.
