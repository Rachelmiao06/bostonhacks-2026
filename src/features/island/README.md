# Island

What: a knitted island you can play with that grows as the rider earns stamps. Route `/island`, linked from Rewards.
Owner: Rachel. Only the owner edits this folder.

## How it fits together
- `Island.tsx`: the page. Full screen under the nav (like the map). Reads stamps with `stampCount(useMyProgress())` from `features/explore/progress`.
- `content.ts`: all text and `unlockTiers`: what each stamp knits in (1 stamp = first tier, 5 stamps = the whole island).
- `IslandLoader.tsx` / `IslandScene.tsx`: load the three.js scene in the browser only, and clean it up when you leave.
- `yarn-world/`: **Yarn World by Kris Yang** (https://github.com/krisyangdev/yarn-world, MIT, see `yarn-world/LICENSE-yarn-world`).
  Our changes: `mount.js` (replaces `main.js`: sized to its container, cleaned up on leave), `weave.js` + `world.js` (`isUnlocked` keeps locked pieces hidden; pull-driven intro, see below), `rope.js`,
  `guide.js`, `sound.js`, `ambience.js` (mount and dispose). Sounds are CC0, in `public/assets/island/sfx/`.

## The opening: pull the thread
The island starts as a yarn ball on its mat with a loose thread. Dragging the thread knits the island in:
- Real pointer drag (mouse and touch). The thread feeds out of the ball as you pull (up to 7.5 units long) and the pompom follows the hand softly (`grabFollow` in `rope.js`).
- Progress = how far the hand has moved away from the ball (only outward movement counts, so pull, bring the hand back, pull again works). `PULL_RANGE` in `weave.js` is the length of yarn for the whole island.
- The existing knit-in animation is reused as it was. Its clock now chases the pulled length (eases in and out, never runs backwards, never faster than 3x) instead of running on a timer. Letting go pauses it; the thread can be picked up again.
- "Knit it for me" (and `world.knit()`) runs the same thing without a hand: the accessible alternative. `Island.tsx` shows a polite live-region update ("Knitting… 40%"). With reduced motion it takes 2.5 s instead of 5.5 s.
- Pieces the rider has not earned yet never knit in, same as before (`isUnlocked` is read when the pull starts).
- The timed intro is still there: `world.playIntro()` (replay) is unchanged.
Our changes in `yarn-world/`: `weave.js` (pull-driven intro, `knit()`, `status`), `rope.js` (`grabFollow`), `mount.js` (`onStatus`, `knit`), `world.js` (`knit`, `status`), `guide.js` (its text label is off; the page shows "Pull the thread." as real text).
Screenshots: `screenshots/`.

## Notes
- The yarn ball, the quilt and the river are always there. The unlock set is read when the thread is pulled.
- "Preview the full island" shows everything without touching real stamps (good for the demo).
- Keys: `M` mutes. Sound starts after the first touch on the scene (browsers require it).
- The scene is about 480 KB of JavaScript, loaded only on `/island`.
