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

## The little gift (parcel)
- `yarn-world/parcel.js`: a wool-wrapped box with a bow, a lid that lifts, a pompom that pops out, a soft halo and an occasional wiggle while closed (still under reduced motion). `buildParcel({ x, z, wrap, ribbon })` is reusable for more gifts. It is one more weave item (stage `parcel`), so it knits in with the world. Fixed spot: under the golden tree on the near side (`world.js`).
- It is present only when the server has confirmed at least one contribution (`plan.parcel` in `Island.tsx`). If progress cannot be loaded there is no gift and no new piece, and the page shows one small status with Retry.
- Poke or tap it (the target is larger than the box), or use the hidden "A little gift is waiting" button (it shows on keyboard focus). `GiftTicket.tsx` draws a small paper ticket next to the gift in the scene, following it on screen; close with the button or Esc. Nothing navigates, and the camera is held while the ticket is open.
- **There is no real offer source yet.** `gifts.ts` holds one clearly labelled demo (not redeemable, no code, no email asked). "Opened" is remembered in the browser only (`seen.ts`), which is fine because the demo has no value. A real offer needs a server-issued entitlement, claim and redemption state in the database, server-enforced expiry and abuse prevention; `Gift` in `gifts.ts` already has the fields (`status`, `code`, `instructions`).

## Behind the scenes (not shown on this page)
Submissions, verifications, token balance and like stamps are still recorded and returned by `/api/submissions`, `/api/community` and `/api/likes`. My World does not show them.
