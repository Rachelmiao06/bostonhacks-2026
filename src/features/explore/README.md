# Explore

What: a real map of Boston with the T lines and one floating marker per station (Screen 1). Route `/explore`.
Issue: #2. Owner: Rachel. Only the owner edits this folder.

## How it fits together
- `Explore.tsx`: just the map, full screen under the site nav, so other UI can be layered on top (server). `ExploreLoader.tsx`: loads the map in the browser only (`next/dynamic`, `ssr: false`).
- `ExploreMap.tsx`: the map, the T lines, the markers. All map settings come from `src/lib/map.ts`.
- The look: OpenFreeMap streets redrawn as a one-colour line drawing on cream paper (`loadMapStyle` in `src/lib/map.ts`),
  with 3D buildings from zoom 13. Only the things on top are colourful. The one colour is `BASE_TONE` in that file:
  `--sky` gives light blue (current), `--cherry` gives pink, `--steel` gives grey.
- `TrainsLayer.tsx`: live trains as dots in their line colour, gliding for two seconds after each update (every 15 seconds).
- Elevator outages: a red dot on the marker and the MBTA's own alert text in the sheet. That station's challenge becomes "Elevator check".
- Tapping a marker flies the camera down to the station.
- `StationMarker.tsx`: one pixel sprite per station. Bobs gently, springs up on hover (Motion). Grey until completed.
- `StationSheet.tsx`: opens on tap. Station name, its challenge, one progress bar per line ("3 of 22 stops").
- `progress.ts`: completed stations, saved in the browser (localStorage key in `content.ts`).
- `content.ts`: all text, the placeholder challenges, sprite paths and size.
- Data: `/api/subway` (`src/app/api/subway/route.ts`) reads lines, stops and shapes from the MBTA V3 API, cached for a day.
  If the MBTA cannot be reached it serves `subway-snapshot.json`, so the demo never depends on live data.
- Live data: `/api/subway/live` (`src/app/api/subway/live/route.ts`) reads train positions and elevator alerts, shared for 15 seconds.
  If the MBTA cannot be reached it serves `live-snapshot.json` and the map chip says "Saved sample · not live" (trains then stand still).

## Doodle look (涂鸦)
- Wobbly lines: an SVG filter (`DOODLE_FILTER` in `src/lib/map.ts`) nudges the map picture so straight lines look hand-drawn.
  `strength` is how far lines wander, `frequency` how often they bend. It switches off while the map is dragged, to keep dragging smooth.
- Scribbled water: `addDoodleTextures` draws a small crayon-stroke tile in the base tone and fills the water with it.
- Place names are still typeset (they wobble with everything else). Truly hand-lettered names need a handwriting font, which lives in the shared layout.

## Speed
- The street style and the T data start downloading the moment the map code arrives, side by side; streets show without waiting for the T.
- The marker bob is a browser-native animation (see `StationMarker.tsx`), so 125 markers cost nothing while tiles load. Motion only runs on hover.
- Trains redraw for two seconds per update, not constantly.
- The MBTA allows 20 requests a minute without a key. We use 7 once a day plus 8 a minute while someone is watching.
  Set `MBTA_API_KEY` in Vercel (free from api-v3.mbta.com) to lift that to 1,000.

## Swapping in the real art
Replace the files in `public/assets/explore/`, keeping the names: `marker-red.png`, `marker-orange.png`,
`marker-green.png`, `marker-blue.png`, `marker-mattapan.png`. Any square size works; they are drawn at
`spriteSize` (in `content.ts`) with crisp pixels. A station on two lines uses its first line's sprite.

## Choices made (change freely)
- Green B, C, D and E count as one Green Line (70 stops). Mattapan is its own line (8 stops).
- Challenges are five unofficial sample missions, one per station, always labelled as not from the MBTA.
- "Mark as completed" is a stand-in until the real challenge flow (`features/challenge`) exists.
- The sheet is built here on the Base UI dialog because `components/ui` has no Sheet yet.
- `screenshots/` holds the PR screenshots only; safe to delete after merge.
