# Testing

Run `npm test` (Vitest, about 2 seconds). CI runs it on every PR, so a change that breaks one of these rules cannot merge quietly.

## What the tests protect
The rules live in code that has no markup, so any redesign of the screens keeps them as long as it keeps using that code.

| Area | Where the rules live | Tests |
|---|---|---|
| Submit flow: drafts, one photo, camera re-save, AI check goes out of date after any edit, Check/Complete locking, tokens once per quest, survives a refresh | `src/features/challenge/useSubmission.ts`, `storage.ts`, `photo.ts`, `review.ts` | `logic.test.ts`, `useSubmission.test.tsx` |
| Stats loading: live / labelled sample (404, 503) / error with retry, never sample numbers over a real failure, older and newer route shapes | `src/features/stats/useStats.ts`, `format.ts` | `useStats.test.tsx`, `format.test.ts` |
| Nav: every tab points at a page that exists, no duplicates | `src/lib/config.ts` (`site.nav`) | `src/lib/config.test.ts` |

## What the tests cannot see (check by hand after a redesign)
1. Looks, spacing, colours, and phone width (375 px, no sideways scrolling).
2. The honesty copy is still on screen: "unofficial community mission", "AI cannot verify facts, a photo is never proof", "completed in the app is not sent to the MBTA", the yellow "Sample data" banner on stats whenever sample numbers show.
3. Real photo storage (IndexedDB) and the phone camera. The tests replace storage with a Map, and no test can open a phone camera. On a real phone, Take photo must open the camera app.
4. Submit flow, by hand: `/challenge`, open a quest, type a vague line, Check (Complete stays locked); add detail, Check (Complete unlocks); edit one word (check goes out of date, Complete locks); add a photo, refresh (text, photo and check come back); Complete (tokens go up once, "nothing was sent to the MBTA" shows).

## Rules for changing a screen
- Keep using the hooks (`useSubmission`, `useStats`) and `site.nav`. Do not copy their rules into the screen.
- If a rule must change, change it in the hook and update its test in the same PR.
- Adding a nav tab? Add the page first, then the entry in `site.nav`, or the nav test fails.

## Notes
- The photo-storage tests use an in-memory stand-in, because the test browser (jsdom) cannot store files in IndexedDB.
- The tests reset browser storage between runs, so they never touch real data.
