# Passport

What: My Journey and Collection merged into one picture page. Route `/passport`.
Each finished contribution (completed report or checked fix) is a stamp; each stamp unlocks the next Boston landmark in the album. Tokens are the server's `tokenBalance`.
Owner: Louie. Only the owner edits this folder.

## Demo
`/passport?demo=empty`, `?demo=some`, `?demo=full` show made-up progress (`sample.ts`). Without the parameter the page reads the real `GET /api/submissions` through `useMyProgress`.

## Placeholders to replace
- **Unlock rule.** The i-th oldest stamp unlocks the i-th landmark in `landmarks/catalog.ts`. A real rule (a landmark per station, `stationLandmarks`) needs the station id on each submission, which `/api/submissions` does not return yet.
- **Pictures.** Landmark art is the existing `public/assets/landmarks`. Category badges use the Explore category icons.

## Not done
`/my-challenges` and `/rewards` still exist (nothing links to them from the nav). They go once this page is accepted.
