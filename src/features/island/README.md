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

## Things to explore on the island
Four small knitted objects on the near side of the island, each with one purpose. No cards float over the scene; the clouds are just clouds again.
- **Journal** (`yarn-world/journal.js`, a small book on a picnic mat): your history. **Three gifts** (`yarn-world/parcel.js`, wool-wrapped boxes): the first is a local treat that is always there; the other two are discoveries that open as the journey grows (`giftMilestones` 0, 5, 10 steps). A locked gift is faint and still; a ready one has a soft glow and wiggles now and then; an opened one has its lid up. Reduced Motion turns the wiggle and drift off.
- **Hover, focus or select** an object: it glows, and one compact glass label (`HotspotLabel.tsx`) appears above it ("A free cookie · Example gift · tap to open", "New discovery · 2 more contributions to open", "Your journal"). Only one at a time, never all. The label follows the object's real screen position, stays inside the screen edges and hides if the object is off screen. Keyboard users get hidden buttons (they show on focus) that also highlight the object.
- **Click or tap** an object: a small ticket opens beside it (`TicketFrame.tsx` picks above, below or beside so it does not cover the object, shrinks and scrolls if there is no room). Esc or the close button returns to the same view; nothing navigates.
  - **Journal ticket** (`JournalTicket.tsx`): the rider's real reports and checks from `/api/submissions`, with the status each really has (draft, coach has suggestions, passed the check but not finished, completed in Tada on a date, "MBTA has since marked this fixed", you said it works / is still broken). If history cannot load it says so with a Retry; it never presents a failed load as an empty journal. Finishing a mission here is not an MBTA report, and it says so.
  - **Gift ticket** (`GiftTicket.tsx`): the offer on one side, your journey on the other (every step, ticks for what is on the island, Gift 1/2/3 where they open, "Next gift after N more contributions"). Locked gifts say how many more contributions open them.
- **Camera:** it sways gently (about 29 degrees each way) instead of spinning, so the near-side objects never turn out of view; it pauses while you drag, while a pointer is on an object and while a ticket is open. It sits a little closer on wide screens and looks down more steeply on tall (phone) screens so the island fills the screen.
- **There is no real offer source yet.** `gifts.ts` holds three clearly labelled demos. "Reveal the code" shows an obvious example code (`EXAMPLE-ONLY-n`) with "works nowhere"; no real code is invented and no email is asked. "Opened" is remembered in the browser only (`seen.ts`), fine because demos have no value. A genuine offer must come from the server (an issued entitlement, claim and redemption state in the database, server-enforced expiry, abuse prevention) and `Gift` already has the fields; real and demo offers are told apart by `demo`.
- "Preview the full island" (help button) shows every gift ready.

## Behind the scenes (not shown on this page)
Submissions, verifications, token balance and like stamps are still recorded and returned by `/api/submissions`, `/api/community` and `/api/likes`. My World does not show them.
