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
- Testing tiers (dev server only): `/island?stamps=2` shows the island as if the rider had 2 stamps.
- Code: `scrub` in `yarn-world/weave.js` (`pullSpan` is set from the camera distance in `mount.js`).

## Notes
- The yarn ball, the quilt and the river are always there. The unlock set is read when the thread is pulled.
- "Preview the full island" shows everything without touching real stamps (good for the demo).
- Keys: `M` mutes. Sound starts after the first touch on the scene (browsers require it).
- The scene is about 480 KB of JavaScript, loaded only on `/island`.
