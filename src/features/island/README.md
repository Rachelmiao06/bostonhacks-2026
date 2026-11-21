# Island

What: a knitted island you can play with that grows as the rider earns stamps. Route `/island`, linked from Rewards.
Owner: Rachel. Only the owner edits this folder.

## How it fits together
- `Island.tsx`: the page. Full screen under the nav (like the map). Reads stamps with `stampCount(useMyProgress())` from `features/explore/progress`.
- `content.ts`: all text and `unlockTiers`: what each stamp knits in (1 stamp = first tier, 5 stamps = the whole island).
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
- Sheep: two sheep come with the first stamp (stage `sheep`, first tier) so the island is never empty; the third arrives with the third stamp (stage `flock`). Set in `content.ts` (`unlockTiers`) and the `weave` items in `yarn-world/world.js`.
- "Preview the full island" shows everything without touching real stamps (good for the demo).
- Keys: `M` mutes. Sound starts after the first touch on the scene (browsers require it).
- The scene is about 480 KB of JavaScript, loaded only on `/island`.
