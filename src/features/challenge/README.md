# Challenge

What: the quest hub at `/challenge` (the list of live quests) and the live quest page at `/challenges/[id]` (id = a quest id from `/api/quests`).

## Who owns what
- **Louie** (quest hub at `/challenge`): everything in `hub/` (`Hub.tsx`, `useQuestHub.ts`, `api.ts`, `content.ts`), `links.ts`, `PhotoField.tsx`, `photo.ts`.
- **Rachel** (one quest at `/challenges/[id]`): `QuestPage.tsx`, `ReportForm.tsx`, `VerifyForm.tsx`, `RewardCard.tsx`, `useQuest.ts`, `useReport.ts`, `api.ts`, and `src/app/challenges/[id]/`.
- **Shared in this folder:** `content.ts`, one section each. `PhotoField.tsx` and `photo.ts` are Louie's files that Rachel's report form uses; change them together.

One quest = `/challenges/[id]`. The report rules are `useReport` (the server is the source of truth).

## Quest hub: /challenge
`src/app/challenge/page.tsx` renders `hub/Hub.tsx`. It lists live quests from `/api/quests` (report and verify), each card linking with `challengeHref(quest.id)` to `/challenges/<id>`, with optional filters by line and by type.
- `hub/useQuestHub.ts` holds all the logic (loading, errors, filters, the token balance). `Hub.tsx` only draws, so the screen can be redesigned freely as long as it keeps using the hook.
- **Tokens come from the server:** `GET /api/submissions?userId=` with `getRiderId()` from `src/lib/rider.ts`. The browser never counts tokens. When the balance cannot be read (database not connected, or a failure) the screen says so instead of showing 0.
- If MBTA could not be reached, the quests are saved data and the hub says so in a banner.
- Old links `/challenge?id=<id>` redirect to `/challenges/<id>` (client side, in `Hub.tsx`).
- A quest that the server says is done shows a "Done" badge.
- `hub/screenshots/` holds PR screenshots only; safe to delete after merge.

## Live page: /challenges/[id]
- `QuestPage.tsx` + `useQuest.ts`: details from `/api/quests` (no extra MBTA call), Community Mission label, "quest not found" page.
- `ReportForm.tsx` + `useReport.ts`: guided steps (Write → Check with AI → Revise → Complete), tap-to-add question starters, text and/or one photo, `/api/review` check, "not checked" after any edit, Complete via `/api/submissions` only after a passing check on the unchanged report. Text is saved to localStorage on every keystroke; photos stay in memory (shrunk under 4 MB) and are never stored.
- `VerifyForm.tsx`: "Working again" / "Still broken" + optional note → `/api/verifications`.
- `RewardCard.tsx`: tokens with a small animation (still under Reduced Motion), "does not send anything to the MBTA", optional "Also tell the MBTA" link (saves `handedOff: true` for report quests).
- `api.ts`: the four API calls; errors come back as plain sentences.
- Rider id: `src/lib/rider.ts` (shared).

## Redesigning the screens? Read this first
Each screen has one hook that owns its rules, and the screen only draws. Restyle freely; keep using the hook.
- **Hub:** `hub/useQuestHub.ts`. A new hub screen must still: say plainly when the token balance cannot be read (never show 0), show the saved-data banner when `source` is `"snapshot"`, show the error with a retry, keep the "Community mission, unofficial" label and the "T Party is not the MBTA" note, and link every card with `challengeHref(quest.id)`.
- **One quest:** `useReport.ts` (Rachel's). Its rules are in its own section above: not checked after any edit, Complete only after a passing check on the unchanged report, the server is the source of truth.
- Keep the honesty copy everywhere: unofficial community mission, AI cannot verify facts, a photo is never proof, "completed in the app" is not "sent to the MBTA".
- Do not copy rules into a screen. If a rule must change, change it in the hook.

## Checking a UI change
No automated tests ship in this folder. After any UI change run `npm run lint && npx tsc --noEmit && npm run build`, then check by hand in a browser:
1. `/challenge`: live quests load, the filters narrow the list, and a card opens `/challenges/<id>`.
2. With the database connected: the token balance shows a number. Without it, the balance says it is unavailable (never 0).
3. `/challenge?id=<a quest id>` redirects to `/challenges/<that id>`.
4. On a quest: write, Check with AI, edit (the check goes out of date), Check again, Complete. Tokens go up once and "nothing was sent to the MBTA" shows.
5. Phone width (375 px): no sideways scrolling.

## How it works
- `hub/`: the quest hub. `useQuestHub.ts` loads `/api/quests` and the rider's token balance and filters the list; `Hub.tsx` draws it; `api.ts` is its two fetches; `content.ts` is its text.
- `links.ts`: the only place that builds challenge URLs (`challengeHref`).
- `PhotoField.tsx` and `photo.ts`: the photo picker (library and camera) and photo rules (type, size, `shrinkPhoto`, `metaFor`, the `PhotoState` type). Used by Rachel's report form.
- `content.ts`: text and settings, one section each.

## Rules (docs/SPEC.md)
One form for every quest; AI never confirms facts or treats a photo as proof; "completed in app" never means "sent to the MBTA"; editing the report makes the last AI check out of date; tokens once per quest.

## Camera
`PhotoField.tsx` has two hidden file inputs: **Add photo** (library or file picker) and **Take photo** (`capture="environment"`, opens the camera on phones; computers fall back to the file picker). Both feed the same `pickPhoto(file, { fromCamera? })` in `useReport.ts`, so validation, the AI check and the "check is out of date" rule are shared.
- A camera photo is always re-saved by `shrinkPhoto` in `photo.ts`: longest side 1600 px, JPEG. Phone photos are often over the size limit, and re-saving drops hidden EXIF data such as GPS location.
- Any other photo over the size limit is shrunk once instead of rejected. If it is still too large, or the browser cannot re-save it, the player sees the "too large" message.
- A small photo from the picker is used exactly as given.
- Not covered: HEIC files (the type check rejects them), and a live in-page camera preview (`getUserMedia`). Needs a real phone to confirm `capture` opens the camera app.

## How other screens link here
Always use `challengeHref` from `links.ts`. It is the only place that builds these URLs:
- `challengeHref(quest.id)` gives `/challenges/<id>`, the live one-quest page (report or verify). `quest.id` is the MBTA alert id from `/api/quests`.
- `challengeHref()` with no id gives `/challenge`, the quest hub (the list). The "Quests" tab in the nav (`src/lib/config.ts`) points there.

**For the map (`features/explore`):** link a station's quest with `<Link href={challengeHref(quest.id)}>`, using quests from `/api/quests` whose `stationId` matches the tapped station. Do not embed the report or verify form in the map, and do not write `/challenges/...` by hand.

## Decisions made here (also belong in docs/DECISIONS.md, left out to avoid a merge conflict)
- `/challenge` is the quest hub and `/challenges/<id>` is one quest. Old `/challenge?id=<id>` links redirect.
- The browser-only practice flow (sample quests, offline reviewer, tokens in localStorage) is retired. Tokens, submissions and the AI check live on the server.
- Photo limit is 4 MB, matching the server review route (`src/app/api/review/route.ts`).
- The hub reads the token balance from `GET /api/submissions?userId=` and never counts tokens in the browser.
