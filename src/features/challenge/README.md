# Challenge

What: the quest page (Screen 2) and the unified submit form with AI review (Screen 3). Route `/challenge` (list) and `/challenge?id=<quest id>` (one quest).
Issue: see GitHub issues labelled `challenge`.
Owner: TBD. Only the owner edits this folder.

## Redesigning the screens? Read this first
The rules live in `useSubmission.ts`, the screens only draw. You can replace `Challenge.tsx`, `SubmitForm.tsx`, `PhotoField.tsx` and `ReviewPanel.tsx` completely, or build new ones in another folder, and the flow keeps working as long as the new screen uses the hook:

```tsx
const state = useAppState();            // null on the server and while loading
if (!state) return <Loading />;
const s = useSubmission(quest, state);  // call from a component rendered once state exists
```

What the hook gives a screen: `text` / `setText`, `photo` / `photoError` / `pickPhoto(file)` / `removePhoto()`, `check()` / `checking` / `aiError` / `review` (`{ result, isCurrent }`), `canCheck`, `canComplete` / `complete()`, `completed`, `status`, `hint` (a reason code, the screen picks the words), `rewardTokens`, `rewarded`. For lists use `submissionStatus()`, `tokenBalance()` and `resetEverything()` from `storage.ts`.

A new screen must still:
1. Disable Check and Complete from `canCheck` / `canComplete`, and show the `hint` reason.
2. Show the review as out of date when `review.isCurrent` is false.
3. Show `photoError` and `aiError` where the player can see them.
4. Keep the honesty copy: unofficial community mission, AI cannot verify facts, a photo is never proof, "completed in app" is not "sent to the MBTA".
5. Keep `<input type="file" accept="image/jpeg,image/png,image/webp">` to a single file.

Do not copy the rules into the screen. If a rule needs to change, change it in the hook.

## Checking a UI change
No automated tests ship in this folder yet: they need Vitest, which changes `package.json`, `package-lock.json` and `.github/workflows/ci.yml` (shared files). They are written and parked on a local branch (`louie/submit-flow-full`) and will go in as their own small PR.

Until then, after any UI change run `npm run lint && npx tsc --noEmit && npm run build`, then do this by hand in a browser:
1. `/challenge`: open a quest, type a vague line, press Check. Complete stays locked.
2. Add detail, Check again, Complete unlocks. Edit one word: the check turns out of date and Complete locks.
3. Add a PNG, refresh the page: text, photo, and check come back.
4. Complete: tokens go up once and the "nothing was sent to the MBTA" notice shows. Refresh: still completed.
5. Phone width (375px): no sideways scrolling.

## How it works
- `sample-quests.ts`: made-up SAMPLE quests for testing. Swap for live `/api/quests` data (teammate's `src/lib/mbta.ts`) and import its `Quest` type.
- `SubmitForm.tsx`: text, one photo (preview, replace, remove), Check with AI, Complete.
- `review.ts`: an offline PRACTICE reviewer. It reads text only. Replace `reviewDraft` with a call to `/api/review` (Gemini) when that exists. Keep its output shape.
- `storage.ts`: drafts, AI results, completions and tokens in localStorage (`tparty:v1`). Tokens are summed from reward events, one per quest.
- `photo.ts`: photo validation and IndexedDB storage. Photos never go to localStorage or our server.
- `content.ts`: all text and settings, including the [TBD] photo size limit and `requirePassToComplete`.

## Rules (docs/SPEC.md)
One form for every quest; AI never confirms facts or treats a photo as proof; "completed in app" never means "sent to the MBTA"; editing the draft makes the last AI check out of date; tokens once per quest.

## Camera
`PhotoField.tsx` has two hidden file inputs: **Add photo** (library or file picker) and **Take photo** (`capture="environment"`, opens the camera on phones; computers fall back to the file picker). Both feed the same `pickPhoto(file, { fromCamera? })` in `useSubmission.ts`, so validation, storage, the AI check and the "check is out of date" rule are shared.
- A camera photo is always re-saved by `shrinkPhoto` in `photo.ts`: longest side 1600 px, JPEG. Phone photos are often over the size limit, and re-saving drops hidden EXIF data such as GPS location.
- Any other photo over the size limit is shrunk once instead of rejected. If it is still too large, or the browser cannot re-save it, the player sees the "too large" message.
- A small photo from the picker is stored exactly as given.
- Not covered: HEIC files (the type check rejects them), and a live in-page camera preview (`getUserMedia`). Needs a real phone to confirm `capture` opens the camera app.

## How other screens link here
Always use `challengeHref(quest.id)` from `links.ts` (no id gives the quest list). It is the only place that knows the URL (`/challenge?id=<quest id>`), so the route can change without breaking links. The page is also in the nav (`src/lib/config.ts`, "Quests").

**For the map (`features/explore`, Rachel's folder):** the mission ticket / station sheet still uses its own placeholder challenges and a "Mark as completed" stand-in (`challengeFor` in `explore/content.ts`). To send a rider from a station to a quest, fetch `/api/quests`, pick the quests whose `stationId` matches the tapped station, and render `<Link href={challengeHref(quest.id)}>` in place of the stand-in. Quest ids are MBTA alert ids, so the map and this page agree as long as both use `quest.id` from `/api/quests`. The page currently only knows the three sample quests in `sample-quests.ts`; once it reads live quests, any `quest.id` from the map will open.

## Decisions made here (also belong in docs/DECISIONS.md, left out to avoid a merge conflict)
- Quest page is `/challenge?id=<id>`, read on the client, not `/challenges/[id]`: live quests are unknown at build time and Cache Components rejects unknown dynamic params.
- Sample quests and the offline practice reviewer stand in until `/api/quests` and `/api/review` are wired in.
- Complete unlocks only after a current AI check passes (`requirePassToComplete` in `content.ts`). [TBD] confirm with team.
- Photos stay in IndexedDB on the device. Limit is 4 MB, matching the server review route (`src/app/api/review/route.ts`).
- Submissions and tokens live in the browser for now. The teammate's database `submissions` table and `/api/submissions` overlap with this: pick one source of truth, then have `useSubmission` call the API.
