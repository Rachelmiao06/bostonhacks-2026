# Missions

What: the guided "community mission" that replaces the old report form. Opens from the map card ("View mission").
Owner: Rachel. Only the owner edits this folder.

## The flow
Map card -> Overview -> Step 1 (when) -> Step 2 (what you observed) -> Step 3 (note + photo, optional) -> Review -> Done.
One purpose and one main button per screen. Back never loses an answer (answers are kept per quest in
localStorage `tada:mission:<id>`; the photo stays in memory only).

## Files
- `templates.ts`: one template per alert kind (elevator, escalator, access, station, closure, shuttle, suspension) with a
  safe `GENERIC` fallback. Questions, answer options and wording live here. Add a kind = add a case.
- `compose.ts`: turns the answers into the summary and into the text sent to the existing routes. Built ONLY from the
  rider's answers and the verified alert, so no date, observation or photo can be invented.
- `useMission.ts`: the rules. Calls the existing routes through `features/challenge/api.ts`:
  `/api/review` (AI safety check, report missions only) then `/api/submissions` (or `/api/verifications` for "check it's working again").
  "Done" is shown only after the server says it saved. "I haven't checked it yet" can never reach a submit.
- `MissionFlow.tsx` + `Parts.tsx`: the screens. `PixelIcon.tsx`: 8x8 pixel badges (icons only, never scenery).
- `depth.ts` + `DepthParts.tsx`: what makes one mission different from the next. Overview: ONE status block
  (how long, who reported it, whether any rider has checked, plus nth time in 90 days and MBTA's planned end) and,
  below the divider, MBTA's own directions behind a quiet "View MBTA directions" button. Done: "What your check did"
  (real rider counts from `/api/quests`) and progress along the line. Every part hides itself when its data is missing.
- Overview layout (in `MissionFlow.tsx`): chip and station, icon with an action title, the status block, a numbered
  "What you'll do", where to check, then one primary button. Only two soft-filled blocks, no outlined cards.
- `content.ts`: all the words.

## Rules that must stay true
- It is a Tada community observation, never an official MBTA report. Nothing is sent to the MBTA.
- The AI only checks and tidies what the rider wrote. A short answer is never a failure; at most ONE follow-up question is asked.
- Depth parts show only MBTA's words and real counts. An unknown count is not zero: say nothing. Never estimate.
- Progress on the done screen is the real count from `useMyProgress` (`stampCount`); nothing is invented.

## The world behind the card
Each mission now sits over a little miniature station that fills the screen (`features/challenge-diorama/`, loaded only when a
mission opens). `MissionFlow.tsx` passes it the rider's answers and nothing else: kind -> landmark, "when" -> day or dusk,
status tone -> light and movement, a note -> a speech bubble, and `done` -> the seal. It only DRAWS. It decides, saves and
rewards nothing: `confirmed` is true only when `useMission` says the server saved (or it was saved on an earlier visit), so
a failed save never shows a seal. The question card is glass over the world. `ContributePanel.tsx` (explore) was made
transparent for this and no longer closes when you tap outside it (the screen behind is now the main picture).

On wide screens (the panel is a side card) the whole world fits in the space beside it and the camera zooms gently (`zoom` 0.4 in `MissionWorld`), so it never fills the screen with a few stitches; on phones the world is larger and the camera zooms fully, because the card covers its lower part.
