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
- **Not in the nav.** Main's three tabs (Explore / Report / My Tada) already place My Challenges under Explore and Rewards under My Tada, so this page is reachable only by its address, `/passport`. If the team likes it, it can replace `/my-challenges` and `/rewards` (or become the My Tada page); that is a nav change in `lib/config.ts`, which is Rachel's shared file.
- `/my-challenges` and `/rewards` are untouched.
- Unit tests for `model.ts` are not here because the test runner is in PR #13.
