# Explore

What: a real, interactive map of Boston styled as a small architectural atlas (Screen 1). Route `/explore`.
Issue: #2. Owner: Rachel. Only the owner edits this folder.

## How it fits together
- The map is the home page (`/`); `/explore` shows the same thing.
- `ExploreMap.tsx`: puts the layers together. Map settings and the map's own colours come from `src/lib/map.ts`.
- `quests.ts`: open problems from `/api/quests` (no extra MBTA call), grouped by subway stop and clustered by on-screen distance.
- `category.tsx` + `categories` in `content.ts`: four kinds built only from what MBTA alerts contain
  (Service changes, Accessibility, Escalators & station, Check it's fixed). No cleanliness or crowding: there is no data for them.
- `ProblemMarker.tsx`: a pin per stop with problems (most urgent category, count) and a cluster bubble when pins would overlap.
- `verified.ts` + `PinFace` in `ProblemMarker.tsx`: a pin turns a quiet green only when its source is named:
  "MBTA marked this working again · <time>" (from `Quest.resolvedAt`) or "Riders report it is working · <n> riders"
  (no live data yet). Preview at `/explore/verified`. Never says "fixed".
- `ProblemTicket.tsx`: the small glass card for a stop: category chip, the mission question, one line, "View mission". Pinned above the stop on wide screens, docked at the bottom on phones.
- `ContributePanel.tsx`: the panel over the map. It only hosts `features/missions` (the guided mission). The old
  `ReportFlow.tsx` is gone; `VerifyFlow.tsx` is still used by the 3D-world speech bubble (`WorldQuest.tsx`).
- `Celebration.tsx`: pixel train + stamp after a contribution; static with Reduced Motion.
- `progress.ts`: this rider's contributions from `/api/submissions`, shared by the map, My Journey and Collection.
- `StationMarker.tsx`, `LandmarkMarker.tsx`, `TrainsLayer.tsx`: quiet stop rings, floating landmarks, live trains.
- A link like `/?quest=<id>` opens that problem's ticket.

## The first visit: gate, dive, small world
- `DiveGate.tsx` (in the first download): the welcome. A small frosted-glass card (bottom-left on wide screens, a bottom sheet on phones): Use my location, Choose a station (search), or Just explore the map. Location errors say why (blocked, unavailable, timed out).
- `onboarding.ts`: versioned local record of what was already shown (`welcomed`, `mapHint`, `ticketHint`). A welcomed browser skips the card and opens the map. `Hints.tsx`: the one-time map callout over a real pin, and the "Seen this too?" line inside a ticket.
  The map downloads behind it (`prefetch.ts` starts the subway and problem downloads at page load) and the gate shows what is ready.
- `world.ts`: GSAP camera flight (`flyCamera`) from high over Boston down to one stop, the 3D building layer (real footprints raised, only inside an 800 m circle),
  and `chooseWorld` (nearest stop; if nothing is broken there, the closest problem; outside Boston: Park Street).
- `ExploreMap.tsx` has three modes: `intro` (behind the gate), `world` (the small 3D district: fog edge, leash, only nearby pins) and `atlas` (the original whole-city map).
- `WorldQuest.tsx`: the question in a speech bubble, answer by typing, AI coach replies, stamp. Uses PR #14's `useReport`; verify quests reuse `VerifyFlow`.
- Location never leaves the browser and is not stored. A shared link `/?quest=<id>` skips the gate. Reduced Motion: no flight, no typing effect, no pulses.

## The look
- Palette: `ATLAS` in `src/lib/map.ts` (stone land, sage-grey water, ivory roads, sandstone buildings, taupe outlines, sage parks).
  These are typed-in colours from Rachel's brief; they should move to `globals.css` as tokens once the team agrees.
  The map's own layers are repainted (`loadMapStyle`); no filter sits over the map, so MBTA colours stay true.
- Background buildings: every real footprint, low contrast, with a hairline outline from zoom 14.
- T lines: official colours with a soft ivory edge. Selecting a stop brings its lines forward and dims the rest (`tLineLayers`).
- Motion: nothing moves on its own. Hover and selection use short springs; Reduced Motion turns them off.

## Adding the miniature buildings
The landmarks are listed in `content.ts` (`landmarks`). Each has real coordinates and can optionally be associated with a station ticket.
Each landmark ID selects a matching pixel grid in `PixelLandmark.tsx`. Edit its rows to change the silhouette. The palette and CSS colour overrides live in the same file. Give each landmark a story of up to three sentences. The opening map shows landmarks alongside station rings and problem pins or clusters.

## Data
- `/api/subway`: lines, stops and shapes from the MBTA V3 API, cached for a day, with `subway-snapshot.json` as fallback.
- `/api/subway/live`: train positions and elevator alerts, shared for 15 seconds, with `live-snapshot.json` as fallback
  (the chip then says "Saved sample · not live").
- Hospitals come from the map's own place data (`addStickerLayers`), from zoom 14.
- The MBTA allows 20 requests a minute without a key. Set `MBTA_API_KEY` in Vercel to lift that to 1,000.

## Choices made (change freely)
- Green B, C, D and E count as one Green Line (70 stops). Mattapan is its own line (8 stops).
- Problems whose stop is not on the subway map (bus or commuter rail only) are not shown.
- Progress is hidden, not faked, when the database is unavailable.
- The panel is built here on the Base UI dialog because `components/ui` has no Sheet yet.
- `screenshots/` holds the PR screenshots only; safe to delete after merge.
