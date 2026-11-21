# Explore

What: a real map of Boston with the T lines and one floating marker per station (Screen 1). Route `/explore`.
Issue: #2. Owner: Rachel. Only the owner edits this folder.

## How it fits together
- `Explore.tsx`: title and blurb (server). `ExploreLoader.tsx`: loads the map in the browser only (`next/dynamic`, `ssr: false`).
- `ExploreMap.tsx`: the map, the T lines, the markers. All map settings come from `src/lib/map.ts`.
- The look: OpenFreeMap streets repainted in our own tokens (`loadMapStyle` in `src/lib/map.ts`): cream land, blue water,
  faint streets, 3D buildings from zoom 13. Change a token in `globals.css` and the map follows.
- `TrainsLayer.tsx`: live trains as dots in their line colour, gliding between updates (every 15 seconds).
- Elevator outages: a red dot on the marker and the MBTA's own alert text in the sheet. That station's challenge becomes "Elevator check".
- Tapping a marker flies the camera down to the station.
- `StationMarker.tsx`: one pixel sprite per station. Bobs gently, springs up on hover (Motion). Grey until completed.
- `StationSheet.tsx`: opens on tap. Station name, its challenge, one progress bar per line ("3 of 22 stops").
- `progress.ts`: completed stations, saved in the browser (localStorage key in `content.ts`).
- `content.ts`: all text, the placeholder challenges, sprite paths and size.
- Data: `/api/subway` (`src/app/api/subway/route.ts`) reads lines, stops and shapes from the MBTA V3 API, cached for a day.
  If the MBTA cannot be reached it serves `subway-snapshot.json`, so the demo never depends on live data.
- Live data: `/api/subway/live` (`src/app/api/subway/live/route.ts`) reads train positions and elevator alerts, shared for 10 seconds.
  If the MBTA cannot be reached it serves `live-snapshot.json` and the map chip says "Saved sample · not live" (trains then stand still).

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
