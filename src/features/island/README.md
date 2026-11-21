# Island

What: **My World**, the whole screen at `/world`: a knitted island that grows as the rider contributes on the map, with a small gift that can wait on it. `/island`, `/rewards` and `/my-challenges` redirect here.
Owner: Rachel. Only the owner edits this folder.

## How it fits together
- `Island.tsx`: the page. Full screen under the nav (like the map). Reads the rider's contribution count with `stampCount(useMyProgress())` from `features/explore/progress`. UI is only a title, one contextual knit button, one small status (with Retry) and a help button (`IslandHelp.tsx`: tips, sound, preview, credit). No counters, balances, feeds or tabs.
- `content.ts`: all text and `unlockSteps`: the journey, 12 steps, one per contribution (a bare quilt, river and yarn ball at 0; grass and flowers, a tree, pines, stones, the cottage, garden and fence, a sheep, more trees, the flock, the bridge and river life, kite and laundry, clouds). Each step lists how many pieces of each scene stage exist (`allowedFor`, `isIn`). Only existing pieces are used; more contributions are still recorded by the server but add nothing yet.
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
- **Explore:** after a successful submission `Celebration` shows the server's `tokensAwarded`, the stamp, and which island piece the new stamp unlocks. Two buttons: "Continue exploring" (stays on the map, nothing moves) and "Visit my world" (`/world`). Reopening a finished quest shows "Already in your collection" with no fanfare.
- **Map memory:** `features/explore/viewMemory.ts` keeps the camera and selected stop for the browser tab (sessionStorage). Next keeps pages mounted but hidden (`cacheComponents`), and a hidden map loses its camera, so `ExploreMap` puts it back when the page is shown again.
- **Island visits:** `seen.ts` remembers how many journey steps this browser has seen (display memory only). First visit: the yarn-pull opening, with every earned step knitted in. Later visits: the island is simply there, and each step earned since the last visit **drops onto it from above** (`dropIn` in `weave.js`; `world.dropIn` / `mount.js`), one after another, a beat after the page opens. Under reduced motion the pieces just appear. A step is remembered only after its pieces have landed. If the server cannot be reached, the island shows what this browser last saw and adds nothing.
- Every visit re-fetches stamps (`refreshProgress`) and re-plans, because the page stays mounted between visits.

## Notes
- The yarn ball, the quilt and the river are always there. The unlock set is read when the thread is pulled.
- "Preview the full island" shows everything without touching real stamps (good for the demo).
- Keys: `M` mutes. Sound starts after the first touch on the scene (browsers require it).
- The scene is about 480 KB of JavaScript, loaded only on `/world`.

## The gifts in the clouds
- Three wool-wrapped gifts hang on strings from the three clouds (`yarn-world/parcel.js`, built in `world.js` from `buildClouds`, so they sway with the clouds). The clouds are always there, and were moved lower and nearer the middle so the gifts stay in view over a whole camera turn at desktop size.
- Each gift is `locked` (faint and still), `ready` (full colour, soft glow, wiggles now and then) or `opened` (lid up, pompom out). Gift i opens when the journey reaches `giftMilestones[i]` steps (0, 5, 10): the first is always there, more come with more contributions. When a piece lands and unlocks a gift, it hops and the note says so. If progress cannot be loaded, only the first gift is ready.
- Poke or tap a gift (the target is larger than the box), or use the hidden "Open gift N" buttons (they show on keyboard focus). `GiftTicket.tsx` draws a small ticket below the gift, following it on screen: **the offer on one side, your journey on the other** (every step, ticks for what is on the island, Gift 1/2/3 marked where they open, and "Next gift after N more contributions"). Locked gifts say how many more contributions open them. Close with the button or Esc; nothing navigates, and the camera is held while it is open.
- **There is no real offer source yet.** `gifts.ts` holds three clearly labelled demos. "Reveal the code" shows an obvious example code (`EXAMPLE-ONLY-n`) with "works nowhere"; no real code is invented and no email is asked. "Opened" is remembered in the browser only (`seen.ts`), fine because demos have no value. A real offer needs a server-issued entitlement, claim and redemption state in the database, server-enforced expiry and abuse prevention; `Gift` in `gifts.ts` already has the fields.
- "Preview the full island" (help button) shows every gift ready.

## Behind the scenes (not shown on this page)
Submissions, verifications, token balance and like stamps are still recorded and returned by `/api/submissions`, `/api/community` and `/api/likes`. My World does not show them.
