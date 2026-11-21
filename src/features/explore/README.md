# Explore

What: a real map of Boston with the T lines and one floating marker per station (Screen 1). Route `/explore`.
Issue: #2. Owner: Rachel. Only the owner edits this folder.

## How it fits together
- `Explore.tsx`: title and blurb (server). `ExploreLoader.tsx`: loads the map in the browser only (`next/dynamic`, `ssr: false`).
- `ExploreMap.tsx`: the map, the T lines, the markers. All map settings come from `src/lib/map.ts`.
- `StationMarker.tsx`: one pixel sprite per station. Bobs gently, springs up on hover (Motion). Grey until completed.
- `StationSheet.tsx`: opens on tap. Station name, its challenge, one progress bar per line ("3 of 22 stops").
- `progress.ts`: completed stations, saved in the browser (localStorage key in `content.ts`).
- `content.ts`: all text, the placeholder challenges, sprite paths and size.
- Data: `/api/subway` (`src/app/api/subway/route.ts`) reads lines, stops and shapes from the MBTA V3 API, cached for a day.
  If the MBTA cannot be reached it serves `subway-snapshot.json`, so the demo never depends on live data.

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
