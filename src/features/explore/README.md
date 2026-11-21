# Explore

What: a real, interactive map of Boston styled as a small architectural atlas (Screen 1). Route `/explore`.
Issue: #2. Owner: Rachel. Only the owner edits this folder.

## How it fits together
- `Explore.tsx`: just the map, full screen under the site nav (server). `ExploreLoader.tsx`: loads it in the browser only (`next/dynamic`, `ssr: false`).
- `ExploreMap.tsx`: puts the layers together. All map settings and colours come from `src/lib/map.ts`.
- `StationMarker.tsx`: three levels. A stop is a small ring in its line colour; a transfer hub is a larger ring;
  a mission (an elevator out, or a landmark stop) is a dashed ticket stamp. Completed turns filled or green; selected lifts.
- `LandmarkMarker.tsx`: the few miniature buildings floating over the map, each pinned to its real coordinates.
  They hover over a soft shadow, lift on hover, pop when selected, grow with zoom and hide when zoomed far out.
- `MissionTicket.tsx`: the small printed ticket that appears above the selected stop. "View mission" opens `StationSheet.tsx`.
- `TrainsLayer.tsx`: live trains as dots in their line colour.
- `progress.ts`: completed stations, saved in the browser. `content.ts`: all text, the sample missions and the landmark list.

## The look
- Palette: `ATLAS` in `src/lib/map.ts` (stone land, sage-grey water, ivory roads, sandstone buildings, taupe outlines, sage parks).
  These are typed-in colours from Rachel's brief; they should move to `globals.css` as tokens once the team agrees.
  The map's own layers are repainted (`loadMapStyle`); no filter sits over the map, so MBTA colours stay true.
- Background buildings: every real footprint, low contrast, with a hairline outline from zoom 14.
- T lines: official colours with a soft ivory edge. Selecting a stop brings its lines forward and dims the rest (`tLineLayers`).
- Motion: nothing moves on its own. Hover and selection use short springs; Reduced Motion turns them off.

## Adding the miniature buildings
The landmarks are listed in `content.ts` (`landmarks`). Each has real coordinates and the stop its ticket belongs to.
Until a landmark has art, a plain dashed block marks its spot. To add art:
1. Make a PNG with a see-through background, three-quarter view, about 240px wide.
2. Save it in `public/assets/explore/landmarks/`, for example `state-house.png`.
3. Add `art: "/assets/explore/landmarks/state-house.png"` to that landmark in `content.ts`.

## Data
- `/api/subway`: lines, stops and shapes from the MBTA V3 API, cached for a day, with `subway-snapshot.json` as fallback.
- `/api/subway/live`: train positions and elevator alerts, shared for 15 seconds, with `live-snapshot.json` as fallback
  (the chip then says "Saved sample · not live").
- Hospitals come from the map's own place data (`addStickerLayers`), from zoom 14.
- The MBTA allows 20 requests a minute without a key. Set `MBTA_API_KEY` in Vercel to lift that to 1,000.

## Choices made (change freely)
- Green B, C, D and E count as one Green Line (70 stops). Mattapan is its own line (8 stops).
- Missions are five unofficial sample challenges, always labelled as not from the MBTA.
- "Mark as completed" is a stand-in until the real challenge flow (`features/challenge`) exists.
- The sheet is built here on the Base UI dialog because `components/ui` has no Sheet yet.
- `screenshots/` holds the PR screenshots only; safe to delete after merge.
